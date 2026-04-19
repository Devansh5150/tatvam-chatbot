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
  const lastStartTimeRef = useRef<number>(0)
  const fastFailCountRef = useRef<number>(0)

  const retryCountRef   = useRef(0)
  const isSpeakingRef   = useRef(false)
  
  // Keep the ref in sync with state for use in callbacks
  useEffect(() => { 
    isSpeakingRef.current = isSpeaking 
  }, [isSpeaking])

  // ── Safe start (catches InvalidStateError if already running) ──────────
  const safeStart = useCallback(() => {
    if (!recognitionRef.current || !isActiveRef.current || isSpeakingRef.current) return
    
    if (retryCountRef.current >= 3) {
      console.error('[Voice] Auto-stopped: High failure rate (3 strikes). Please refresh.')
      setError('Connection with microphone unstable. Please refresh page.')
      isActiveRef.current = false
      setIsListening(false)
      return
    }

    try {
      console.log(`[Voice] Attempting STT start. (Try ${retryCountRef.current + 1}/3)`)
      recognitionRef.current.start()
      lastStartTimeRef.current = Date.now()
    } catch (e) {
      if ((e as DOMException).name === 'InvalidStateError') return // already running — fine
      console.warn('STT start error:', (e as Error).message)
      retryCountRef.current++
      
      // Exponential backoff or just a longer delay for retries
      if (isActiveRef.current && !isSpeakingRef.current) {
        retryTimerRef.current = setTimeout(safeStart, 1000)
      }
    }
  }, []) // Removed deps to keep it stable

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
      console.log('[Voice] STT started successfully.')
      setIsListening(true)
      setError(null)
      retryCountRef.current = 0 // Reset on success
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
      console.warn('[Voice] STT error:', err)
      
      if (err === 'no-speech' || err === 'aborted') return  // normal, onend will handle if isActive

      retryCountRef.current++ // Count as a strike

      if (err === 'not-allowed' || err === 'service-not-allowed') {
        const msg = err === 'not-allowed' ? 'Microphone permission denied.' : 'Speech service blocked.'
        setError(msg)
        isActiveRef.current = false
        setIsListening(false)
        return
      }
    }

    recognition.onend = () => {
      const sessionDuration = Date.now() - lastStartTimeRef.current
      console.log(`[Voice] STT session ended. Duration: ${sessionDuration}ms`)
      setIsListening(false)

      if (isActiveRef.current) {
        // VELOCITY CHECK: Only treat as a "failure" if it was NOT a voluntary silence timeout
        // and it ended suspiciousy fast (< 800ms)
        const isMutedError = error === 'no-speech' || error === 'aborted'
        
        if (sessionDuration < 800 && !isMutedError) {
          fastFailCountRef.current++
          console.warn(`[Voice] Fast-fail (Likely Crash) detected (${fastFailCountRef.current}/3)`)
        } else {
          // If it was just silence or a long session, reset the failure count
          fastFailCountRef.current = 0 
        }

        if (fastFailCountRef.current >= 3) {
          console.error('[Voice] Stability safeguard triggered.')
          isActiveRef.current = false
          setError('Microphone stability lost. Reconnecting in 5s...')
          
          // Auto-recovery instead of permanent lock
          setTimeout(() => {
            setError(null)
            fastFailCountRef.current = 0
            if (isActiveRef.current) safeStart()
          }, 5000)
          return
        }

        if (!isSpeakingRef.current) {
          retryTimerRef.current = setTimeout(safeStart, 1000)
        }
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
  }, [safeStart]) // Stable deps

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
    fastFailCountRef.current = 0
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
