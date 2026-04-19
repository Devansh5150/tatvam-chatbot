'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface VoiceInteractionResult {
  isListening: boolean
  isSpeaking: boolean
  transcript: string
  interimTranscript: string
  error: string | null
  startListening: (lang?: string) => void
  stopListening: () => void
  speak: (text: string, lang?: string) => Promise<void>
  cancelSpeech: () => void
}

export function useVoiceInteraction(): VoiceInteractionResult {
  const [isListening, setIsListening]               = useState(false)
  const [isSpeaking, setIsSpeaking]                 = useState(false)
  const [transcript, setTranscript]                 = useState('')
  const [interimTranscript, setInterimTranscript]   = useState('')
  const [error, setError]                           = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef   = useRef<Blob[]>([])
  const streamRef        = useRef<MediaStream | null>(null)
  const audioRef         = useRef<HTMLAudioElement | null>(null)
  const synthRef         = useRef<SpeechSynthesis | null>(null)
  const isSpeakingRef    = useRef(false)
  const langRef          = useRef('en-IN')

  // Silence detection
  const audioCtxRef      = useRef<AudioContext | null>(null)
  const analyserRef      = useRef<AnalyserNode | null>(null)
  const silenceTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const silenceCountRef  = useRef(0)
  const hasSpokenRef     = useRef(false)
  const maxTimerRef      = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') synthRef.current = window.speechSynthesis
    return () => { teardown(); audioRef.current?.pause() }
  }, [])

  useEffect(() => { isSpeakingRef.current = isSpeaking }, [isSpeaking])

  const teardown = useCallback(() => {
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null }
    if (maxTimerRef.current)     { clearTimeout(maxTimerRef.current);     maxTimerRef.current = null }
    if (audioCtxRef.current)     { audioCtxRef.current.close().catch(() => {}); audioCtxRef.current = null }
    analyserRef.current = null
    if (streamRef.current)       { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null }
  }, [])

  const processAudio = useCallback(async (chunks: Blob[]) => {
    if (!chunks.length) return
    const blob = new Blob(chunks, { type: 'audio/webm' })
    if (blob.size < 500) return

    const form = new FormData()
    form.append('audio', blob, 'audio.webm')
    form.append('lang', langRef.current)

    try {
      const res  = await fetch('/api/stt', { method: 'POST', body: form })
      const data = await res.json()
      if (data.transcript?.trim()) setTranscript(data.transcript.trim())
    } catch (e) {
      console.error('[STT] Transcription error:', e)
      setError('Could not transcribe. Try again.')
    }
  }, [])

  const startSilenceDetection = useCallback((stream: MediaStream, recorder: MediaRecorder) => {
    try {
      const ctx      = new AudioContext()
      const source   = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      audioCtxRef.current   = ctx
      analyserRef.current   = analyser
      silenceCountRef.current = 0
      hasSpokenRef.current    = false

      const freqData = new Uint8Array(analyser.frequencyBinCount)

      const check = () => {
        if (!analyserRef.current || recorder.state !== 'recording') return
        analyserRef.current.getByteFrequencyData(freqData)
        const avg = freqData.reduce((a, b) => a + b, 0) / freqData.length

        if (avg > 12) {
          hasSpokenRef.current    = true
          silenceCountRef.current = 0
        } else if (hasSpokenRef.current) {
          silenceCountRef.current++
          if (silenceCountRef.current >= 35) { // ~1.75s silence after speech
            if (recorder.state === 'recording') recorder.stop()
            return
          }
        }
        silenceTimerRef.current = setTimeout(check, 50)
      }

      silenceTimerRef.current = setTimeout(check, 200)

      // Hard cap: 30s
      maxTimerRef.current = setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop()
      }, 30000)
    } catch (e) {
      console.warn('[STT] Silence detection unavailable:', e)
    }
  }, [])

  const startListening = useCallback(async (lang = 'en-IN') => {
    if (isSpeakingRef.current) return
    langRef.current = lang
    setError(null)
    setTranscript('')
    setInterimTranscript('')
    audioChunksRef.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }

      recorder.onstart = () => {
        setIsListening(true)
        setInterimTranscript('Listening…')
      }

      recorder.onstop = async () => {
        teardown()
        setInterimTranscript('Processing…')
        const chunks = [...audioChunksRef.current]
        audioChunksRef.current = []
        await processAudio(chunks)
        setInterimTranscript('')
        setIsListening(false)
      }

      recorder.onerror = () => {
        teardown()
        setIsListening(false)
        setInterimTranscript('')
        setError('Recording failed. Please try again.')
      }

      recorder.start(100)
      startSilenceDetection(stream, recorder)

    } catch (e: any) {
      setIsListening(false)
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        setError('Microphone access blocked. Please allow mic in browser settings.')
      } else {
        setError('Could not access microphone.')
      }
    }
  }, [processAudio, startSilenceDetection, teardown])

  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null }
    if (maxTimerRef.current)     { clearTimeout(maxTimerRef.current);     maxTimerRef.current = null }
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    } else {
      teardown()
      setIsListening(false)
      setInterimTranscript('')
    }
  }, [teardown])

  const cancelSpeech = useCallback(() => {
    synthRef.current?.cancel()
    audioRef.current?.pause()
    setIsSpeaking(false)
  }, [])

  const speakFallback = useCallback((text: string): Promise<void> =>
    new Promise((resolve) => {
      if (!synthRef.current) { resolve(); return }
      synthRef.current.cancel()
      const utt    = new SpeechSynthesisUtterance(text)
      utt.lang     = 'en-GB'
      utt.pitch    = 0.78
      utt.rate     = 0.82
      utt.volume   = 1
      const voices = synthRef.current.getVoices()
      const voice  = voices.find(v => v.name === 'Google UK English Male') ||
                     voices.find(v => v.name.startsWith('Google') && v.lang.startsWith('en')) ||
                     voices.find(v => v.lang.startsWith('en'))
      if (voice) utt.voice = voice
      utt.onstart = () => setIsSpeaking(true)
      utt.onend   = () => { setIsSpeaking(false); resolve() }
      utt.onerror = () => { setIsSpeaking(false); resolve() }
      synthRef.current.speak(utt)
    }), [])

  const speak = useCallback(async (text: string, _lang = 'en-IN'): Promise<void> => {
    try {
      setIsSpeaking(true)
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (response.ok) {
        const audioUrl = URL.createObjectURL(await response.blob())
        return new Promise((resolve) => {
          audioRef.current?.pause()
          const audio = new Audio(audioUrl)
          audioRef.current = audio
          audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(audioUrl); resolve() }
          audio.onerror = () => { setIsSpeaking(false); URL.revokeObjectURL(audioUrl); resolve(speakFallback(text)) }
          audio.play().catch(() => { setIsSpeaking(false); resolve(speakFallback(text)) })
        })
      }
    } catch (e) {
      console.error('[TTS] Error:', e)
    }
    return speakFallback(text)
  }, [speakFallback])

  return { isListening, isSpeaking, transcript, interimTranscript, error, startListening, stopListening, speak, cancelSpeech }
}
