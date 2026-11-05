#!/usr/bin/env node
// 在 PR 上新增/更新一条 CI 汇总评论（Lighthouse / 测试 / 覆盖率）。
// 用 HTML 注释标记做幂等更新，重复构建只更新同一条评论。
import fs from 'node:fs'
import { pathToFileURL } from 'node:url'

export const MARKER = '<!-- mctp-ci-report -->'
export const LIGHTHOUSE_MARKER = '<!-- mctp-lighthouse -->'
export const LEGACY_MARKER = LIGHTHOUSE_MARKER

export function parseJunit(xml) {
  const tests = (xml.match(/<testcase\b/g) ?? []).length
  const failures = (xml.match(/<failure\b/g) ?? []).length
  const errors = (xml.match(/<error\b/g) ?? []).length
  const skipped = (xml.match(/<skipped\b/g) ?? []).length
  return { tests, failed: failures + errors, skipped }
}

export function parseCoverage(text) {
  const match = text.match(/all files\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)/)
  return match ? `${match[1]}% lines` : ''
}

export function buildComment({ lighthouse, tests, coverage, buildUrl }) {
  const sections = [MARKER, '### CI 报告', '']
  if (lighthouse && !/unavailable/i.test(lighthouse)) {
    sections.push(`- **Lighthouse**：${lighthouse.replace(/^Lighthouse\s*[:：]?\s*/, '')}`)
  }
  if (tests && tests.tests > 0) {
    sections.push(`- **测试**：${tests.tests - tests.failed - tests.skipped} 通过 / ${tests.failed} 失败 / ${tests.skipped} 跳过`)
  }
  if (coverage) sections.push(`- **覆盖率**：${coverage}`)
  if (sections.length === 3) sections.push('- 本次构建没有可汇总的报告')
  if (buildUrl) sections.push('', `[查看 CI 构建](${buildUrl})`)
  return sections.join('\n')
}

export function buildLighthouseComment({ lighthouse, buildUrl }) {
  const sections = [LIGHTHOUSE_MARKER, '### Lighthouse 结果', '']
  const text = (lighthouse || '').replace(/^Lighthouse\s*[:：]?\s*/, '').trim()
  sections.push(text || '本次构建没有 Lighthouse 报告')
  if (buildUrl) sections.push('', `[查看 Jenkins 构建](${buildUrl})`)
  return sections.join('\n')
}

function readIfExists(path) {
  try {
    return fs.readFileSync(path, 'utf8')
  } catch {
    return ''
  }
}

function readReports() {
  const junit = readIfExists('junit.xml')
  return {
    junit: junit ? parseJunit(junit) : null,
    coverage: parseCoverage(readIfExists('coverage.txt')),
  }
}

async function github(path, init, token) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'mctp-jenkins',
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
  if (!response.ok) {
    const body = await response.text()
    throw new Error(`GitHub ${response.status}: ${body.slice(0, 300)}`)
  }
  if (response.status === 204) return null
  return response.json()
}

async function main() {
  const token = process.env.GH_TOKEN
  const repo = process.env.GH_REPO
  const pullRequest = process.env.PR_NUMBER
  if (!token || !repo || !pullRequest) {
    console.log('缺少 GH_TOKEN / GH_REPO / PR_NUMBER，跳过 PR 评论')
    return
  }
  const lighthouseKind = process.env.REPORT_KIND === 'lighthouse'
  const { junit, coverage } = readReports()
  const body = lighthouseKind
    ? buildLighthouseComment({ lighthouse: process.env.LH_SUMMARY, buildUrl: process.env.BUILD_URL })
    : buildComment({
        lighthouse: process.env.LH_SUMMARY,
        tests: junit,
        coverage,
        buildUrl: process.env.BUILD_URL,
      })
  const marker = lighthouseKind ? LIGHTHOUSE_MARKER : MARKER
  const comments = await github(`/repos/${repo}/issues/${pullRequest}/comments?per_page=100`, {}, token)
  const matches = comments.filter((comment) => comment.body?.includes(marker))
  if (matches.length) {
    const [keep, ...duplicates] = matches
    await github(
      `/repos/${repo}/issues/comments/${keep.id}`,
      { method: 'PATCH', body: JSON.stringify({ body }) },
      token,
    )
    for (const duplicate of duplicates) {
      await github(`/repos/${repo}/issues/comments/${duplicate.id}`, { method: 'DELETE' }, token)
    }
    console.log(`已更新 PR #${pullRequest} 的评论 #${keep.id}（清理 ${duplicates.length} 条重复）`)
    return
  }
  const created = await github(
    `/repos/${repo}/issues/${pullRequest}/comments`,
    { method: 'POST', body: JSON.stringify({ body }) },
    token,
  )
  console.log(`已新增 PR #${pullRequest} 的评论 #${created.id}`)
}

const entry = process.argv[1] ? pathToFileURL(process.argv[1]).href : ''
if (import.meta.url === entry) {
  main().catch((error) => console.log(`PR 评论失败（不影响构建结果）：${error.message}`))
}
