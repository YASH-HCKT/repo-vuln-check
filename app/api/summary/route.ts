import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { findings, target, riskScore, riskLevel } = await req.json()

  const findingsList = findings
    .filter((f: any) => f.severity !== 'INFO')
    .map((f: any) => `- [${f.severity}] ${f.title}: ${f.description}`)
    .join('\n')

  const prompt = `You are a security expert writing for developers. Analyze these scan results for ${target} and write a concise, plain-English summary in 3-4 sentences. Focus on the most critical risks and their real-world impact. Be specific, not generic.

Risk Score: ${riskScore}/100 (${riskLevel})

Findings:
${findingsList}

Write only the summary paragraph, no headers, no bullet points.`

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      // Fallback: generate a local summary without AI
      return NextResponse.json({ summary: generateLocalSummary(findings, target, riskScore, riskLevel) })
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    const data = await response.json()
    const summary = data.content?.[0]?.text || 'Unable to generate summary.'
    return NextResponse.json({ summary })

  } catch {
    return NextResponse.json({ summary: generateLocalSummary(findings, target, riskScore, riskLevel) })
  }
}

function generateLocalSummary(findings: any[], target: string, riskScore: number, riskLevel: string): string {
  const critCount = findings.filter((f: any) => f.severity === 'CRITICAL').length
  const highCount = findings.filter((f: any) => f.severity === 'HIGH').length
  const total = findings.filter((f: any) => f.severity !== 'INFO').length

  if (total === 0) {
    return `No significant vulnerabilities were detected for ${target}. The site appears to follow security best practices.`
  }

  const parts: string[] = []
  parts.push(`Security scan of ${target} found ${total} issue${total > 1 ? 's' : ''} with a risk score of ${riskScore}/100 (${riskLevel}).`)

  if (critCount > 0) {
    const critFindings = findings.filter((f: any) => f.severity === 'CRITICAL').map((f: any) => f.title).join(', ')
    parts.push(`Critical issues include: ${critFindings}.`)
  }

  if (highCount > 0) {
    parts.push(`${highCount} high-severity finding${highCount > 1 ? 's were' : ' was'} also detected that should be addressed promptly.`)
  }

  parts.push('Review each finding and apply the recommended fixes to improve your security posture.')
  return parts.join(' ')
}
