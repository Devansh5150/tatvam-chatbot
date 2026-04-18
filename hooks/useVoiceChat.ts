'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export type VoiceChatState = 'idle' | 'listening' | 'thinking' | 'speaking'

interface VoiceChatResult {
  state: VoiceChatState
  transcript: string
  englishAudioUrl: string | null
  hindiAudioUrl: string | null
  error: string | null
  startListening: () => void
  stopListening: () => void
  playEnglish: () => void
  playHindi: () => void
}

export function useVoiceChat(): VoiceChatResult {
  const [state, setState] = useState<VoiceChatState>('idle')
  const [transcript, setTranscript] = useState('')
  const [englishAudioUrl, setEnglishAudioUrl] = useState<string | null>(null)
  const [hindiAudioUrl, setHindiAudioUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const recognitionRef = useRef<any>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const prevEnglishUrl = useRef<string | null>(null)
  const prevHindiUrl = useRef<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = false
        recognition.interimResults = true
        recognition.lang = 'en-IN'

        recognition.onstart = () => {
          setState('listening')
          setError(null)
          setTranscript('')
          // Revoke old audio URLs
          if (prevEnglishUrl.current) URL.revokeObjectURL(prevEnglishUrl.current)
          if (prevHindiUrl.current) URL.revokeObjectURL(prevHindiUrl.current)
          setEnglishAudioUrl(null)
          setHindiAudioUrl(null)
        }

        recognition.onresult = (event: any) => {
          let interimTranscript = ''
          let finalTranscript = ''

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript
            } else {
              interimTranscript += event.results[i][0].transcript
            }
          }

          if (finalTranscript) {
            setTranscript((prev) => {
              const newTranscript = prev + finalTranscript
              handleProcessVoiceInput(newTranscript)
              return newTranscript
            })
          } else if (interimTranscript) {
            setTranscript(interimTranscript)
          }
        }

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error', event.error)
          setError(event.error)
          setState('idle')
        }

        recognition.onend = () => {
          setState((currentState) => {
            if (currentState === 'listening') return 'idle'
            return currentState
          })
        }

        recognitionRef.current = recognition
      } else {
        setError('Speech recognition not supported in this browser.')
      }
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.abort()
      if (audioRef.current) audioRef.current.pause()
    }
  }, [])

  const fetchAudio = async (text: string): Promise<string | null> => {
    if (!text) return null
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) return null
      const blob = await res.blob()
      return URL.createObjectURL(blob)
    } catch {
      return null
    }
  }

  const handleProcessVoiceInput = async (finalText: string) => {
    try {
      setState('thinking')

      const chatRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: finalText, userName: 'Seeker' }),
      })

      if (!chatRes.ok) throw new Error('Failed to get AI response')

      const chatData = await chatRes.json()
      const englishText: string = chatData.reply_english || chatData.reply || ''
      const hindiText: string = chatData.reply_hindi || ''

      // Generate both audio tracks in parallel
      setState('speaking')
      const [engUrl, hinUrl] = await Promise.all([
        fetchAudio(englishText),
        fetchAudio(hindiText),
      ])

      prevEnglishUrl.current = engUrl
      prevHindiUrl.current = hinUrl
      setEnglishAudioUrl(engUrl)
      setHindiAudioUrl(hinUrl)

      // Auto-play English by default
      if (engUrl) {
        await playAudio(engUrl)
      }

      setState('idle')
    } catch (err: any) {
      console.error(err)
      setError(err.message)
      setState('idle')
    }
  }

  const playAudio = (url: string): Promise<void> => {
    return new Promise((resolve) => {
      if (audioRef.current) audioRef.current.pause()
      audioRef.current = new Audio(url)
      audioRef.current.onended = () => resolve()
      audioRef.current.onerror = () => resolve()
      audioRef.current.play().catch(() => resolve())
    })
  }

  const playEnglish = useCallback(() => {
    if (englishAudioUrl) playAudio(englishAudioUrl)
  }, [englishAudioUrl])

  const playHindi = useCallback(() => {
    if (hindiAudioUrl) playAudio(hindiAudioUrl)
  }, [hindiAudioUrl])

  const startListening = useCallback(() => {
    if (audioRef.current) audioRef.current.pause()
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start()
      } catch (e) {
        console.warn('Recognition already started', e)
      }
    }
  }, [])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) recognitionRef.current.stop()
  }, [])

  return {
    state,
    transcript,
    englishAudioUrl,
    hindiAudioUrl,
    error,
    startListening,
    stopListening,
    playEnglish,
    playHindi,
  }
}
