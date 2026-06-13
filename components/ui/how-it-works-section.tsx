'use client'

export function HowItWorksSection() {
  const steps = [
    {
      number: 1,
      icon: '📋',
      title: 'Input Your Target',
      description: 'Paste a website URL (e.g., example.com) or GitHub repo link (e.g., github.com/user/repo). No signup, no authentication needed.'
    },
    {
      number: 2,
      icon: '⚡',
      title: 'Parallel Scanning',
      description: 'Five independent scanners run simultaneously: Headers Scanner, Dependency Checker, XSS Detector, SSL/TLS Verifier, and Sensitive Path Locator.'
    },
    {
      number: 3,
      icon: '🔍',
      title: 'Analysis & Scoring',
      description: 'VulnLens analyzes findings and assigns a risk score (0-100), severity levels (Critical/High/Medium/Low), and file-level locations where issues exist.'
    },
    {
      number: 4,
      icon: '✨',
      title: 'AI Summary & Fixes',
      description: 'Our AI generates a plain-English summary of vulnerabilities. Each finding includes a copy-paste code fix and remediation steps.'
    },
    {
      number: 5,
      icon: '📊',
      title: 'Interactive Report',
      description: 'View results in an interactive dashboard. See exact line numbers, browse code in our integrated viewer, and explore the full repo tree.'
    },
    {
      number: 6,
      icon: '📤',
      title: 'Share & Export',
      description: 'Export as HTML report, share via unique URL, or add a security badge to your README. All shareable links auto-expire or you can regenerate anytime.'
    },
  ]

  return (
    <div style={{ padding: '48px 40px', background: '#fff', borderTop: '1px solid #e8eaed' }}>
      <p style={{
        fontSize: 28, fontWeight: 400, color: '#1f1f1f', margin: '0 0 12px 0',
        letterSpacing: '-0.5px', fontFamily: 'Google Sans'
      }}>
        How It Works
      </p>
      <p style={{
        fontSize: 15, color: '#5f6368', margin: '0 0 40px 0', lineHeight: 1.5,
        maxWidth: 600
      }}>
        From input to actionable report in seconds. No configuration, no waiting. Just scan and fix.
      </p>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24
      }}>
        {steps.map((step, i) => (
          <div key={i} style={{ position: 'relative' }}>
            {/* Connector line to next step */}
            {i < steps.length - 1 && (
              <div style={{
                position: 'absolute', top: 48, right: -12, width: '24px', height: '2px',
                background: '#e8eaed'
              }} />
            )}

            <div style={{
              background: '#f8f9fa', border: '1px solid #e8eaed', borderRadius: 12, padding: 24
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', background: '#e8f0fe',
                  color: '#1a73e8', fontSize: 20, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', flexShrink: 0, fontWeight: 600
                }}>
                  {step.icon}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#80868b', textTransform: 'uppercase' }}>
                    Step {step.number}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: '#1f1f1f', marginTop: 4 }}>
                    {step.title}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 13, color: '#5f6368', lineHeight: 1.6, paddingLeft: 60 }}>
                {step.description}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tech stack info */}
      <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid #e8eaed' }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#80868b', textTransform: 'uppercase', marginBottom: 16 }}>
          What We Scan For
        </p>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16
        }}>
          {[
            { icon: '🔐', label: 'HTTP Security Headers', detail: 'HSTS, CSP, X-Frame, Permissions' },
            { icon: '📦', label: 'Dependency CVEs', detail: 'OSV.dev database of npm vulnerabilities' },
            { icon: '⚠️', label: 'Client-Side XSS', detail: 'eval(), document.write(), event handlers' },
            { icon: '🔓', label: 'Open Redirects', detail: 'HTTP→HTTPS, unvalidated redirects' },
            { icon: '🗂️', label: 'Sensitive Files', detail: '.env, .git, backups, admin panels' },
            { icon: '🔗', label: 'CORS & Cookies', detail: 'Misconfiguration, missing flags' },
          ].map((item, i) => (
            <div key={i} style={{
              background: '#f8f9fa', border: '1px solid #e8eaed', borderRadius: 8, padding: 16
            }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>{item.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#1f1f1f', marginBottom: 4 }}>
                {item.label}
              </div>
              <div style={{ fontSize: 11, color: '#80868b' }}>
                {item.detail}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
