'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface VoiceInteractionResult {
  isListening: boolean
  isSpeaking: boolean
  transcript: string
  error: string | null
  startListening: (lang?: string) => void
  stopListening: () => void
  speak: (text: string, lang?: string) => Promise<void>
  cancelSpeech: () => void
}

export function useVoiceInteraction(): VoiceInteractionResult {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  
  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const autoRestartRef = useRef(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = false
        recognition.interimResults = false
        recognition.lang = 'en-IN'

        recognition.onstart = () => {
          console.log('STT: Started listening')
          setIsListening(true)
          setError(null)
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
            console.log('STT: Final Result:', finalTranscript)
            setTranscript(finalTranscript)
            setIsListening(false)
          } else if (interimTranscript) {
             // We can expose this if needed for visual feedback
             console.log('STT: Interim:', interimTranscript)
          }
        }

        recognition.onerror = (event: any) => {
          console.error('STT Error:', event.error, event.message)
          setError(event.error)
          setIsListening(false)
          autoRestartRef.current = false

          // Handle specific common browser errors
          if (event.error === 'not-allowed') {
            setError('Microphone permission denied. Please allow access.')
          }
        }

        recognition.onend = () => {
          console.log('STT: Recognition ended')
          setIsListening(false)
        }

        recognitionRef.current = recognition
      } else {
        console.warn('STT: Browser does not support SpeechRecognition')
        setError('Speech recognition not supported in this browser.')
      }
      
      synthRef.current = window.speechSynthesis
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.abort()
      if (synthRef.current) synthRef.current.cancel()
    }
  }, [])

  const startListening = useCallback((lang: string = 'en-IN') => {
    if (!recognitionRef.current) {
        console.warn('STT: Cannot start, recognition not initialized')
        return
    }
    
    try {
      recognitionRef.current.abort()
      recognitionRef.current.lang = lang
      
      // Delay start slightly to ensure abort is processed
      setTimeout(() => {
        try {
          recognitionRef.current.start()
          console.log('STT: Attempting to start in', lang)
        } catch (e: any) {
          if (e.name === 'InvalidStateError') {
             // Already started, ignore
             console.log('STT: Already listening')
          } else {
            console.error('STT Start Error:', e)
          }
        }
      }, 100)
    } catch (e) {
      console.error('STT Abort/Start Error:', e)
    }
  }, [])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }, [])

  const cancelSpeech = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel()
      setIsSpeaking(false)
    }
  }, [])

  const speak = useCallback((text: string, lang: string = 'en-IN'): Promise<void> => {
    return new Promise((resolve) => {
      if (!synthRef.current) {
        resolve()
        return
      }

      // Cancel any ongoing speech
      synthRef.current.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = lang
      
      // Select a Deep Meditative Male Voice
      // We look for names like "Ravi", "David", "Google Hindi", etc.
      const voices = synthRef.current.getVoices()
      
      // Filtering strategy: 
      // 1. Try to find a match for the requested language + "Male" or specific known good names
      const preferredVoice = voices.find(v => 
        (v.lang.includes(lang) || v.lang.includes(lang.split('-')[0])) && 
        (v.name.toLowerCase().includes('male') || 
         v.name.toLowerCase().includes('ravi') || 
         v.name.toLowerCase().includes('david') ||
         v.name.toLowerCase().includes('google hindi'))
      ) || voices.find(v => v.lang.includes(lang)) || voices[0]

      if (preferredVoice) {
        utterance.voice = preferredVoice
      }

      // Pitch and Rate for "Deep/Meditative"
      utterance.pitch = 0.85 // Lower pitch
      utterance.rate = 0.9   // Slightly slower tempo for calm

      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => {
        setIsSpeaking(false)
        resolve()
      }
      utterance.onerror = (e) => {
        console.error('Speech Synthesis Error:', e)
        setIsSpeaking(false)
        resolve()
      }

      synthRef.current.speak(utterance)
    })
  }, [])

  return {
    isListening,
    isSpeaking,
    transcript,
    error,
    startListening,
    stopListening,
    speak,
    cancelSpeech
  }
}
