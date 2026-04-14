'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import MythicalPortal from '@/components/MythicalPortal'
import { VoiceVisualizer } from './voice-visualizer'
import { ShootingStars } from '@/components/ui/shooting-stars'
import { StarsBackground } from '@/components/ui/stars-background'
import dynamic from 'next/dynamic'

const ThreeAvatar = dynamic(
  () => import('./three-avatar').then(m => ({ default: m.ThreeAvatar })),
  { ssr: false }
)

interface VoicePortalProps {
  isOpen: boolean
  onClose: () => void
  userName: string
}

export function VoicePortal({ isOpen, onClose, userName }: VoicePortalProps) {
  const [isListening, setIsListening] = useState(false)
  const [status, setStatus] = useState<'connecting' | 'listening' | 'speaking'>('connecting')

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setStatus('listening')
        setIsListening(true)
      }, 2000)
      return () => clearTimeout(timer)
    } else {
      setStatus('connecting')
      setIsListening(false)
    }
  }, [isOpen])

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
                <VoiceVisualizer />
              </div>
              
              <div className="relative z-10 w-[70%] h-[70%] transform scale-150">
                <ThreeAvatar className="w-full h-full" isHovered={false} isEthereal={true} />
              </div>
            </div>

            {/* Bottom Task Bar */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="absolute bottom-12 left-1/2 -translate-x-1/2 px-6 py-4 bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-white/10 flex items-center gap-6 shadow-2xl z-50"
            >
              <button
                onClick={() => setIsListening(!isListening)}
                className={`flex items-center gap-3 px-5 py-2.5 rounded-xl transition-all font-sans text-sm font-medium ${
                  isListening ? 'bg-accent/20 text-accent border border-accent/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-accent animate-pulse' : 'bg-red-500'}`} />
                {isListening ? 'Mute' : 'Unmute'}
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
