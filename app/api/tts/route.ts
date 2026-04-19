import { NextRequest, NextResponse } from 'next/server'

function cleanText(raw: string): string {
  if (typeof raw !== 'string') return ''
  return raw
    .replace(/\[(CHAT|SCRIPTURE|TEACHING|GUIDANCE|ENGLISH_REPLY|HINDI_REPLY)\]/gi, '')
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
    .replace(/_{1,2}([^_]+)_{1,2}/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const rawText: unknown = body?.text

    if (!rawText) {
      return NextResponse.json({ detail: 'Text is required' }, { status: 400 })
    }

    const text = cleanText(String(rawText))
    if (!text) {
      return NextResponse.json({ detail: 'Text empty after cleaning' }, { status: 400 })
    }

    const apiKey = process.env.SARVAM_API_KEY
    if (!apiKey) {
      return NextResponse.json({ detail: 'SARVAM_API_KEY not configured' }, { status: 500 })
    }

    // Bulbul:v3 handles Hindi Unicode natively - no more stripping!
    // We use 'shubh' as the premium male voice. 
    // We send the first 500 chars to ensure stability, but v3 supports up to 2500.
    const safeText = text.slice(0, 1000)

    const response = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': apiKey,
      },
      body: JSON.stringify({
        inputs: [safeText],
        target_language_code: 'hi-IN',
        speaker: 'shubh',
        model: 'bulbul:v3',
        pace: 1.0,
        temperature: 0.6,
        sample_rate: 24000
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      console.error('Sarvam TTS error:', response.status, err)
      return NextResponse.json({ detail: 'Sarvam TTS failed' }, { status: response.status })
    }

    const data = await response.json()
    const b64 = data?.audios?.[0]
    if (!b64) {
      console.error('Sarvam TTS: no audio in response', data)
      return NextResponse.json({ detail: 'No audio returned' }, { status: 500 })
    }

    const audioBuffer = Buffer.from(b64, 'base64')
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': String(audioBuffer.byteLength),
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('TTS route error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ detail: message }, { status: 500 })
  }
}
