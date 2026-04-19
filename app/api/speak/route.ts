import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { text: rawText } = await req.json()

    if (!rawText) {
      return NextResponse.json({ detail: 'Text is required' }, { status: 400 })
    }

    // Strip response markers and markdown so they are never spoken aloud
    const text = (rawText as string)
      .replace(/\[(CHAT|SCRIPTURE|TEACHING|GUIDANCE|ENGLISH_REPLY|HINDI_REPLY)\]/gi, '')
      .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
      .replace(/_{1,2}([^_]+)_{1,2}/g, '$1')
      .replace(/\s{2,}/g, ' ')
      .trim()

    const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'nPczCjzI2devNBz1zQrb'
    const apiKey = process.env.ELEVENLABS_API_KEY

    if (!apiKey) {
      return NextResponse.json({ detail: 'ElevenLabs API key is not configured.' }, { status: 401 })
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'xi-api-key': apiKey },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability: 0.45, similarity_boost: 0.85, style: 0.35, use_speaker_boost: true },
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { detail: errorData?.detail?.message || 'Failed to generate audio' },
        { status: response.status }
      )
    }

    return new NextResponse(response.body, { headers: { 'Content-Type': 'audio/mpeg' } })
  } catch (err) {
    return NextResponse.json({ detail: err.message }, { status: 500 })
  }
}
