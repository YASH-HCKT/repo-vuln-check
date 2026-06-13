'use client'

import { useState } from 'react'

export function TermsSection() {
  const [expanded, setExpanded] = useState<string | null>(null)

  const sections = [
    {
      id: 'use-license',
      title: '1. License & Usage',
      content: [
        'VulnLens is provided "as is" for security research, testing, and vulnerability assessment purposes only.',
        'You are granted a free, non-exclusive license to use VulnLens to scan public repositories and websites.',
        'You may NOT use VulnLens to scan systems or repositories you do not own or have explicit permission to test.',
        'Unauthorized testing of systems you don\'t own is illegal in most jurisdictions and violates the Computer Fraud and Abuse Act (CFAA) in the United States.',
      ]
    },
    {
      id: 'no-warranty',
      title: '2. No Warranty',
      content: [
        'VulnLens is provided WITHOUT WARRANTY of any kind, express or implied.',
        'We do not guarantee that all vulnerabilities will be detected or that all findings are accurate.',
        'Some vulnerabilities may be false positives; security experts should review findings before taking action.',
        'Reliance on VulnLens results is solely at your own risk.',
      ]
    },
    {
      id: 'data-privacy',
      title: '3. Data & Privacy',
      content: [
        'VulnLens does NOT store or log URLs, GitHub links, or scan results on our servers.',
        'All scans run in-session; results are generated on-the-fly and deleted after use unless you explicitly export them.',
        'GitHub API queries are made directly from your browser/connection, not through our servers.',
        'We do NOT collect personally identifiable information (PII) or usage analytics beyond what is necessary for service operation.',
        'For public GitHub repos, we use the public GitHub REST API with no authentication — this is not private data.',
      ]
    },
    {
      id: 'limitations',
      title: '4. Limitations of Liability',
      content: [
        'VulnLens creators and maintainers assume NO LIABILITY for damages resulting from:',
        '  • Inaccurate, missed, or false-positive vulnerability findings',
        '  • Loss of data or business interruption due to reliance on scan results',
        '  • Unauthorized use of VulnLens to test systems without permission',
        '  • Any third-party service interruptions (GitHub API, OSV.dev, etc.)',
        'You assume full responsibility for using VulnLens responsibly and legally.',
      ]
    },
    {
      id: 'legal-use',
      title: '5. Legal Use Only',
      content: [
        'You agree to use VulnLens only for lawful purposes.',
        'You may NOT use VulnLens for:',
        '  • Testing systems without permission (unauthorized access)',
        '  • Distributing vulnerabilities you find without responsible disclosure',
        '  • Attempting to cause harm or sabotage',
        '  • Bypassing security controls or authentication mechanisms',
        'All security findings should be reported responsibly to the affected project maintainers.',
      ]
    },
    {
      id: 'attribution',
      title: '6. Attribution & Credits',
      content: [
        'VulnLens uses the OSV.dev database for dependency vulnerability data.',
        'VulnLens uses the GitHub REST API for repository scanning.',
        'Both services have their own terms of service which you agree to when using VulnLens.',
        'VulnLens is MIT licensed. See the LICENSE file for full details.',
      ]
    },
    {
      id: 'changes',
      title: '7. Changes to Terms',
      content: [
        'We reserve the right to modify these Terms and Conditions at any time.',
        'Changes are effective immediately upon posting to the VulnLens website.',
        'Continued use of VulnLens after changes constitutes acceptance of the new terms.',
      ]
    },
    {
      id: 'responsible-disclosure',
      title: '8. Responsible Disclosure',
      content: [
        'If you find a vulnerability in VulnLens itself, please do NOT publicly disclose it.',
        'Report security issues responsibly to the development team via a private security advisory.',
        'We ask that you give us reasonable time to patch before public disclosure.',
        'Thank you for helping keep the security community safe.',
      ]
    },
  ]

  return (
    <div style={{ padding: '48px 40px', background: '#f8f9fa', borderTop: '1px solid #e8eaed' }}>
      <p style={{
        fontSize: 28, fontWeight: 400, color: '#1f1f1f', margin: '0 0 12px 0',
        letterSpacing: '-0.5px', fontFamily: 'Google Sans'
      }}>
        Terms & Conditions
      </p>
      <p style={{
        fontSize: 15, color: '#5f6368', margin: '0 0 24px 0', lineHeight: 1.5,
        maxWidth: 800
      }}>
        Please read these terms carefully. VulnLens is a free security tool provided as-is. By using VulnLens, you agree to these terms.
      </p>

      <div style={{ maxWidth: 900 }}>
        {sections.map((section) => (
          <div
            key={section.id}
            style={{
              border: '1px solid #e8eaed', borderRadius: 12, marginBottom: 12,
              background: '#fff', overflow: 'hidden'
            }}
          >
            <button
              onClick={() => setExpanded(expanded === section.id ? null : section.id)}
              style={{
                width: '100%', padding: '16px 20px', border: 'none', background: 'transparent',
                cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', textAlign: 'left', fontSize: 15, fontWeight: 500,
                color: '#1f1f1f', transition: 'background .15s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              {section.title}
              <span style={{
                transform: expanded === section.id ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform .2s', color: '#80868b', display: 'flex', flexShrink: 0
              }}>
                ▾
              </span>
            </button>

            {expanded === section.id && (
              <div style={{
                padding: '0 20px 16px 20px', borderTop: '1px solid #e8eaed',
                color: '#5f6368', fontSize: 13, lineHeight: 1.7
              }}>
                {section.content.map((para, i) => (
                  <p key={i} style={{ margin: i === 0 ? '12px 0 8px 0' : '8px 0', whiteSpace: 'pre-wrap' }}>
                    {para}
                  </p>
                ))}
              </div>
            )}
          </div>
        ))}

        <div style={{
          marginTop: 32, padding: 20, background: '#e8f0fe', border: '1px solid #1a73e8',
          borderRadius: 12, fontSize: 13, color: '#1a73e8', lineHeight: 1.6
        }}>
          <strong>⚠️ Key Disclaimer:</strong> VulnLens is for authorized security testing only. Always obtain explicit permission before testing any system you don't own. Unauthorized access to computer systems is a crime.
        </div>
      </div>
    </div>
  )
}
