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

function detectLang(text: string): string {
  const hindiChars = (text.match(/[\u0900-\u097F]/g) || []).length
  return hindiChars / text.length > 0.2 ? 'hi-IN' : 'en-IN'
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

    const lang = detectLang(text)

    const response = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': apiKey,
      },
      body: JSON.stringify({
        inputs: [text],
        target_language_code: lang,
        speaker: 'karun',          // Indian male voice (bulbul:v2 compatible)
        pitch: 0,
        pace: 1.0,
        loudness: 1.5,
        speech_sample_rate: 22050,
        enable_preprocessing: true,
        model: 'bulbul:v2',
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

    // Sarvam returns base64 WAV
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
