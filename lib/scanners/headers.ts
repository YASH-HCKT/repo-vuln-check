import { Finding } from '../types'

const SECURITY_HEADERS = [
  {
    name: 'strict-transport-security',
    title: 'Missing HSTS Header',
    severity: 'HIGH' as const,
    description: 'Site is vulnerable to protocol downgrade attacks and cookie hijacking.',
    recommendation: 'Add: Strict-Transport-Security: max-age=31536000; includeSubDomains'
  },
  {
    name: 'content-security-policy',
    title: 'Missing Content Security Policy',
    severity: 'HIGH' as const,
    description: 'No CSP header found. Site is vulnerable to XSS and data injection attacks.',
    recommendation: "Add: Content-Security-Policy: default-src 'self'"
  },
  {
    name: 'x-frame-options',
    title: 'Missing X-Frame-Options',
    severity: 'MEDIUM' as const,
    description: 'Site can be embedded in iframes — vulnerable to clickjacking.',
    recommendation: 'Add: X-Frame-Options: DENY'
  },
  {
    name: 'x-content-type-options',
    title: 'Missing X-Content-Type-Options',
    severity: 'MEDIUM' as const,
    description: 'Browser may MIME-sniff responses away from declared content type.',
    recommendation: 'Add: X-Content-Type-Options: nosniff'
  },
  {
    name: 'referrer-policy',
    title: 'Missing Referrer-Policy',
    severity: 'LOW' as const,
    description: 'Full URL may be sent as referrer to third-party sites.',
    recommendation: 'Add: Referrer-Policy: strict-origin-when-cross-origin'
  },
  {
    name: 'permissions-policy',
    title: 'Missing Permissions-Policy',
    severity: 'LOW' as const,
    description: 'Browser features like camera/mic/geolocation are unrestricted.',
    recommendation: 'Add: Permissions-Policy: camera=(), microphone=(), geolocation=()'
  },
]

export async function scanHeaders(url: string): Promise<Finding[]> {
  const findings: Finding[] = []

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(8000),
    })

    const headers = response.headers

    // Check HTTP vs HTTPS
    if (url.startsWith('http://')) {
      findings.push({
        id: 'no-https',
        title: 'Site Not Using HTTPS',
        description: 'All traffic is unencrypted. Credentials and data exposed.',
        severity: 'CRITICAL',
        category: 'HEADERS',
        recommendation: 'Migrate to HTTPS immediately. Get a free cert via Let\'s Encrypt.'
      })
    }

    // Check each security header
    for (const header of SECURITY_HEADERS) {
      if (!headers.get(header.name)) {
        findings.push({
          id: `missing-${header.name}`,
          title: header.title,
          description: header.description,
          severity: header.severity,
          category: 'HEADERS',
          recommendation: header.recommendation
        })
      }
    }

    // Check server header leaking tech info
    const serverHeader = headers.get('server')
    if (serverHeader && /apache|nginx|iis|php/i.test(serverHeader)) {
      findings.push({
        id: 'server-leak',
        title: 'Server Header Exposes Technology Stack',
        description: `Server header reveals: "${serverHeader}". Helps attackers target known exploits.`,
        severity: 'LOW',
        category: 'HEADERS',
        recommendation: 'Configure server to remove or mask the Server header.'
      })
    }

    // CORS misconfiguration check
    const corsHeader = headers.get('access-control-allow-origin')
    if (corsHeader === '*') {
      findings.push({
        id: 'cors-wildcard',
        title: 'CORS Wildcard Origin Allowed',
        description: 'Access-Control-Allow-Origin: * allows any website to make credentialed requests to this domain.',
        severity: 'HIGH',
        category: 'HEADERS',
        recommendation: 'Restrict CORS to specific trusted origins: Access-Control-Allow-Origin: https://yourdomain.com'
      })
    }

    // Cookie security flags check
    const setCookieHeader = headers.get('set-cookie')
    if (setCookieHeader) {
      if (!/httponly/i.test(setCookieHeader)) {
        findings.push({
          id: 'cookie-no-httponly',
          title: 'Cookie Missing HttpOnly Flag',
          description: 'Cookies without HttpOnly can be accessed via JavaScript — vulnerable to XSS cookie theft.',
          severity: 'HIGH',
          category: 'HEADERS',
          recommendation: 'Add HttpOnly flag to all sensitive cookies: Set-Cookie: session=abc; HttpOnly; Secure; SameSite=Strict'
        })
      }
      if (!/secure/i.test(setCookieHeader)) {
        findings.push({
          id: 'cookie-no-secure',
          title: 'Cookie Missing Secure Flag',
          description: 'Cookies without Secure flag can be transmitted over unencrypted HTTP connections.',
          severity: 'MEDIUM',
          category: 'HEADERS',
          recommendation: 'Add Secure flag to all cookies: Set-Cookie: session=abc; Secure'
        })
      }
      if (!/samesite/i.test(setCookieHeader)) {
        findings.push({
          id: 'cookie-no-samesite',
          title: 'Cookie Missing SameSite Flag',
          description: 'Without SameSite, cookies are sent on cross-site requests — CSRF risk.',
          severity: 'MEDIUM',
          category: 'HEADERS',
          recommendation: 'Add SameSite=Strict or SameSite=Lax to all cookies.'
        })
      }
    }

  } catch (err: any) {
    findings.push({
      id: 'fetch-error',
      title: 'Could Not Reach Target URL',
      description: err.message || 'URL unreachable or timed out.',
      severity: 'INFO',
      category: 'GENERAL',
      recommendation: 'Check that the URL is publicly accessible.'
    })
  }

  return findings
}
