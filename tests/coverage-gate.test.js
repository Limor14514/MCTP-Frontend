import test from 'node:test'
import assert from 'node:assert/strict'
import { checkCoverage, coverageValue } from '../scripts/coverage-gate.mjs'

const REPORT = 'ℹ all files                     |  72.55 |    80.10 |   75.00 |'

test('coverageValue reads the lines percentage', () => {
  assert.equal(coverageValue(REPORT), 72.55)
  assert.ok(Number.isNaN(coverageValue('nothing here')))
})

test('checkCoverage passes when above the threshold', () => {
  assert.deepEqual(checkCoverage(REPORT, 70), {
    ok: true,
    value: 72.55,
    message: '行覆盖率 72.55%（下限 70%）',
  })
})

test('checkCoverage fails when below the threshold or unparsable', () => {
  assert.equal(checkCoverage(REPORT, 80).ok, false)
  assert.equal(checkCoverage('no coverage', 70).ok, false)
})

test('checkCoverage accepts the exact threshold and rejects just below it', () => {
  assert.equal(checkCoverage('all files | 70.00 | 80 | 75 |', 70).ok, true)
  assert.equal(checkCoverage('all files | 69.99 | 80 | 75 |', 70).ok, false)
})
