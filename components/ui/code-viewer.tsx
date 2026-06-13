'use client'

import { useEffect, useState } from 'react'

interface CodeViewerProps {
  repoUrl: string
  filePath: string | null
  highlightLine?: number
}

export default function CodeViewer({ repoUrl, filePath, highlightLine }: CodeViewerProps) {
  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!filePath) {
      setContent(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setError('')
    setContent(null)

    fetch('/api/file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoUrl, filePath })
    })
      .then(res => res.json())
      .then(data => {
        if (cancelled) return
        if (data.error) {
          setError(data.error)
        } else {
          setContent(data.content)
        }
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load file.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [repoUrl, filePath])

  // Scroll highlighted line into view
  useEffect(() => {
    if (highlightLine && content) {
      setTimeout(() => {
        const el = document.getElementById(`cv-line-${highlightLine}`)
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    }
  }, [highlightLine, content])

  if (!filePath) {
    return (
      <div style={{
        background: '#fff', border: '1px solid #e8eaed', borderRadius: 12,
        height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#80868b', fontSize: 13, minHeight: 460
      }}>
        Select a file from the explorer to view its contents
      </div>
    )
  }

  const lines = content?.split('\n') || []

  return (
    <div style={{
      background: '#fff', border: '1px solid #e8eaed', borderRadius: 12,
      overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column'
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', borderBottom: '1px solid #e8eaed', background: '#f8f9fa'
      }}>
        <span style={{
          fontSize: 12, fontWeight: 500, color: '#1f1f1f',
          fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
        }}>
          {filePath}
        </span>
        {highlightLine && (
          <span style={{
            fontSize: 11, fontWeight: 500, color: '#c5221f', background: '#fce8e6',
            padding: '2px 8px', borderRadius: 12, flexShrink: 0, marginLeft: 8
          }}>
            Issue on line {highlightLine}
          </span>
        )}
      </div>

      <div style={{ flex: 1, overflow: 'auto', maxHeight: 460 }}>
        {loading && (
          <div style={{ padding: 20, color: '#80868b', fontSize: 13 }}>Loading file…</div>
        )}
        {error && (
          <div style={{ padding: 20, color: '#80868b', fontSize: 13 }}>
            {error.includes('not found') ? 'Could not load this file from GitHub (binary, too large, or path not found).' : error}
          </div>
        )}
        {!loading && !error && content !== null && (
          <pre style={{
            margin: 0, fontFamily: 'ui-monospace, SFMono-Regular, "Cascadia Code", monospace',
            fontSize: 12.5, lineHeight: '20px', color: '#1f1f1f'
          }}>
            {lines.map((line, i) => {
              const lineNum = i + 1
              const isHighlighted = highlightLine === lineNum
              return (
                <div
                  key={i}
                  id={`cv-line-${lineNum}`}
                  style={{
                    display: 'flex',
                    background: isHighlighted ? '#fce8e6' : 'transparent',
                    borderLeft: isHighlighted ? '3px solid #c5221f' : '3px solid transparent',
                  }}
                >
                  <span style={{
                    width: 48, textAlign: 'right', paddingRight: 12,
                    color: isHighlighted ? '#c5221f' : '#9aa0a6',
                    userSelect: 'none', flexShrink: 0,
                    fontWeight: isHighlighted ? 600 : 400,
                  }}>
                    {lineNum}
                  </span>
                  <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', paddingRight: 14 }}>
                    {line || ' '}
                  </span>
                </div>
              )
            })}
          </pre>
        )}
      </div>
    </div>
  )
}
