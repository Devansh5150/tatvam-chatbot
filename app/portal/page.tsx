'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { ShootingStars } from '@/components/ui/shooting-stars'
import { StarsBackground } from '@/components/ui/stars-background'
import { VoiceVisualizer } from '@/components/ui/voice-visualizer'
import { useVoiceInteraction } from '@/hooks/use-voice-interaction'




export default function PortalPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'connecting' | 'listening' | 'thinking' | 'speaking' | 'idle'>('connecting')
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [userName, setUserName] = useState('Seeker')
  const [isFocusing, setIsFocusing] = useState(false)
  const [timer, setTimer] = useState(0)
  const [volume, setVolume] = useState(0.5)
  const [activeTrack, setActiveTrack] = useState<string | null>(null)
  const audioRef = React.useRef<HTMLAudioElement | null>(null)

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

  // Sync state from Dashboard via localStorage
  useEffect(() => {
    const savedVolume = localStorage.getItem('tatvam_volume')
    const savedTrack = localStorage.getItem('tatvam_active_bhajan_src')
    const savedUser = localStorage.getItem('tatvam_user')
    
    if (savedVolume) setVolume(parseFloat(savedVolume))
    if (savedTrack) setActiveTrack(savedTrack)
    if (savedUser) {
        try {
            const user = JSON.parse(savedUser)
            setUserName(user.name || 'Seeker')
        } catch (e) {
            console.error('User parse error:', e)
        }
    }
  }, [])

  // Auto-start voice loop on mount
  useEffect(() => {
    const timer = setTimeout(() => {
        setStatus('listening')
        startListening()
    }, 2000)
    return () => {
        clearTimeout(timer)
        cancelSpeech()
        stopListening()
    }
  }, [startListening, stopListening, cancelSpeech])

  // Process Transcription -> Chat API -> TTS
  useEffect(() => {
    if (transcript && !isListening && !isSpeaking) {
      handleConversation(transcript)
    }
  }, [transcript, isListening, isSpeaking])

  const handleConversation = async (text: string) => {
    setStatus('thinking')
    const token = localStorage.getItem('tatvam_token')
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ 
          message: text, 
          history: [], // For simplicity, we can let the backend handle history or pass it here
          userName: userName,
          conversationId: conversationId
        }),
      })

      const data = await response.json()
      
      if (data.conversationId) {
          setConversationId(data.conversationId)
      }

      if (data.reply) {
        setStatus('speaking')
        const ttsText = data.reply.replace(/\[.*?\]/g, '').trim()
        await speak(ttsText)
        
        setStatus('listening')
        startListening()
      }
    } catch (e) {
      console.error('Conversation Error:', e)
      setStatus('idle')
    }
  }


  // Audio Logic
  useEffect(() => {
    if (!audioRef.current) {
        audioRef.current = new Audio()
        audioRef.current.loop = true
    }
    
    // Play active track or fallback to Om Chant
    const trackToPlay = activeTrack || 'https://archive.org/download/OmChant/Om%20Chant.mp3'
    audioRef.current.src = trackToPlay
    audioRef.current.volume = volume

    // Play on interaction or focus
    if (isFocusing) {
        audioRef.current?.play().catch(() => {})
    }

    return () => {
        audioRef.current?.pause()
    }
  }, [activeTrack, volume, isFocusing])

  // Focus Timer Logic
  useEffect(() => {
    let interval: any
    if (isFocusing) {
      interval = setInterval(() => {
        setTimer((t) => t + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isFocusing])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black text-white font-sans">
      {/* Immersive Starfield */}
      <div className="absolute inset-0 z-0">
        <StarsBackground />
        <ShootingStars />
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-between py-12">
        

        {/* Center: Celestial Energy Orb (Natural Power) */}
        <div className="flex-1 flex items-center justify-center relative">
          
          {/* Organic Wobble Container - Makes the entire orb feel like it's levitating naturally */}
          <motion.div
             animate={{ 
               y: [0, -8, 2, -4, 0],
               x: [0, 2, -2, 1, 0],
             }}
             transition={{ 
               duration: 8, 
               repeat: Infinity, 
               ease: "easeInOut" 
             }}
             className="relative flex items-center justify-center"
          >
            {/* Voice Visualizer - Reactions to speech and listening */}
            <div className="absolute inset-0 z-0 opacity-30 scale-[2]">
                <VoiceVisualizer isSpeaking={isSpeaking} isListening={isListening} />
            </div>

            {/* Radiant Shroud - The wide-reaching energy field */}
            <motion.div
              animate={{ 
                scale: [1, 1.15, 1],
                opacity: [0.15, 0.25, 0.15],
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute w-[300px] h-[300px] bg-amber-500 rounded-full blur-[80px]"
            />

            {/* Secondary Glow - The warm presence with shifting hue */}
            <motion.div
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.4, 0.6, 0.4],
                filter: ["hue-rotate(0deg) blur(24px)", "hue-rotate(15deg) blur(32px)", "hue-rotate(0deg) blur(24px)"]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute w-28 h-28 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full blur-2xl opacity-50"
            />

            {/* Rotating Radiant Rays (Natural Power Flares) */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="absolute w-[400px] h-[400px] flex items-center justify-center opacity-25 pointer-events-none"
            >
              <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-amber-200 to-transparent blur-[1px]" />
              <div className="absolute h-full w-[1px] bg-gradient-to-b from-transparent via-amber-200 to-transparent blur-[1px]" />
              <div className="absolute w-[70%] h-[1px] bg-gradient-to-r from-transparent via-yellow-100 to-transparent rotate-45 blur-[2px]" />
              <div className="absolute w-[70%] h-[1px] bg-gradient-to-r from-transparent via-yellow-100 to-transparent -rotate-45 blur-[2px]" />
            </motion.div>

            {/* Intense Core - The power source with churning swirl */}
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                boxShadow: [
                  "0 0 20px 2px rgba(251,191,36,0.6)",
                  "0 0 40px 10px rgba(251,191,36,0.8)",
                  "0 0 20px 2px rgba(251,191,36,0.6)"
                ]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="w-5 h-5 bg-white rounded-full relative z-20 overflow-hidden"
            >
              {/* Internal Swirling Core Logic */}
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-[-100%] bg-[conic-gradient(from_0deg,transparent_0%,#fbbf24_50%,transparent_100%)] opacity-60 blur-[1px]"
              />
              
              {/* Core Lens Flare */}
              <div className="absolute inset-x-[-150%] inset-y-[45%] bg-white blur-[4px] opacity-60 rounded-full scale-y-[0.1]" />
              <div className="absolute inset-y-[-150%] inset-x-[45%] bg-white blur-[4px] opacity-60 rounded-full scale-x-[0.1]" />
            </motion.div>

            {/* Energy Drifting Particles (Ethereal Embers) */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0, y: 0, x: 0 }}
                animate={{ 
                  opacity: [0, 0.4, 0],
                  scale: [0, 1.5, 0],
                  y: -100 - (Math.random() * 100),
                  x: (Math.random() - 0.5) * 80,
                }}
                transition={{ 
                  duration: 4 + Math.random() * 3,
                  repeat: Infinity,
                  delay: i * 0.8,
                  ease: "easeOut"
                }}
                className="absolute w-1 h-1 bg-amber-200 rounded-full blur-[1px] z-10"
              />
            ))}


          </motion.div>

        </div>

        {/* Bottom: Task Bar */}
        <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="px-6 py-4 bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-white/10 flex items-center gap-6 shadow-2xl z-50"
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
                <div className="flex flex-col items-start leading-none">
                  <span className="text-xs">{isListening ? `Listening...` : 'Tap to Speak'}</span>
                  {voiceError && (
                    <span className="text-[10px] text-red-500/80 mt-0.5">
                      {voiceError === 'not-allowed' ? 'Mic Access Blocked' : 'Check Mic'}
                    </span>
                  )}
                </div>
              </button>

              <div className="w-px h-6 bg-white/10" />

              <button
                onClick={() => {
                    setIsFocusing(!isFocusing)
                    audioRef.current?.play() // Trigger on interaction
                }}
                className={`px-5 py-2.5 rounded-xl transition-all font-sans text-sm font-medium border ${
                  isFocusing ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-white/5 text-white/70 border-white/5 hover:bg-white/10'
                }`}
              >
                {isFocusing ? 'In Focus Flow' : 'Start Focus Flow'}
              </button>

              <div className="w-px h-6 bg-white/10" />

              <button
                onClick={() => router.push('/dashboard')}
                className="px-5 py-2.5 hover:bg-white/5 text-white/40 hover:text-white transition-all rounded-xl font-sans text-sm font-medium border border-transparent hover:border-white/10"
              >
                Exit Portal
              </button>
        </motion.div>
      </div>
    </div>
  )
}
