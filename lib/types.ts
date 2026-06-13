export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO'

export interface Finding {
  id: string
  title: string
  description: string
  severity: Severity
  category: 'HEADERS' | 'DEPENDENCIES' | 'XSS' | 'GENERAL'
  recommendation: string
  cve?: string
  fixSnippet?: string
}

export interface ScanResult {
  target: string
  scanType: 'URL' | 'GITHUB'
  timestamp: string
  riskScore: number
  riskLevel: 'SECURE' | 'MODERATE' | 'HIGH' | 'CRITICAL'
  findings: Finding[]
  summary: {
    critical: number
    high: number
    medium: number
    low: number
    total: number
  }
}
