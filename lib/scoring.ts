import { Finding, ScanResult } from './types'

const SEVERITY_SCORES = {
  CRITICAL: 30,
  HIGH: 15,
  MEDIUM: 8,
  LOW: 3,
  INFO: 0
}

export function calculateRisk(
  target: string,
  scanType: 'URL' | 'GITHUB',
  findings: Finding[]
): ScanResult {
  
  let rawScore = 0
  const summary = { critical: 0, high: 0, medium: 0, low: 0, total: 0 }

  for (const finding of findings) {
    rawScore += SEVERITY_SCORES[finding.severity] || 0
    if (finding.severity === 'CRITICAL') summary.critical++
    if (finding.severity === 'HIGH') summary.high++
    if (finding.severity === 'MEDIUM') summary.medium++
    if (finding.severity === 'LOW') summary.low++
    if (finding.severity !== 'INFO') summary.total++
  }

  // Cap at 100
  const riskScore = Math.min(rawScore, 100)

  const riskLevel =
    riskScore >= 75 ? 'CRITICAL' :
    riskScore >= 45 ? 'HIGH' :
    riskScore >= 20 ? 'MODERATE' :
    'SECURE'

  // Sort findings by severity
  const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 }
  const sortedFindings = findings.sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  )

  return {
    target,
    scanType,
    timestamp: new Date().toISOString(),
    riskScore,
    riskLevel,
    findings: sortedFindings,
    summary
  }
}
