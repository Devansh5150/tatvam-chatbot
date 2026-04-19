import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const audio    = formData.get('audio') as File | null
    const lang     = (formData.get('lang') as string) || 'en-IN'

    if (!audio) return NextResponse.json({ error: 'No audio' }, { status: 400 })

    const groqKey = process.env.GROQ_API_KEY
    if (!groqKey) return NextResponse.json({ error: 'Missing API key' }, { status: 500 })

    const body = new FormData()
    body.append('file', audio, 'audio.webm')
    body.append('model', 'whisper-large-v3-turbo')
    body.append('language', lang.startsWith('hi') ? 'hi' : 'en')
    body.append('response_format', 'json')

    const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${groqKey}` },
      body,
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[STT] Groq Whisper error:', res.status, err)
      return NextResponse.json({ error: 'Transcription failed' }, { status: 500 })
    }

    const data = await res.json()
    return NextResponse.json({ transcript: data.text?.trim() || '' })
  } catch (e) {
    console.error('[STT] Error:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
