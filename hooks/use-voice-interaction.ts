'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

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
  const [isListening, setIsListening]           = useState(false)
  const [isSpeaking, setIsSpeaking]             = useState(false)
  const [transcript, setTranscript]             = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError]                       = useState<string | null>(null)

  const recognitionRef  = useRef<any>(null)
  const synthRef        = useRef<SpeechSynthesis | null>(null)
  const audioRef        = useRef<HTMLAudioElement | null>(null)
  const isActiveRef     = useRef(false)   // true = we WANT recognition running
  const retryTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Safe start (catches InvalidStateError if already running) ──────────
  const safeStart = useCallback(() => {
    if (!recognitionRef.current || !isActiveRef.current) return
    try {
      recognitionRef.current.start()
    } catch (e: any) {
      if (e.name === 'InvalidStateError') return // already running — fine
      console.error('STT start error:', e)
      // Retry after a short delay for transient errors
      retryTimerRef.current = setTimeout(safeStart, 400)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous     = true   // session stays open — no per-utterance restart dance
    recognition.interimResults = true
    recognition.lang           = 'en-IN'

    recognition.onstart = () => {
      setIsListening(true)
      setError(null)
    }

    recognition.onresult = (event: any) => {
      let interim = ''
      let final   = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) final   += event.results[i][0].transcript
        else                          interim += event.results[i][0].transcript
      }
      if (final)   { setTranscript(final); setInterimTranscript('') }
      else if (interim) setInterimTranscript(interim)
    }

    recognition.onerror = (event: any) => {
      const { error: err } = event
      if (err === 'no-speech' || err === 'aborted') return  // normal, onend will restart

      if (err === 'not-allowed') {
        setError('Microphone permission denied. Please allow access.')
        isActiveRef.current = false
        setIsListening(false)
        return
      }

      console.warn('STT error:', err)
      // For network / audio-capture errors, let onend handle the retry
    }

    recognition.onend = () => {
      setIsListening(false)
      if (isActiveRef.current) {
        // Unexpected end (no-speech timeout, browser restart, etc.) — retry
        retryTimerRef.current = setTimeout(safeStart, 250)
      }
    }

    recognitionRef.current = recognition
    synthRef.current       = window.speechSynthesis

    return () => {
      isActiveRef.current = false
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
      recognition.abort()
      synthRef.current?.cancel()
      audioRef.current?.pause()
    }
  }, [safeStart])

  // ── Public controls ──────────────────────────────────────────────────────

  const startListening = useCallback((lang: string = 'en-IN') => {
    if (!recognitionRef.current) return
    if (retryTimerRef.current) { clearTimeout(retryTimerRef.current); retryTimerRef.current = null }
    isActiveRef.current = true
    recognitionRef.current.lang = lang
    safeStart()
  }, [safeStart])

  const stopListening = useCallback(() => {
    isActiveRef.current = false
    if (retryTimerRef.current) { clearTimeout(retryTimerRef.current); retryTimerRef.current = null }
    setIsListening(false)
    setInterimTranscript('')
    recognitionRef.current?.abort()
  }, [])

  const cancelSpeech = useCallback(() => {
    synthRef.current?.cancel()
    audioRef.current?.pause()
    setIsSpeaking(false)
  }, [])

  const speak = useCallback(async (text: string, lang: string = 'en-IN'): Promise<void> => {
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
      console.error('TTS fetch error:', e)
    }

    return speakFallback(text)
  }, [])

  const speakFallback = (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!synthRef.current) { resolve(); return }
      synthRef.current.cancel()
      const utt    = new SpeechSynthesisUtterance(text)
      utt.lang     = 'en-GB'
      utt.pitch    = 0.78
      utt.rate     = 0.82
      utt.volume   = 1
      const voices = synthRef.current.getVoices()
      const voice  =
        voices.find(v => v.name === 'Google UK English Male') ||
        voices.find(v => v.name.startsWith('Google') && v.lang.startsWith('en')) ||
        voices.find(v => v.lang.startsWith('en'))
      if (voice) utt.voice = voice
      utt.onstart = () => setIsSpeaking(true)
      utt.onend   = () => { setIsSpeaking(false); resolve() }
      utt.onerror = () => { setIsSpeaking(false); resolve() }
      synthRef.current.speak(utt)
    })
  }

  return { isListening, isSpeaking, transcript, interimTranscript, error, startListening, stopListening, speak, cancelSpeech }
}
