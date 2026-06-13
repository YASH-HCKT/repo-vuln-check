import { Finding } from '../types'

export async function scanSSL(url: string): Promise<Finding[]> {
  const findings: Finding[] = []

  try {
    // Check if HTTP redirects to HTTPS
    if (url.startsWith('https://')) {
      const httpUrl = url.replace('https://', 'http://')
      try {
        const res = await fetch(httpUrl, {
          redirect: 'manual',
          signal: AbortSignal.timeout(5000)
        })
        const location = res.headers.get('location')
        if (!location || !location.startsWith('https://')) {
          findings.push({
            id: 'no-http-redirect',
            title: 'HTTP Does Not Redirect to HTTPS',
            description: 'Visiting the HTTP version of this site does not automatically redirect to HTTPS.',
            severity: 'HIGH',
            category: 'GENERAL',
            recommendation: 'Configure a 301 permanent redirect from all HTTP URLs to HTTPS.'
          })
        }
      } catch { /* redirect check failed silently */ }
    }

    // Check for HTTPS at all
    if (url.startsWith('http://')) {
      findings.push({
        id: 'no-ssl',
        title: 'No SSL/TLS Certificate (HTTP Only)',
        description: 'Site does not use HTTPS. All data is transmitted in plaintext.',
        severity: 'CRITICAL',
        category: 'GENERAL',
        recommendation: 'Install a TLS certificate. Use Let\'s Encrypt for free certificates.'
      })
    }

    // Open redirect detection
    const redirectTestUrl = `${url}?next=https://evil.com`
    try {
      const res = await fetch(redirectTestUrl, {
        redirect: 'manual',
        signal: AbortSignal.timeout(5000)
      })
      const location = res.headers.get('location')
      if (location && location.includes('evil.com')) {
        findings.push({
          id: 'open-redirect',
          title: 'Open Redirect Vulnerability Detected',
          description: 'The ?next= parameter redirects to external URLs without validation.',
          severity: 'HIGH',
          category: 'GENERAL',
          recommendation: 'Validate redirect URLs against an allowlist of trusted domains before redirecting.'
        })
      }
    } catch { /* open redirect test silent */ }

  } catch {
    // silent
  }

  return findings
}
