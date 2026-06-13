'use client'

export function AdvantagesSection() {
  const advantages = [
    {
      title: 'No GitHub Permissions Required',
      description: 'Unlike Dependabot and GitHub security tabs, you don\'t need to own the repo or be an admin. Scan any public GitHub repo instantly.'
    },
    {
      title: 'Live Website + Repo Scanning',
      description: 'Most tools do one or the other. VulnLens scans both live websites (headers, SSL, XSS) AND repositories (dependencies) in one unified dashboard.'
    },
    {
      title: 'See The Exact Code',
      description: 'Not just "vulnerability in package.json" — see the exact file, line number, and code context. Integrated code viewer highlights the vulnerability.'
    },
    {
      title: 'Completely Free',
      description: 'No freemium model, no paid tiers hiding features. Full scanner access, unlimited reports, shareable links — all free forever.'
    },
    {
      title: 'AI-Powered Explanations',
      description: 'Get plain-English summaries of what each vulnerability means, who it affects, and what damage it can cause — not just technical jargon.'
    },
    {
      title: 'One-Click Fix Snippets',
      description: 'Every finding includes production-ready code fixes. Copy, paste, commit. No hunting through docs or StackOverflow.'
    },
    {
      title: 'Share Reports Instantly',
      description: 'Generate shareable report URLs with unique IDs. Great for security teams, audits, or client deliverables. No accounts needed.'
    },
    {
      title: 'Works Offline & Public',
      description: 'No private server scanning required. Scan any public GitHub repo or live website from anywhere. Perfect for startups and teams.'
    },
  ]

  return (
    <div style={{ padding: '48px 40px', background: '#fff' }}>
      <p style={{
        fontSize: 28, fontWeight: 400, color: '#1f1f1f', margin: '0 0 12px 0',
        letterSpacing: '-0.5px', fontFamily: 'Google Sans'
      }}>
        Why Choose VulnLens
      </p>
      <p style={{
        fontSize: 15, color: '#5f6368', margin: '0 0 32px 0', lineHeight: 1.5,
        maxWidth: 600
      }}>
        How we're different from GitHub's built-in tools, Snyk, and other scanners.
      </p>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24
      }}>
        {advantages.map((a, i) => (
          <div key={i} style={{ display: 'flex', gap: 16 }}>
            <div style={{
              fontSize: 24, width: 36, height: 36, display: 'flex', alignItems: 'center',
              justifyContent: 'center', background: '#e8f0fe', borderRadius: 8, flexShrink: 0,
              color: '#1a73e8', fontWeight: 600
            }}>
              ✓
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500, color: '#1f1f1f', marginBottom: 6 }}>
                {a.title}
              </div>
              <div style={{ fontSize: 13, color: '#5f6368', lineHeight: 1.6 }}>
                {a.description}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
