import { Finding } from '../types'

export async function scanXSS(url: string): Promise<Finding[]> {
  const findings: Finding[] = []

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'VulnLens-Scanner/1.0' }
    })

    const html = await res.text()

    // 1. Inline event handlers = XSS risk
    const inlineEvents = html.match(/\s(onclick|onmouseover|onerror|onload|onfocus)=/gi)
    if (inlineEvents && inlineEvents.length > 3) {
      findings.push({
        id: 'inline-events',
        title: 'Excessive Inline Event Handlers',
        description: `Found ${inlineEvents.length} inline event handlers (onclick, onerror etc). Can be exploited if user input is reflected.`,
        severity: 'MEDIUM',
        category: 'XSS',
        recommendation: 'Move event handlers to external JS files. Never reflect user input in event attributes.'
      })
    }

    // 2. document.write usage
    if (/document\.write\s*\(/i.test(html)) {
      findings.push({
        id: 'document-write',
        title: 'document.write() Usage Detected',
        description: 'document.write() can enable DOM-based XSS if user-controlled data is passed in.',
        severity: 'HIGH',
        category: 'XSS',
        recommendation: 'Replace document.write() with safer DOM manipulation methods like innerHTML or textContent.'
      })
    }

    // 3. eval() usage
    if (/\beval\s*\(/i.test(html)) {
      findings.push({
        id: 'eval-usage',
        title: 'eval() Usage Detected',
        description: 'eval() executes arbitrary code. If user input reaches eval(), it is a direct XSS vector.',
        severity: 'CRITICAL',
        category: 'XSS',
        recommendation: 'Remove all eval() calls. Use JSON.parse() for data, proper functions for logic.'
      })
    }

    // 4. Forms without CSRF tokens
    const formMatches = html.match(/<form[^>]*>/gi) || []
    const csrfTokens = html.match(/csrf|_token|authenticity_token/gi) || []

    if (formMatches.length > 0 && csrfTokens.length === 0) {
      findings.push({
        id: 'no-csrf',
        title: 'Forms Missing CSRF Protection',
        description: `Found ${formMatches.length} form(s) with no visible CSRF token. Vulnerable to cross-site request forgery.`,
        severity: 'HIGH',
        category: 'XSS',
        recommendation: 'Implement CSRF tokens in all state-changing forms. Use SameSite cookie attribute.'
      })
    }

    // 5. Mixed content (HTTP resources on HTTPS page)
    if (url.startsWith('https://')) {
      const httpResources = html.match(/src="http:\/\//gi) || []
      if (httpResources.length > 0) {
        findings.push({
          id: 'mixed-content',
          title: 'Mixed Content Detected',
          description: `${httpResources.length} resource(s) loaded over HTTP on an HTTPS page. Can be intercepted.`,
          severity: 'MEDIUM',
          category: 'XSS',
          recommendation: 'Change all resource URLs from http:// to https:// or use protocol-relative URLs.'
        })
      }
    }

    // 6. Input fields without autocomplete=off for sensitive fields
    const passwordInputs = html.match(/<input[^>]*type="password"[^>]*>/gi) || []
    const autocompleteOff = html.match(/autocomplete="off"/gi) || []
    if (passwordInputs.length > 0 && autocompleteOff.length === 0) {
      findings.push({
        id: 'password-autocomplete',
        title: 'Password Fields Allow Autocomplete',
        description: 'Password inputs do not have autocomplete="off". Passwords may be stored in browser.',
        severity: 'LOW',
        category: 'XSS',
        recommendation: 'Add autocomplete="off" or autocomplete="new-password" to password fields.'
      })
    }

  } catch (err: any) {
    // If headers scanner already caught this, skip silently
  }

  return findings
}
