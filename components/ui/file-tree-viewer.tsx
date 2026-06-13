'use client'

import { useState } from 'react'
import { RepoFileNode } from '@/lib/types'

/* ── File icon by extension (matches VS Code seti-style colors) ── */
function FileIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  const base = name.toLowerCase()

  const colorMap: Record<string, string> = {
    tsx: '#3178c6', ts: '#3178c6', jsx: '#61dafb', js: '#f1e05a',
    json: '#cbcb41', css: '#563d7c', scss: '#c6538c', html: '#e34c26',
    md: '#83a598', svg: '#ffb13b', png: '#a074c4', jpg: '#a074c4',
    ico: '#a074c4', env: '#ecd53f', yml: '#cb171e', yaml: '#cb171e',
    lock: '#cbcb41', gitignore: '#f54d27',
  }

  let color = colorMap[ext] || '#90a4ae'
  if (base.includes('.env')) color = '#ecd53f'
  if (base === 'readme.md') color = '#519aba'

  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path
        d="M4 2.5C4 1.67 4.67 1 5.5 1H13l5 5v14.5c0 .83-.67 1.5-1.5 1.5h-12C3.67 22 3 21.33 3 20.5v-18z"
        fill={color}
        opacity="0.18"
        stroke={color}
        strokeWidth="1.2"
      />
      <path d="M13 1v5h5" stroke={color} strokeWidth="1.2" fill="none" />
    </svg>
  )
}

function FolderIcon({ open }: { open: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      {open ? (
        <path d="M2 5.5C2 4.67 2.67 4 3.5 4h5l2 2h10c.83 0 1.5.67 1.5 1.5v1H2v-3z M2 8.5h20l-1.5 10.5c-.1.7-.7 1.2-1.4 1.2H4.9c-.7 0-1.3-.5-1.4-1.2L2 8.5z"
          fill="#90caf9" stroke="#42a5f5" strokeWidth="0.8" strokeLinejoin="round" />
      ) : (
        <path d="M2 5.5C2 4.67 2.67 4 3.5 4h5l2 2h10c.83 0 1.5.67 1.5 1.5v11c0 .83-.67 1.5-1.5 1.5h-17C2.67 19 2 18.33 2 17.5v-12z"
          fill="#90caf9" stroke="#42a5f5" strokeWidth="0.8" strokeLinejoin="round" />
      )}
    </svg>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{
      flexShrink: 0, transition: 'transform .15s ease',
      transform: open ? 'rotate(90deg)' : 'rotate(0deg)'
    }}>
      <path d="M9 6l6 6-6 6" stroke="#5f6368" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

interface TreeNodeProps {
  node: RepoFileNode
  depth: number
  flaggedPaths: Set<string>
  selectedPath: string | null
  onSelectFile: (path: string) => void
  defaultOpenPaths: Set<string>
}

function TreeNode({ node, depth, flaggedPaths, selectedPath, onSelectFile, defaultOpenPaths }: TreeNodeProps) {
  const [open, setOpen] = useState(defaultOpenPaths.has(node.path))
  const isFlagged = flaggedPaths.has(node.path)
  const isSelected = selectedPath === node.path

  if (node.type === 'dir') {
    return (
      <div>
        <div
          onClick={() => setOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 8px', paddingLeft: 8 + depth * 16,
            cursor: 'pointer', borderRadius: 4, fontSize: 13,
            color: '#1f1f1f', userSelect: 'none',
          }}
          className="ft-row"
        >
          <ChevronIcon open={open} />
          <FolderIcon open={open} />
          <span style={{ fontWeight: 500 }}>{node.name}</span>
        </div>
        {open && node.children && (
          <div>
            {node.children.map(child => (
              <TreeNode
                key={child.path}
                node={child}
                depth={depth + 1}
                flaggedPaths={flaggedPaths}
                selectedPath={selectedPath}
                onSelectFile={onSelectFile}
                defaultOpenPaths={defaultOpenPaths}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      onClick={() => onSelectFile(node.path)}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '4px 8px', paddingLeft: 8 + depth * 16 + 18,
        cursor: 'pointer', borderRadius: 4, fontSize: 13,
        color: isFlagged ? '#c5221f' : '#1f1f1f',
        background: isSelected ? '#e8f0fe' : 'transparent',
        fontWeight: isFlagged ? 500 : 400,
        userSelect: 'none', position: 'relative',
      }}
      className="ft-row"
    >
      <FileIcon name={node.name} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.name}</span>
      {isFlagged && (
        <span style={{
          width: 7, height: 7, borderRadius: '50%', background: '#c5221f',
          marginLeft: 'auto', flexShrink: 0
        }} title="Vulnerability found in this file" />
      )}
    </div>
  )
}

interface FileTreeViewerProps {
  tree: RepoFileNode[]
  flaggedPaths: string[]
  selectedPath: string | null
  onSelectFile: (path: string) => void
}

export default function FileTreeViewer({ tree, flaggedPaths, selectedPath, onSelectFile }: FileTreeViewerProps) {
  const flagSet = new Set(flaggedPaths)

  // Auto-expand directories that lead to a flagged file
  const defaultOpenPaths = new Set<string>()
  for (const fp of flaggedPaths) {
    const parts = fp.split('/')
    for (let i = 1; i < parts.length; i++) {
      defaultOpenPaths.add(parts.slice(0, i).join('/'))
    }
  }
  // Also open top-level dirs by default
  for (const node of tree) {
    if (node.type === 'dir') defaultOpenPaths.add(node.path)
  }

  return (
    <div style={{
      background: '#fff', border: '1px solid #e8eaed', borderRadius: 12,
      overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column'
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px', borderBottom: '1px solid #e8eaed',
        background: '#f8f9fa'
      }}>
        <span style={{ display: 'flex', gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
        </span>
        <span style={{ fontSize: 12, fontWeight: 500, color: '#5f6368', marginLeft: 6 }}>EXPLORER</span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 4px', maxHeight: 460 }}>
        {tree.map(node => (
          <TreeNode
            key={node.path}
            node={node}
            depth={0}
            flaggedPaths={flagSet}
            selectedPath={selectedPath}
            onSelectFile={onSelectFile}
            defaultOpenPaths={defaultOpenPaths}
          />
        ))}
      </div>
      <style>{`
        .ft-row:hover { background: #f1f3f4; }
      `}</style>
    </div>
  )
}
