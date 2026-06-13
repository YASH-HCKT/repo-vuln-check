'use client'

import { useState, useEffect, useRef } from 'react'
import { AnimatedThemeToggle } from '@/components/ui/animated-theme-toggle'
import { Faq3 } from '@/components/ui/faq3'

/* ─── Types mirroring /lib/types.ts ─── */
interface Finding {
  id: string
  title: string
  description: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO'
  category: 'HEADERS' | 'DEPENDENCIES' | 'XSS' | 'GENERAL'
  recommendation: string
  cve?: string
  fixSnippet?: string
}

interface ScanResult {
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
  scanId?: string
  aiSummary?: string
  isDemo?: boolean
}

/* ─── Scan step messages shown during loading ─── */
const SCAN_STEPS = [
  'Resolving target host…',
  'Analyzing SSL/TLS handshake…',
  'Scanning HTTP security headers…',
  'Detecting client-side XSS vectors…',
  'Checking CORS & cookie flags…',
  'Probing sensitive paths…',
  'Querying OSV.dev for dependency CVEs…',
  'Compiling risk report…',
]

/* ─── Helpers ─── */
const chipClass = (sev: string) => {
  switch (sev) {
    case 'CRITICAL': return 'chip-critical'
    case 'HIGH': return 'chip-high'
    case 'MEDIUM': return 'chip-medium'
    case 'LOW': return 'chip-low'
    default: return 'chip-info'
  }
}

const badgeClass = (level: string) => {
  switch (level) {
    case 'CRITICAL': return 'badge-critical'
    case 'HIGH': return 'badge-high'
    case 'MODERATE': return 'badge-moderate'
    default: return 'badge-secure'
  }
}

const scoreColor = (level: string) => {
  switch (level) {
    case 'CRITICAL': return '#c5221f'
    case 'HIGH': return '#e37400'
    case 'MODERATE': return '#b06000'
    default: return '#137333'
  }
}

const statColor = (key: string) => {
  switch (key) {
    case 'critical': return '#c5221f'
    case 'high': return '#e37400'
    case 'medium': return '#137333'
    case 'low': return '#5f6368'
    default: return '#5f6368'
  }
}

/* ═══════════════════════════════════════════════════════════════
   PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function Home() {
  /* ── State ── */
  const [target, setTarget] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState('')
  const [activeStep, setActiveStep] = useState(0)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [aiSummary, setAiSummary] = useState('')
  const [loadingSummary, setLoadingSummary] = useState(false)
  const resultRef = useRef<HTMLDivElement>(null)

  /* ── Loading animation step cycle ── */
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (loading) {
      setActiveStep(0)
      interval = setInterval(() => {
        setActiveStep((prev) => (prev < SCAN_STEPS.length - 1 ? prev + 1 : prev))
      }, 600)
    }
    return () => clearInterval(interval)
  }, [loading])

  /* ── Scroll to results when they arrive ── */
  useEffect(() => {
    if (result && resultRef.current) {
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 200)
    }
  }, [result])

  /* ── Populate AI summary from demo mode ── */
  useEffect(() => {
    if (result?.aiSummary) {
      setAiSummary(result.aiSummary)
    } else {
      setAiSummary('')
    }
  }, [result])

  /* ── Scan handler ── */
  const handleScan = async (isDemo = false) => {
    if (!isDemo && !target.trim()) {
      setError('Please enter a valid URL or GitHub repository.')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)
    setFilterSeverity('ALL')
    setExpandedId(null)

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isDemo ? { demo: true } : { target }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || 'Scanner encountered an error.')
      }

      const data: ScanResult = await response.json()

      // Let the scan steps animation finish nicely
      await new Promise((r) => setTimeout(r, 1200))

      setResult(data)
    } catch (err: any) {
      setError(err.message || 'Scan failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  /* ── Copy to clipboard ── */
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  /* ── Fetch AI Summary ── */
  const fetchAiSummary = async () => {
    if (!result || aiSummary) return
    setLoadingSummary(true)
    try {
      const res = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          findings: result.findings,
          target: result.target,
          riskScore: result.riskScore,
          riskLevel: result.riskLevel
        })
      })
      const data = await res.json()
      setAiSummary(data.summary)
    } catch {
      setAiSummary('Unable to generate summary.')
    } finally {
      setLoadingSummary(false)
    }
  }

  /* ── Download HTML Report ── */
  const downloadReport = async () => {
    if (!result) return
    const res = await fetch('/api/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...result, aiSummary })
    })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vulnlens-report-${result.scanId || Date.now()}.html`
    a.click()
  }

  /* ── Filtered findings ── */
  const filteredFindings =
    result?.findings.filter((f) =>
      filterSeverity === 'ALL' ? true : f.severity === filterSeverity,
    ) || []

  /* ── Dark mode dynamic vars ── */
  const dm = {
    bg: '#f8f9fa',
    navBg: '#fff',
    cardBg: '#fff',
    border: '#e8eaed',
    text: '#1f1f1f',
    muted: '#5f6368',
    statBg: '#f8f9fa',
    findingBg: '#fff',
    recBg: '#f8f9fa',
  }

  /* ═══════ RENDER ═══════ */
  return (
    <div className="nl-wrap" style={result ? { background: dm.bg, color: dm.text } : undefined}>

      {/* ════════════ NAV ════════════ */}
      <nav className="nl-nav" style={result ? { background: dm.navBg, borderColor: dm.border } : undefined}>
        <div className="nl-nav-left">
          <div className="nl-nav-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <span className="nl-nav-name" style={result ? { color: dm.text } : undefined}>VulnLens</span>
          {result?.isDemo && (
            <span style={{ background: '#e8f0fe', color: '#1a73e8', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20 }}>DEMO</span>
          )}
        </div>
        <div className="nl-nav-right">
          {!result && (
            <>
              <a href="#overview" className="nl-nav-link active">Overview</a>
              <a href="#how-it-works" className="nl-nav-link">How it works</a>
              <button
                className="nl-nav-link"
                onClick={() => handleScan(true)}
                style={{ cursor: 'pointer' }}
              >
                Try Demo
              </button>
            </>
          )}
          {result && (
            <>
              <button
                onClick={downloadReport}
                style={{
                  fontFamily: 'Google Sans', fontSize: 13, fontWeight: 500,
                  background: '#1a73e8', color: '#fff',
                  border: 'none', borderRadius: 20,
                  padding: '8px 18px', cursor: 'pointer'
                }}
              >
                ↓ Export Report
              </button>
            </>
          )}
          <button
            className="nl-nav-btn"
            onClick={() => {
              if (result) {
                setResult(null)
                setAiSummary('')
              } else {
                document.querySelector<HTMLInputElement>('#scan-input')?.focus()
              }
            }}
          >
            {result ? 'New Scan' : 'Start Scanning'}
          </button>
        </div>
      </nav>

      {/* ════════════ HERO ════════════ */}
      {!result && !loading && (
        <div className="nl-hero" id="overview">
          <div className="nl-hero-eyebrow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            Powered by OSV.dev Security Intelligence
          </div>

          <h1 className="nl-hero-h1">
            Scan for<br />
            <span className="accent-blue">Security</span>{' '}
            <span className="accent-green">Threats</span>
          </h1>
          <p className="nl-hero-sub">
            Analyze any URL or GitHub repository for vulnerabilities, misconfigurations, and dependency risks.
            Get a full risk report in seconds.
          </p>

          {/* ── Input Bar ── */}
          <div className="nl-input-wrap">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#80868b" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              id="scan-input"
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              placeholder="Paste a URL or github.com/user/repo to scan…"
            />
            <button className="nl-scan-btn" onClick={() => handleScan()} disabled={loading}>
              {loading ? 'Scanning…' : 'Scan Now'}
            </button>
          </div>
          <p className="nl-hint">
            Try: https://example.com &nbsp;·&nbsp; github.com/your-org/your-repo
          </p>

          {/* ── Demo button ── */}
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <button
              onClick={() => handleScan(true)}
              style={{
                background: 'transparent', border: '1px solid #e8eaed',
                borderRadius: 20, padding: '8px 20px', fontSize: 13,
                color: '#5f6368', cursor: 'pointer', fontFamily: 'inherit',
                transition: 'background 0.15s'
              }}
            >
              Or try demo with a vulnerable site →
            </button>
          </div>

          {/* ── Error banner ── */}
          {error && <div className="nl-error">{error}</div>}

          {/* ── Feature chips ── */}
          <div className="nl-features">
            <div className="nl-feat"><div className="nl-feat-dot" style={{ background: '#1a73e8' }} />Security headers</div>
            <div className="nl-feat"><div className="nl-feat-dot" style={{ background: '#34a853' }} />Dependency CVEs</div>
            <div className="nl-feat"><div className="nl-feat-dot" style={{ background: '#ea4335' }} />XSS vectors</div>
            <div className="nl-feat"><div className="nl-feat-dot" style={{ background: '#9334e6' }} />CORS check</div>
            <div className="nl-feat"><div className="nl-feat-dot" style={{ background: '#e37400' }} />Cookie flags</div>
            <div className="nl-feat"><div className="nl-feat-dot" style={{ background: '#00897b' }} />SSL/TLS</div>
            <div className="nl-feat"><div className="nl-feat-dot" style={{ background: '#c5221f' }} />Sensitive paths</div>
            <div className="nl-feat"><div className="nl-feat-dot" style={{ background: '#1a73e8' }} />AI summary</div>
          </div>
        </div>
      )}

      {/* ════════════ ERROR (when loading) ════════════ */}
      {error && loading && <div className="nl-error">{error}</div>}

      {/* ════════════ LOADING STATE ════════════ */}
      {loading && (
        <div className="nl-loading-section">
          <div className="nl-loading-ring" />
          <div>
            {SCAN_STEPS.map((step, i) => (
              <div
                key={i}
                className={`nl-loading-step ${i < activeStep ? 'done' : i === activeStep ? 'active' : ''
                  }`}
              >
                {i < activeStep ? '✓' : i === activeStep ? '➜' : '○'} {step}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════════════ LIVE SCAN RESULTS ════════════ */}
      {result && !loading && (
        <div ref={resultRef} style={{ background: dm.bg, borderTop: `1px solid ${dm.border}`, padding: '48px 40px 0' }}>
          <p className="nl-demo-label" style={{ color: dm.text }}>Scan Results</p>
          <p className="nl-demo-sub" style={{ color: dm.muted }}>
            Completed {new Date(result.timestamp).toLocaleString()} ·{' '}
            {result.scanType === 'GITHUB' ? 'GitHub Repository' : 'Web URL'} scan
            {result.isDemo && ' · Demo Mode'}
          </p>

          {/* ── Result Header Card ── */}
          <div className="nl-result-mock" style={{ background: dm.cardBg, borderColor: dm.border }}>
            <div className="nl-result-header" style={{ background: dm.statBg, borderColor: dm.border }}>
              <span className="nl-result-url" style={{ color: dm.muted }}>{result.target}</span>
              <span className={`nl-result-badge ${badgeClass(result.riskLevel)}`}>
                {result.riskLevel === 'SECURE' ? 'SECURE' : `${result.riskLevel} RISK`}
              </span>
            </div>
            <div className="nl-result-body">
              {/* Score row */}
              <div className="nl-score-row">
                <div className="nl-score-num" style={{ color: scoreColor(result.riskLevel) }}>
                  {result.riskScore}
                </div>
                <div>
                  <div className="nl-score-level" style={{ color: scoreColor(result.riskLevel) }}>
                    {result.riskLevel}
                  </div>
                  <div className="nl-score-label" style={{ color: dm.muted }}>
                    Risk Index · Scanned {new Date(result.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* Severity stat counters */}
              <div className="nl-stat-row">
                {(['critical', 'high', 'medium', 'low'] as const).map((key) => (
                  <div className="nl-stat" key={key} style={{ background: dm.statBg }}>
                    <div className="nl-stat-n" style={{ color: statColor(key) }}>
                      {result.summary[key]}
                    </div>
                    <div className="nl-stat-lbl" style={{ color: dm.muted }}>{key.charAt(0).toUpperCase() + key.slice(1)}</div>
                  </div>
                ))}
              </div>

              {/* ── Share link & Badge ── */}
              {result.scanId && (
                <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                  <div style={{ background: dm.statBg, border: `1px solid ${dm.border}`, borderRadius: 8, padding: '10px 14px', flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: dm.muted, marginBottom: 4 }}>Shareable Link</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <code style={{ fontSize: 11, color: '#1a73e8', wordBreak: 'break-all' }}>
                        {typeof window !== 'undefined' ? `${window.location.origin}/report/${result.scanId}` : ''}
                      </code>
                      <button
                        className="nl-rec-copy"
                        onClick={() => handleCopy(`${window.location.origin}/report/${result.scanId}`, 'share')}
                      >
                        {copiedId === 'share' ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                  <div style={{ background: dm.statBg, border: `1px solid ${dm.border}`, borderRadius: 8, padding: '10px 14px', flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: dm.muted, marginBottom: 4 }}>README Badge</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <code style={{ fontSize: 11, color: '#1a73e8', wordBreak: 'break-all' }}>
                        {typeof window !== 'undefined' ? `![VulnLens](${window.location.origin}/api/badge/${result.scanId}?score=${result.riskScore}&level=${result.riskLevel})` : ''}
                      </code>
                      <button
                        className="nl-rec-copy"
                        onClick={() => handleCopy(
                          `![VulnLens](${window.location.origin}/api/badge/${result.scanId}?score=${result.riskScore}&level=${result.riskLevel})`,
                          'badge'
                        )}
                      >
                        {copiedId === 'badge' ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── AI Summary Section ── */}
              <div style={{
                background: dm.statBg, border: `1px solid ${dm.border}`,
                borderRadius: 12, padding: '16px 20px', marginBottom: 20
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: dm.text }}>
                    ✨ AI Security Summary
                  </span>
                  {!aiSummary && (
                    <button
                      onClick={fetchAiSummary}
                      disabled={loadingSummary}
                      style={{
                        background: '#e8f0fe', color: '#1a73e8', border: 'none',
                        borderRadius: 20, padding: '6px 16px', fontSize: 13,
                        fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit'
                      }}
                    >
                      {loadingSummary ? 'Analyzing…' : 'Generate Summary'}
                    </button>
                  )}
                </div>
                {aiSummary ? (
                  <p style={{ fontSize: 14, color: dm.muted, lineHeight: 1.7, margin: 0 }}>{aiSummary}</p>
                ) : (
                  <p style={{ fontSize: 13, color: dm.muted, margin: 0 }}>
                    Click &quot;Generate Summary&quot; for an AI-written plain-English explanation of these vulnerabilities.
                  </p>
                )}
              </div>

              {/* ── Severity Filter Chips ── */}
              <div className="nl-filter-bar" style={{ paddingLeft: 0 }}>
                {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((sev) => (
                  <button
                    key={sev}
                    className={`nl-filter-chip ${filterSeverity === sev ? 'active' : ''}`}
                    onClick={() => setFilterSeverity(sev)}
                  >
                    {sev === 'ALL' ? `All (${result.findings.length})` : sev}
                  </button>
                ))}
              </div>

              {/* ── Finding rows ── */}
              {filteredFindings.length === 0 ? (
                <div style={{ padding: '32px 0', textAlign: 'center', color: dm.muted, fontSize: 14 }}>
                  <span style={{ fontSize: 28, display: 'block', marginBottom: 8 }}>✓</span>
                  No findings match the selected filter.
                </div>
              ) : (
                filteredFindings.map((f) => (
                  <div key={f.id}>
                    <div
                      className="nl-finding"
                      style={{ cursor: 'pointer', background: dm.findingBg, borderColor: dm.border }}
                      onClick={() => setExpandedId(expandedId === f.id ? null : f.id)}
                    >
                      <span className={`nl-finding-chip ${chipClass(f.severity)}`}>{f.severity}</span>
                      <div style={{ flex: 1 }}>
                        <div className="nl-finding-title" style={{ color: dm.text }}>{f.title}</div>
                        <div className="nl-finding-desc" style={{ color: dm.muted }}>{f.description}</div>

                        {/* CVE reference */}
                        {f.cve && (
                          <div style={{ marginTop: 4, fontSize: 11, color: '#80868b', fontFamily: 'monospace' }}>
                            CVE: {f.cve}
                          </div>
                        )}
                      </div>
                      <span style={{ color: '#80868b', fontSize: 18, flexShrink: 0, transition: 'transform .2s', transform: expandedId === f.id ? 'rotate(180deg)' : 'rotate(0)' }}>
                        ▾
                      </span>
                    </div>

                    {/* Expanded recommendation + fix snippet */}
                    {expandedId === f.id && (
                      <div className="nl-rec" style={{ background: dm.recBg, borderColor: dm.border }}>
                        <div className="nl-rec-header">
                          <span className="nl-rec-label">🔒 Fix Recommendation</span>
                          <button
                            className="nl-rec-copy"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCopy(f.recommendation, f.id)
                            }}
                          >
                            {copiedId === f.id ? '✓ Copied' : 'Copy'}
                          </button>
                        </div>
                        <div style={{ fontFamily: 'inherit', whiteSpace: 'normal', lineHeight: 1.6 }}>
                          {f.recommendation}
                        </div>

                        {/* Code fix snippet */}
                        {f.fixSnippet && (
                          <div style={{ marginTop: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                              <span style={{ fontSize: 10, fontWeight: 600, color: '#1a73e8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                Code Fix
                              </span>
                              <button
                                className="nl-rec-copy"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleCopy(f.fixSnippet!, `fix-${f.id}`)
                                }}
                              >
                                {copiedId === `fix-${f.id}` ? '✓ Copied' : 'Copy'}
                              </button>
                            </div>
                            <pre style={{
                              background: '#1f1f1f', color: '#e8f5e9',
                              padding: '12px 14px', borderRadius: 8,
                              fontSize: 12, overflowX: 'auto',
                              whiteSpace: 'pre-wrap', margin: 0,
                              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                              lineHeight: 1.6, border: 'none'
                            }}>
                              {f.fixSnippet}
                            </pre>
                          </div>
                        )}

                        <div style={{ marginTop: 10 }}>
                          <span style={{
                            fontSize: 11, background: '#f1f3f4',
                            color: dm.muted, padding: '2px 8px', borderRadius: 20
                          }}>
                            {f.category}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════ DEMO (How it works – 3 cards) ════════════ */}
      {!result && !loading && (
        <div className="nl-demo-section">
          <p className="nl-demo-label">Your AI-powered security audit partner</p>
          <p className="nl-demo-sub">Paste any URL or GitHub repo. Get a detailed risk classification report instantly.</p>

          <div className="nl-steps">
            <div className="nl-step">
              <div className="nl-step-icon" style={{ background: '#e8f0fe' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" strokeWidth="2" strokeLinecap="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </div>
              <div className="nl-step-title">Enter your target</div>
              <div className="nl-step-body">Paste a website URL for live header and XSS scanning, or a GitHub repo link for dependency auditing.</div>
            </div>
            <div className="nl-step">
              <div className="nl-step-icon" style={{ background: '#e6f4ea' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#34a853" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div className="nl-step-title">Scan runs automatically</div>
              <div className="nl-step-body">Five parallel scanners check headers, XSS vectors, CORS, SSL/TLS, sensitive paths, and npm dependencies against the OSV.dev database.</div>
            </div>
            <div className="nl-step">
              <div className="nl-step-icon" style={{ background: '#fce8e6' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c5221f" strokeWidth="2" strokeLinecap="round">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              </div>
              <div className="nl-step-title">Get your risk report</div>
              <div className="nl-step-body">Every finding includes severity rating, fix recommendations, code snippets, and an AI-generated security summary. Export as HTML report.</div>
            </div>
          </div>

          {/* ── Static demo result mock ── */}
          <div className="nl-result-mock">
            <div className="nl-result-header">
              <span className="nl-result-url">github.com/YASH-HCKT/EmpowerAble.git</span>
              <span className="nl-result-badge badge-critical">CRITICAL RISK</span>
            </div>
            <div className="nl-result-body">
              <div className="nl-score-row">
                <div className="nl-score-num" style={{ color: '#c5221f' }}>98</div>
                <div>
                  <div className="nl-score-level" style={{ color: '#c5221f' }}>CRITICAL</div>
                  <div className="nl-score-label">Risk Index · Sample Report</div>
                </div>
              </div>
              <div className="nl-stat-row">
                <div className="nl-stat"><div className="nl-stat-n" style={{ color: '#c5221f' }}>3</div><div className="nl-stat-lbl">Critical</div></div>
                <div className="nl-stat"><div className="nl-stat-n" style={{ color: '#e37400' }}>0</div><div className="nl-stat-lbl">High</div></div>
                <div className="nl-stat"><div className="nl-stat-n" style={{ color: '#137333' }}>1</div><div className="nl-stat-lbl">Medium</div></div>
                <div className="nl-stat"><div className="nl-stat-n" style={{ color: '#5f6368' }}>0</div><div className="nl-stat-lbl">Low</div></div>
              </div>
              <div className="nl-finding">
                <span className="nl-finding-chip chip-critical">CRITICAL</span>
                <div><div className="nl-finding-title">Vulnerable Dependency: axios@^1.13.6</div><div className="nl-finding-desc">Found 23 known vulnerabilities · CVEs: GHSA-35jp-ww65-95wh, GHSA-3g43-6gmg-66jw</div></div>
              </div>
              <div className="nl-finding">
                <span className="nl-finding-chip chip-critical">CRITICAL</span>
                <div><div className="nl-finding-title">.env File Exposed in Repository</div><div className="nl-finding-desc">A .env file was found publicly. May contain API keys, DB credentials.</div></div>
              </div>
              <div className="nl-finding">
                <span className="nl-finding-chip chip-medium">MEDIUM</span>
                <div><div className="nl-finding-title">Vulnerable Dependency: postcss@^8.5.6</div><div className="nl-finding-desc">Found 1 known vulnerability · CVE: GHSA-qx2v-qp2m-jg93</div></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════ WHAT VULNLENS CHECKS ════════════ */}
      {!result && !loading && (
        <div className="nl-how" id="how-it-works">
          <p className="nl-how-h">What VulnLens checks</p>
          <p className="nl-how-sub">Five independent scanners run in parallel for a complete security picture.</p>
          <div className="nl-checks">
            <div className="nl-check">
              <div className="nl-check-icon" style={{ background: '#e8f0fe' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" strokeWidth="2" strokeLinecap="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" />
                  <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                </svg>
              </div>
              <div>
                <div className="nl-check-title">Security headers</div>
                <div className="nl-check-body">Checks for HSTS, Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, CORS misconfiguration, and cookie security flags.</div>
              </div>
            </div>
            <div className="nl-check">
              <div className="nl-check-icon" style={{ background: '#e6f4ea' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34a853" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                </svg>
              </div>
              <div>
                <div className="nl-check-title">Dependency vulnerabilities</div>
                <div className="nl-check-body">Reads package.json from any public GitHub repo and queries OSV.dev — the open-source vulnerability database — to find known CVEs in your npm dependencies.</div>
              </div>
            </div>
            <div className="nl-check">
              <div className="nl-check-icon" style={{ background: '#fce8e6' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c5221f" strokeWidth="2" strokeLinecap="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div>
                <div className="nl-check-title">XSS, SSL/TLS & sensitive paths</div>
                <div className="nl-check-body">Scans for eval() usage, document.write(), inline event handlers, missing CSRF tokens, HTTP→HTTPS redirect issues, open redirects, and exposed files like .env, .git, backups, and admin panels.</div>
              </div>
            </div>
          </div>
          <Faq3 />
        </div>
      )}

      {/* ════════════ FOOTER ════════════ */}
      <div className="nl-footer" style={result ? { borderColor: dm.border, color: dm.muted } : undefined}>
        <div>VulnLens · Security Scanner · v1.2.0</div>
        <div className="nl-footer-links">
          <a href="#overview" style={result ? { color: dm.muted } : undefined}>Documentation</a>
          <a href="https://api.osv.dev" target="_blank" rel="noreferrer" style={result ? { color: dm.muted } : undefined}>OSV.dev API</a>
          <a href="#how-it-works" style={result ? { color: dm.muted } : undefined}>How it works</a>
          <span>MIT License</span>
        </div>
      </div>
    </div>
  )
}
