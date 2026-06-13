'use client'

export function FeaturesSection() {
  const features = [
    {
      icon: '🔍',
      title: 'Instant Risk Scoring',
      description: 'Get a 0-100 risk score with real-time severity breakdown (Critical, High, Medium, Low). No setup, no waiting.'
    },
    {
      icon: '📁',
      title: 'File-Level Context',
      description: 'See exactly which file and line number each vulnerability exists on. Click to jump to the code in our integrated viewer.'
    },
    {
      icon: '🤖',
      title: 'AI Security Summary',
      description: 'Get a plain-English explanation of your vulnerabilities — why they matter and what they expose.'
    },
    {
      icon: '💾',
      title: 'Export Reports',
      description: 'Download beautiful HTML reports with your complete findings, badges, and shareable links for team collaboration.'
    },
    {
      icon: '🔗',
      title: 'Shareable Results',
      description: 'Generate unique URLs for each scan. Share reports without exposing sensitive data. Add security badges to your README.'
    },
    {
      icon: '⚡',
      title: 'Multiple Input Types',
      description: 'Scan live websites (URLs) for headers/XSS or GitHub repos for dependency vulnerabilities — all with one tool.'
    },
    {
      icon: '🛡️',
      title: 'Fix Code Snippets',
      description: 'Not just problems — solutions. Every finding includes copy-paste code fixes for quick remediation.'
    },
    {
      icon: '🔓',
      title: 'No Auth Required',
      description: 'Scan any public GitHub repo or website instantly. No API keys, no login, no paid tiers — completely free.'
    },
  ]

  return (
    <div id="features" style={{ padding: '48px 40px', background: '#f8f9fa', borderTop: '1px solid #e8eaed' }}>
      <p style={{
        fontSize: 28, fontWeight: 400, color: '#1f1f1f', margin: '0 0 12px 0',
        letterSpacing: '-0.5px', fontFamily: 'Google Sans'
      }}>
        Powerful Features
      </p>
      <p style={{
        fontSize: 15, color: '#5f6368', margin: '0 0 32px 0', lineHeight: 1.5,
        maxWidth: 600
      }}>
        Everything you need to find and fix security vulnerabilities before they become breaches.
      </p>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20
      }}>
        {features.map((f, i) => (
          <div
            key={i}
            style={{
              background: '#fff', border: '1px solid #e8eaed', borderRadius: 12,
              padding: 20, transition: 'box-shadow .2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = ''}
          >
            <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: '#1f1f1f', marginBottom: 8 }}>{f.title}</div>
            <div style={{ fontSize: 13, color: '#5f6368', lineHeight: 1.6 }}>{f.description}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
