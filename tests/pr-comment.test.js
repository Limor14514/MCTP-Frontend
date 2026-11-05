import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildComment,
  buildLighthouseComment,
  LIGHTHOUSE_MARKER,
  MARKER,
  parseCoverage,
  parseJunit,
  upsertComment,
} from '../scripts/pr-comment.mjs'

test('buildLighthouseComment only carries the Lighthouse section', () => {
  const body = buildLighthouseComment({
    lighthouse: 'Lighthouse 性能 85 · 无障碍 96；1 warnings, 0 errors',
    buildUrl: 'http://jenkins/job/MCTP-FE/job/PR-1/1/',
  })
  assert.ok(body.startsWith(LIGHTHOUSE_MARKER))
  assert.match(body, /### Lighthouse 结果/)
  assert.match(body, /性能 85/)
  assert.equal(body.includes('mctp-ci-report'), false)
  assert.match(body, /\[查看 Jenkins 构建\]/)
})

test('parseJunit counts tests, failures and skipped cases', () => {
  const xml = `<testsuite tests="3"><testcase name="a"/><testcase name="b"><failure/></testcase><testcase name="c"><skipped/></testcase></testsuite>`
  assert.deepEqual(parseJunit(xml), { tests: 3, failed: 1, skipped: 1 })
  assert.deepEqual(parseJunit('not xml'), { tests: 0, failed: 0, skipped: 0 })
})

test('parseCoverage extracts the lines percentage', () => {
  const text = 'ℹ all files                     |  93.76 |    90.51 |   97.56 |'
  assert.equal(parseCoverage(text), '93.76% lines')
  assert.equal(parseCoverage('no coverage here'), '')
})

test('buildComment renders every available report section', () => {
  const body = buildComment({
    lighthouse: 'Lighthouse 性能 92 · 无障碍 100；1 warnings, 0 errors',
    tests: { tests: 43, failed: 0, skipped: 2 },
    coverage: '93.76% lines',
    buildUrl: 'http://jenkins/job/MCTP-FE/job/PR-1/2/',
  })
  assert.ok(body.startsWith(MARKER))
  assert.match(body, /\*\*Lighthouse\*\*：性能 92/)
  assert.match(body, /\*\*测试\*\*：41 通过 \/ 0 失败 \/ 2 跳过/)
  assert.match(body, /\*\*覆盖率\*\*：93\.76% lines/)
  assert.match(body, /\[查看 CI 构建\]/)
})

test('buildComment subtracts failures and skipped cases from passed tests', () => {
  const body = buildComment({ tests: { tests: 3, failed: 1, skipped: 1 } })
  assert.match(body, /\*\*测试\*\*：1 通过 \/ 1 失败 \/ 1 跳过/)
})

test('buildComment skips unavailable reports instead of printing noise', () => {
  const body = buildComment({
    lighthouse: 'Lighthouse: assertion results unavailable',
    tests: null,
    coverage: '',
    buildUrl: '',
  })
  assert.equal(body.includes('Lighthouse'), false)
  assert.equal(body.includes('查看 Jenkins 构建'), false)
  assert.match(body, /本次构建没有可汇总的报告/)
})

test('upsertComment searches later pages before creating a comment', async () => {
  const calls = []
  const request = async (path, init) => {
    calls.push({ path, init })
    if (path.includes('?')) {
      if (path.endsWith('page=1')) return Array.from({ length: 100 }, (_, id) => ({ id, body: 'other' }))
      return [{ id: 101, body: `${MARKER}\nold report` }]
    }
    return null
  }

  const result = await upsertComment(
    { repo: 'owner/repo', pullRequest: '12', body: `${MARKER}\nnew report`, marker: MARKER, token: 'token' },
    request,
  )

  assert.deepEqual(result, { action: 'updated', id: 101, duplicates: 0 })
  assert.equal(calls.length, 3)
  assert.equal(calls[0].path.endsWith('page=1'), true)
  assert.equal(calls[1].path.endsWith('page=2'), true)
  assert.equal(calls[2].init.method, 'PATCH')
})

test('upsertComment removes all duplicate marked comments across pages', async () => {
  const calls = []
  const request = async (path, init) => {
    calls.push({ path, init })
    if (path.includes('?')) {
      if (path.endsWith('page=1')) {
        return Array.from({ length: 100 }, (_, id) => ({
          id,
          body: id < 2 ? MARKER : 'other',
        }))
      }
      return [{ id: 101, body: MARKER }]
    }
    return null
  }

  const result = await upsertComment(
    { repo: 'owner/repo', pullRequest: '12', body: MARKER, marker: MARKER, token: 'token' },
    request,
  )

  assert.deepEqual(result, { action: 'updated', id: 0, duplicates: 2 })
  assert.deepEqual(
    calls.filter(({ init }) => init.method === 'DELETE').map(({ path }) => path),
    ['/repos/owner/repo/issues/comments/1', '/repos/owner/repo/issues/comments/101'],
  )
})
