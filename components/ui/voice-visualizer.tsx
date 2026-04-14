'use client'

import { motion } from 'motion/react'

export function VoiceVisualizer() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Concentric Pulsing Rings */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ scale: 1, opacity: 0.3 }}
          animate={{
            scale: [1, 1.5 + i * 0.2, 1],
            opacity: [0.3, 0.1, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeInOut",
          }}
          className="absolute w-64 h-64 border border-accent/20 rounded-full blur-[1px]"
        />
      ))}

      {/* Frequency Wave Simulation */}
      <div className="flex items-center gap-1.5 h-12">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              height: [10, Math.random() * 40 + 20, 10],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.1,
              ease: "easeInOut",
            }}
            className="w-1 bg-accent/60 rounded-full"
          />
        ))}
      </div>
    </div>
  )
}
