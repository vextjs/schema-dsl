export function evaluatePerformanceScenario({
  current,
  expected,
  currentRelative,
  expectedRelative,
  minRatio,
  sameEnvironment,
}) {
  const absoluteRatio = expected > 0 ? current / expected : 0
  const relativeRatio = expectedRelative > 0 ? currentRelative / expectedRelative : 0
  const baselineComparison = expectedRelative > 0 ? expected / expectedRelative : 0
  const currentComparison = currentRelative > 0 ? current / currentRelative : 0
  const calibrationRatio = baselineComparison > 0 ? currentComparison / baselineComparison : 0

  if (relativeRatio < minRatio) {
    return { absoluteRatio, relativeRatio, calibrationRatio, pass: false, status: 'FAIL', reason: 'relative' }
  }
  if (!sameEnvironment || absoluteRatio >= minRatio) {
    return { absoluteRatio, relativeRatio, calibrationRatio, pass: true, status: 'PASS', reason: 'within-baseline' }
  }
  if (calibrationRatio < minRatio) {
    return { absoluteRatio, relativeRatio, calibrationRatio, pass: true, status: 'CALIBRATED', reason: 'host-load' }
  }
  return { absoluteRatio, relativeRatio, calibrationRatio, pass: false, status: 'FAIL', reason: 'absolute' }
}
