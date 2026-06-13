import { NextRequest, NextResponse } from 'next/server'
import { scanHeaders } from '@/lib/scanners/headers'
import { scanGithub } from '@/lib/scanners/github'
import { scanXSS } from '@/lib/scanners/xss'
import { scanSSL } from '@/lib/scanners/ssl'
import { scanSensitivePaths } from '@/lib/scanners/paths'
import { calculateRisk } from '@/lib/scoring'
import { getFixSnippet } from '@/lib/fixSnippets'

export async function POST(req: NextRequest) {
  try {
    const { target, demo } = await req.json()

    // DEMO MODE — return pre-loaded result
    if (demo) {
      return NextResponse.json(getDemoResult())
    }

    if (!target || typeof target !== 'string') {
      return NextResponse.json(
        { error: 'No target provided' },
        { status: 400 }
      )
    }

    const isGithub = target.includes('github.com')

    let findings: any[] = []

    if (isGithub) {
      findings = await scanGithub(target)
    } else {
      const normalizedUrl = target.startsWith('http') ? target : `https://${target}`
      
      const [headerFindings, xssFindings, sslFindings, pathFindings] = await Promise.all([
        scanHeaders(normalizedUrl),
        scanXSS(normalizedUrl),
        scanSSL(normalizedUrl),
        scanSensitivePaths(normalizedUrl)
      ])

      findings = [...headerFindings, ...xssFindings, ...sslFindings, ...pathFindings]
    }

    const result = calculateRisk(
      target,
      isGithub ? 'GITHUB' : 'URL',
      findings
    )

    // Inject fix snippets
    const resultWithFixes = {
      ...result,
      findings: result.findings.map(f => ({
        ...f,
        fixSnippet: f.fixSnippet || getFixSnippet(f.id)
      }))
    }

    // Generate shareable ID
    const scanId = Buffer.from(`${target}-${Date.now()}`).toString('base64url').slice(0, 12)

    return NextResponse.json({ ...resultWithFixes, scanId })

  } catch (err: any) {
    console.error('Scan error:', err)
    return NextResponse.json(
      { error: 'Scan failed', message: err.message },
      { status: 500 }
    )
  }
}

// DEMO MODE data
function getDemoResult() {
  return {
    target: 'https://demo.vulnerable-site.com',
    scanType: 'URL',
    scanId: 'demo-scan-001',
    timestamp: new Date().toISOString(),
    riskScore: 87,
    riskLevel: 'CRITICAL',
    isDemo: true,
    findings: [
      { id: 'no-https', title: 'Site Not Using HTTPS', description: 'All traffic is unencrypted.', severity: 'CRITICAL', category: 'HEADERS', recommendation: 'Migrate to HTTPS via Let\'s Encrypt.', fixSnippet: '# Nginx redirect\nserver {\n  listen 80;\n  return 301 https://$host$request_uri;\n}' },
      { id: 'missing-content-security-policy', title: 'Missing Content Security Policy', description: 'No CSP header found.', severity: 'HIGH', category: 'HEADERS', recommendation: 'Add CSP header to server config.', fixSnippet: '// Next.js headers config\nheaders: [{ key: "Content-Security-Policy", value: "default-src \'self\'" }]' },
      { id: 'cors-wildcard', title: 'CORS Wildcard Origin Allowed', description: 'Any website can make requests.', severity: 'HIGH', category: 'HEADERS', recommendation: 'Restrict to specific origins.', fixSnippet: '// Express.js\napp.use(cors({ origin: "https://yourdomain.com" }))' },
      { id: 'cookie-no-httponly', title: 'Cookie Missing HttpOnly Flag', description: 'Cookies accessible via JS.', severity: 'HIGH', category: 'HEADERS', recommendation: 'Add HttpOnly to all cookies.', fixSnippet: 'res.cookie("session", token, {\n  httpOnly: true,\n  secure: true,\n  sameSite: "strict"\n})' },
      { id: 'eval-usage', title: 'eval() Usage Detected', description: 'Direct code execution risk.', severity: 'CRITICAL', category: 'XSS', recommendation: 'Remove all eval() calls.', fixSnippet: '// Replace eval(jsonString) with:\nconst data = JSON.parse(jsonString)' },
    ],
    summary: { critical: 2, high: 3, medium: 0, low: 0, total: 5 },
    aiSummary: 'This site has critical security issues. It transmits data over unencrypted HTTP, making all user data visible to attackers on the network. The missing Content Security Policy and eval() usage create significant XSS attack surface. CORS wildcard allows malicious third-party sites to make authenticated requests. Cookies are exposed to JavaScript theft. Immediate action required before handling any user data.'
  }
}
