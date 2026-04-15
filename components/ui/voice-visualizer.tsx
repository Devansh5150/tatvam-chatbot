'use client'

import { motion } from 'motion/react'

interface VoiceVisualizerProps {
  isSpeaking?: boolean
  isListening?: boolean
}

export function VoiceVisualizer({ isSpeaking, isListening }: VoiceVisualizerProps) {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Concentric Pulsing Rings - Simplified for Mystical Look */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ scale: 1, opacity: 0.3 }}
          animate={{
            scale: isSpeaking ? [1, 2 + i * 0.3, 1] : [1, 1.5 + i * 0.2, 1],
            opacity: isSpeaking ? [0.4, 0.1, 0.4] : [0.3, 0.1, 0.3],
          }}
          transition={{
            duration: isSpeaking ? 1.5 : 3,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeInOut",
          }}
          className={`absolute w-64 h-64 border rounded-full blur-[1px] ${
            isSpeaking ? 'border-accent/40 shadow-[0_0_30px_rgba(251,191,36,0.3)]' : 'border-accent/20'
          }`}
        />
      ))}
    </div>
  )
}
