import { NextRequest, NextResponse } from 'next/server'
import { fetchFileContent } from '@/lib/scanners/github'

export async function POST(req: NextRequest) {
  try {
    const { repoUrl, filePath } = await req.json()

    if (!repoUrl || !filePath) {
      return NextResponse.json({ error: 'Missing repoUrl or filePath' }, { status: 400 })
    }

    const content = await fetchFileContent(repoUrl, filePath)

    if (content === null) {
      return NextResponse.json({ error: 'File not found or could not be fetched' }, { status: 404 })
    }

    return NextResponse.json({ content })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch file' }, { status: 500 })
  }
}
