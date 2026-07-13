export interface PerformanceScenarioInput {
  current: number
  expected: number
  currentRelative: number
  expectedRelative: number
  minRatio: number
  sameEnvironment: boolean
}

export interface PerformanceScenarioResult {
  absoluteRatio: number
  relativeRatio: number
  calibrationRatio: number
  pass: boolean
  status: 'PASS' | 'CALIBRATED' | 'FAIL'
  reason: 'relative' | 'within-baseline' | 'host-load' | 'absolute'
}

export function evaluatePerformanceScenario(input: PerformanceScenarioInput): PerformanceScenarioResult
