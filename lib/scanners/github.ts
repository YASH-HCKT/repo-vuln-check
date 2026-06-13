import { Finding, RepoFileNode } from '../types'

// OSV.dev — free, no API key needed
async function checkOSV(packageName: string, version: string): Promise<string[]> {
  try {
    const res = await fetch('https://api.osv.dev/v1/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        package: { name: packageName, ecosystem: 'npm' },
        version: version.replace(/[\^~>=<]/g, '') // strip semver symbols
      }),
      signal: AbortSignal.timeout(5000)
    })
    const data = await res.json()
    // return CVE IDs if any vulns found
    return data.vulns?.map((v: any) => v.id) || []
  } catch {
    return []
  }
}

function extractRepoInfo(input: string): { owner: string, repo: string } | null {
  // Handle: github.com/user/repo or https://github.com/user/repo
  const match = input.match(/github\.com\/([^/]+)\/([^/\s?#]+)/)
  if (!match) return null
  return { owner: match[1], repo: match[2].replace('.git', '') }
}

// Fetch default branch name for a repo
async function getDefaultBranch(owner: string, repo: string): Promise<string> {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'VulnLens-Scanner' },
      signal: AbortSignal.timeout(6000)
    })
    if (!res.ok) return 'main'
    const data = await res.json()
    return data.default_branch || 'main'
  } catch {
    return 'main'
  }
}

// Fetch full repo file tree (recursive) and build a nested structure for the file explorer
export async function fetchRepoTree(repoUrl: string): Promise<RepoFileNode[] | null> {
  const repoInfo = extractRepoInfo(repoUrl)
  if (!repoInfo) return null
  const { owner, repo } = repoInfo

  try {
    const branch = await getDefaultBranch(owner, repo)
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
      {
        headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'VulnLens-Scanner' },
        signal: AbortSignal.timeout(10000)
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    if (!Array.isArray(data.tree)) return null

    // Build nested tree from flat paths
    const root: RepoFileNode[] = []

    for (const item of data.tree) {
      // Skip very deep paths / huge repos to keep payload small
      const parts: string[] = item.path.split('/')
      let level = root

      for (let i = 0; i < parts.length; i++) {
        const isLast = i === parts.length - 1
        const currentPath = parts.slice(0, i + 1).join('/')
        let existing = level.find(n => n.name === parts[i])

        if (!existing) {
          existing = {
            name: parts[i],
            path: currentPath,
            type: isLast ? (item.type === 'tree' ? 'dir' : 'file') : 'dir',
            children: (isLast && item.type !== 'tree') ? undefined : []
          }
          level.push(existing)
        }

        if (existing.children) {
          level = existing.children
        }
      }
    }

    // Sort: directories first, then files, alphabetically
    const sortTree = (nodes: RepoFileNode[]) => {
      nodes.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'dir' ? -1 : 1
        return a.name.localeCompare(b.name)
      })
      for (const n of nodes) {
        if (n.children) sortTree(n.children)
      }
    }
    sortTree(root)

    return root
  } catch {
    return null
  }
}

// Fetch raw content of a single file from a repo (used by the code viewer)
export async function fetchFileContent(repoUrl: string, filePath: string): Promise<string | null> {
  const repoInfo = extractRepoInfo(repoUrl)
  if (!repoInfo) return null
  const { owner, repo } = repoInfo

  try {
    const branch = await getDefaultBranch(owner, repo)
    const res = await fetch(
      `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

export async function scanGithub(repoUrl: string): Promise<Finding[]> {
  const findings: Finding[] = []
  const repoInfo = extractRepoInfo(repoUrl)

  if (!repoInfo) {
    findings.push({
      id: 'invalid-repo',
      title: 'Invalid GitHub URL',
      description: 'Could not parse repository owner and name from URL.',
      severity: 'INFO',
      category: 'DEPENDENCIES',
      recommendation: 'Use format: https://github.com/username/repository'
    })
    return findings
  }

  const { owner, repo } = repoInfo

  try {
    // Fetch package.json from GitHub API
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/package.json`
    const res = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'VulnLens-Scanner'
      },
      signal: AbortSignal.timeout(8000)
    })

    if (!res.ok) {
      findings.push({
        id: 'no-package-json',
        title: 'No package.json Found',
        description: 'Repository may not be a Node.js project or is private.',
        severity: 'INFO',
        category: 'DEPENDENCIES',
        recommendation: 'Ensure the repository is public and contains a package.json.'
      })
      return findings
    }

    const fileData = await res.json()
    const rawText = Buffer.from(fileData.content, 'base64').toString('utf-8')
    const content = JSON.parse(rawText)
    const pkgLines = rawText.split('\n')

    const allDeps = {
      ...content.dependencies,
      ...content.devDependencies
    }

    if (Object.keys(allDeps).length === 0) {
      return findings
    }

    // Check top 15 packages against OSV (rate limit friendly)
    const packagesToCheck = Object.entries(allDeps).slice(0, 15)

    const checks = await Promise.allSettled(
      packagesToCheck.map(async ([name, version]) => {
        const cves = await checkOSV(name, version as string)
        return { name, version, cves }
      })
    )

    for (const result of checks) {
      if (result.status === 'fulfilled' && result.value.cves.length > 0) {
        const { name, version, cves } = result.value

        // Find the line number where this dependency is declared in package.json
        const lineIndex = pkgLines.findIndex(line => line.includes(`"${name}"`))
        const lineNumber = lineIndex >= 0 ? lineIndex + 1 : undefined

        findings.push({
          id: `dep-vuln-${name}`,
          title: `Vulnerable Dependency: ${name}@${version}`,
          description: `Found ${cves.length} known vulnerability(s). CVEs: ${cves.slice(0, 3).join(', ')}`,
          severity: cves.length >= 3 ? 'CRITICAL' : cves.length === 2 ? 'HIGH' : 'MEDIUM',
          category: 'DEPENDENCIES',
          recommendation: `Run: npm audit fix  or update ${name} to latest version.`,
          cve: cves[0],
          filePath: 'package.json',
          lineNumber
        })
      }
    }

    // Also check if .env files are accidentally committed
    try {
      const envCheck = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/.env`,
        { headers: { 'User-Agent': 'VulnLens-Scanner' } }
      )
      if (envCheck.ok) {
        findings.push({
          id: 'exposed-env',
          title: '.env File Exposed in Repository',
          description: 'A .env file was found publicly in this repository. May contain API keys, DB credentials.',
          severity: 'CRITICAL',
          category: 'GENERAL',
          recommendation: 'Remove .env immediately, rotate all credentials, add .env to .gitignore.',
          filePath: '.env',
          lineNumber: 1
        })
      }
    } catch { /* .env not found = good */ }

  } catch (err: any) {
    findings.push({
      id: 'github-error',
      title: 'GitHub API Error',
      description: err.message || 'Failed to fetch repository data.',
      severity: 'INFO',
      category: 'DEPENDENCIES',
      recommendation: 'Check if the repository is public and the URL is correct.'
    })
  }

  return findings
}
