'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import MythicalPortal from '@/components/MythicalPortal'
import { VoiceVisualizer } from './voice-visualizer'
import { ShootingStars } from '@/components/ui/shooting-stars'
import { StarsBackground } from '@/components/ui/stars-background'
import { useVoiceInteraction } from '@/hooks/use-voice-interaction'



interface VoicePortalProps {
  isOpen: boolean
  onClose: () => void
  userName: string
  volume: number
  activeBhajanSrc?: string | null
}

export function VoicePortal({ isOpen, onClose, userName, volume, activeBhajanSrc }: VoicePortalProps) {
  const [status, setStatus] = useState<'connecting' | 'listening' | 'thinking' | 'speaking' | 'idle'>('connecting')
  const [lang, setLang] = useState('en-IN')
  const ambientAudioRef = React.useRef<HTMLAudioElement | null>(null)
  
  const { 
    isListening, 
    isSpeaking, 
    transcript, 
    error: voiceError,
    startListening, 
    stopListening, 
    speak, 
    cancelSpeech 
  } = useVoiceInteraction()

  // Handle Initial Connection
  useEffect(() => {
    if (isOpen) {
      if (!ambientAudioRef.current) {
        ambientAudioRef.current = new Audio('https://archive.org/download/OmChant/Om%20Chant.mp3')
        ambientAudioRef.current.loop = true
      }
      
      ambientAudioRef.current.volume = volume * 0.4
      
      if (!activeBhajanSrc) {
        ambientAudioRef.current.play().catch(e => console.error("Portal audio error:", e))
      }

      const timer = setTimeout(() => {
        setStatus('listening')
        startListening(lang)
      }, 2000)
      
      return () => {
        clearTimeout(timer)
        ambientAudioRef.current?.pause()
        cancelSpeech()
        stopListening()
      }
    }
  }, [isOpen, activeBhajanSrc, volume, startListening, stopListening, cancelSpeech])

  // Process Transcription -> Chat API -> TTS
  useEffect(() => {
    if (transcript && !isListening && !isSpeaking) {
      handleConversation(transcript)
    }
  }, [transcript, isListening, isSpeaking])

  const handleConversation = async (text: string) => {
    setStatus('thinking')
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: text, 
          history: [], // For now, simple loop. Could be improved with stateful history.
          userName 
        }),
      })

      const data = await response.json()
      if (data.reply) {
        setStatus('speaking')
        const ttsText = data.reply.replace(/\[.*?\]/g, '').trim()
        await speak(ttsText, lang)
        
        setStatus('listening')
        startListening(lang)
      }
    } catch (e) {
      console.error('Conversation Error:', e)
      setStatus('idle')
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black z-0 transition-all duration-700"
          >
            <StarsBackground />
            <ShootingStars />
          </motion.div>

          <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
            {/* Avatar - Immersive in center */}
            <div className="relative w-full max-w-2xl aspect-square flex items-center justify-center pointer-events-none">
              <div className="absolute inset-0 z-0 opacity-40">
                <VoiceVisualizer isSpeaking={isSpeaking} isListening={isListening} />
              </div>
              

            </div>

            {/* Bottom Task Bar */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="absolute bottom-12 left-1/2 -translate-x-1/2 px-6 py-4 bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-white/10 flex items-center gap-6 shadow-2xl z-50"
            >
              <button
                onClick={() => {
                  if (isListening || status === 'listening') {
                    stopListening()
                    setStatus('idle')
                  } else {
                    startListening()
                    setStatus('listening')
                  }
                }}
                className={`flex items-center gap-3 px-5 py-2.5 rounded-xl transition-all font-sans text-sm font-medium ${
                  isListening ? 'bg-accent/20 text-accent border border-accent/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-accent animate-pulse' : 'bg-red-500'}`} />
                {isListening ? 'Listening...' : 'Tap to Speak'}
              </button>

              <div className="w-px h-6 bg-white/10" />

              <div className="flex flex-col min-w-[100px]">
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Status</span>
                <span className={`text-sm font-medium capitalize ${voiceError ? 'text-red-400' : 'text-white/80'}`}>
                  {voiceError ? 'Error' : status}
                </span>
                {voiceError && (
                  <span className="text-[9px] text-red-500/60 leading-tight">
                    {voiceError === 'not-allowed' ? 'Mic access blocked' : voiceError}
                  </span>
                )}
              </div>

              <div className="w-px h-6 bg-white/10" />

              <button
                onClick={() => setLang(l => l === 'en-IN' ? 'hi-IN' : 'en-IN')}
                className="px-4 py-2 hover:bg-white/5 text-xs text-white/60 hover:text-white transition-all rounded-lg flex flex-col items-center"
              >
                <span className="text-[8px] uppercase tracking-widest opacity-50 mb-1">Language</span>
                <span className="font-bold">{lang === 'en-IN' ? 'ENG' : 'HIN/SAN'}</span>
              </button>

              <div className="w-px h-6 bg-white/10" />

              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all rounded-xl font-sans text-sm font-medium border border-white/5"
              >
                Exit Portal
              </button>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}
