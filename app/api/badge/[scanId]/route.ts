import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ scanId: string }> }
) {
  const { scanId } = await params

  // In real version: fetch from DB. For now use query params
  const url = new URL(req.url)
  const score = parseInt(url.searchParams.get('score') || '0')
  const level = url.searchParams.get('level') || 'UNKNOWN'

  const color =
    level === 'CRITICAL' ? 'e05d44' :
    level === 'HIGH' ? 'fe7d37' :
    level === 'MODERATE' ? 'dfb317' :
    '4c1'

  // Redirect to shields.io badge
  const badgeUrl = `https://img.shields.io/badge/VulnLens-${level}%20${score}%2F100-${color}?style=flat&logo=shield&logoColor=white`

  return NextResponse.redirect(badgeUrl)
}
