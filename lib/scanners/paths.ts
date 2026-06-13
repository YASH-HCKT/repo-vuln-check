import { Finding } from '../types'

const SENSITIVE_PATHS = [
  { path: '/.env', title: '.env File Exposed', severity: 'CRITICAL' as const, description: 'Environment file is publicly accessible. May contain DB credentials, API keys, secrets.' },
  { path: '/.git/config', title: '.git Directory Exposed', severity: 'CRITICAL' as const, description: 'Git config is publicly accessible. Full source code may be downloadable.' },
  { path: '/admin', title: 'Admin Panel Exposed', severity: 'HIGH' as const, description: 'Admin interface is publicly accessible without authentication check.' },
  { path: '/wp-admin', title: 'WordPress Admin Exposed', severity: 'MEDIUM' as const, description: 'WordPress admin login is exposed — target for brute force attacks.' },
  { path: '/phpinfo.php', title: 'phpinfo() Page Exposed', severity: 'HIGH' as const, description: 'PHP configuration details are publicly visible.' },
  { path: '/.DS_Store', title: '.DS_Store File Exposed', severity: 'MEDIUM' as const, description: 'Mac filesystem metadata exposed — reveals directory structure.' },
  { path: '/config.json', title: 'config.json Exposed', severity: 'HIGH' as const, description: 'Application config file is publicly accessible.' },
  { path: '/backup.sql', title: 'Database Backup Exposed', severity: 'CRITICAL' as const, description: 'SQL database backup is publicly downloadable.' },
]

export async function scanSensitivePaths(baseUrl: string): Promise<Finding[]> {
  const findings: Finding[] = []

  try {
    const origin = new URL(baseUrl).origin

    const checks = await Promise.allSettled(
      SENSITIVE_PATHS.map(async (item) => {
        const testUrl = `${origin}${item.path}`
        const res = await fetch(testUrl, {
          signal: AbortSignal.timeout(4000),
          redirect: 'manual'
        })
        return { item, status: res.status }
      })
    )

    for (const result of checks) {
      if (result.status === 'fulfilled') {
        const { item, status } = result.value
        if (status === 200) {
          findings.push({
            id: `path-exposed-${item.path}`,
            title: item.title,
            description: item.description,
            severity: item.severity,
            category: 'GENERAL',
            recommendation: `Block access to ${item.path} via server config or .htaccess. Return 404 instead of 200/403.`
          })
        }
      }
    }
  } catch { /* silent */ }

  return findings
}
