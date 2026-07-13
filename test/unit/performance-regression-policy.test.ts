import { describe, expect, it } from 'vitest'
import { evaluatePerformanceScenario } from '../../scripts/performance-regression-policy.mjs'

const baseline = {
  current: 70,
  expected: 100,
  currentRelative: 1,
  expectedRelative: 1,
  minRatio: 0.75,
  sameEnvironment: true,
}

describe('performance regression policy', () => {
  it('calibrates an absolute slowdown when the comparison workload slows equally', () => {
    expect(evaluatePerformanceScenario(baseline)).toMatchObject({
      absoluteRatio: 0.7,
      relativeRatio: 1,
      calibrationRatio: 0.7,
      pass: true,
      status: 'CALIBRATED',
      reason: 'host-load',
    })
  })

  it('still rejects a schema-dsl-specific relative regression', () => {
    expect(evaluatePerformanceScenario({
      ...baseline,
      currentRelative: 0.7,
    })).toMatchObject({
      pass: false,
      status: 'FAIL',
      reason: 'relative',
    })
  })

  it('rejects an absolute regression when the comparison workload remains stable', () => {
    expect(evaluatePerformanceScenario({
      ...baseline,
      currentRelative: 0.8,
    })).toMatchObject({
      calibrationRatio: 0.875,
      pass: false,
      status: 'FAIL',
      reason: 'absolute',
    })
  })

  it('uses only the relative comparison across different environments', () => {
    expect(evaluatePerformanceScenario({
      ...baseline,
      sameEnvironment: false,
    })).toMatchObject({ pass: true, status: 'PASS' })
  })
})
