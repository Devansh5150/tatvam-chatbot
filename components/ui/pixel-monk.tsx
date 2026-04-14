'use client'

import React from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

interface PixelMonkProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  isFloating?: boolean
  onClick?: () => void
}

export function PixelMonk({ className, size = 'md', isFloating = true, onClick }: PixelMonkProps) {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-24 h-24',
    xl: 'w-40 h-40',
  }

  // Path to the generated walking monk image
  const monkImagePath = '/pixel_monk_walking.png'

  return (
    <motion.div
      onClick={onClick}
      className={cn(
        "relative flex items-center justify-center overflow-hidden cursor-pointer group",
        sizeClasses[size],
        className
      )}
    >
      <img
        src={monkImagePath}
        alt="Walking Monk"
        className="w-full h-full object-contain image-rendering-pixelated mix-blend-multiply drop-shadow-sm scale-125 translate-y-1"
        style={{ imageRendering: 'pixelated' }}
      />
      {/* Optional Glow for interactivity */}
      <div className="absolute inset-0 bg-amber-400/5 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  )
}
