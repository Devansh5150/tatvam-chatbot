'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import HeroSection from '@/components/HeroSection'
import WhatTatvamIs from '@/components/WhatTatvamIs'
import HowItWorks from '@/components/HowItWorks'
import WhatTatvamIsNot from '@/components/WhatTatvamIsNot'
import WhoItIsFor from '@/components/WhoItIsFor'
import TatvamValues from '@/components/TatvamValues'
import TatvamSources from '@/components/TatvamSources'
import TatvamPricing from '@/components/TatvamPricing'
import Footer from '@/components/Footer'
import MythicalVideoBackground from '@/components/MythicalVideoBackground'
import KurukshetraScroll from '@/components/KurukshetraScroll'

export default function Home() {
  const [hasEntered, setHasEntered] = useState(false);

  return (
    <>
      <AnimatePresence>
        {!hasEntered && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 1.8, ease: "easeInOut" } }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#050403] overflow-hidden"
          >
             {/* Deep Cosmic luxury background glow */}
             <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
                <div className="absolute w-[70vw] h-[70vw] max-w-[800px] max-h-[800px] bg-[#D4AF37]/5 blur-[120px] md:blur-[150px] rounded-full animate-[pulse_6s_ease-in-out_infinite]" />
             </div>
             
             <button 
                onClick={() => setHasEntered(true)}
                className="relative z-10 group flex flex-col items-center justify-center cursor-pointer outline-none w-64 h-64 md:w-80 md:h-80"
             >
                {/* Luxury Concentric Rings */}
                <div className="absolute inset-0 rounded-full border-[1px] border-[#D4AF37]/20 group-hover:border-[#D4AF37]/60 group-hover:scale-110 transition-all duration-1000 ease-out" />
                <div className="absolute inset-3 md:inset-4 rounded-full border-[1px] border-[#D4AF37]/10 group-hover:border-[#D4AF37]/40 group-hover:scale-[1.15] rotate-45 transition-all duration-1000 ease-out delay-75" />
                <div className="absolute inset-6 md:inset-8 rounded-full border-[1px] border-[#D4AF37]/5 group-hover:border-[#D4AF37]/30 group-hover:scale-[1.2] rotate-90 transition-all duration-1000 ease-out delay-150" />

                {/* Inner Glow Core on Hover */}
                <div className="absolute inset-0 rounded-full bg-[#D4AF37]/0 group-hover:bg-[#D4AF37]/10 blur-2xl transition-all duration-1000" />

                {/* The "Om" Symbol */}
                <div className="relative text-[120px] md:text-[140px] font-serif transition-all duration-1000 group-hover:scale-[1.04] group-hover:-translate-y-2 translate-x-[8px] -translate-y-[12px]
                                bg-gradient-to-br from-[#FFF8D6] via-[#D4AF37] via-50% to-[#593d0c] bg-clip-text text-transparent p-8"
                     style={{
                       filter: `drop-shadow(-8px 12px 12px rgba(0,0,0,0.8)) drop-shadow(0px 0px 30px rgba(212,175,55,0.3))`,
                       WebkitTextStroke: '2px rgba(255, 235, 160, 0.4)', // Creates a subtle bevel / rim light effect
                       lineHeight: '1',
                     }}>
                  ॐ
                </div>

                {/* Subtitle */}
                <div className="absolute -bottom-12 md:-bottom-16 text-[10px] md:text-xs tracking-[0.5em] md:tracking-[0.6em] uppercase text-[#D4AF37]/60 group-hover:text-[#FFF5D6] transition-all duration-1000 font-light opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 text-center w-full">
                  Enter Experience
                </div>
             </button>
             
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`min-h-screen bg-transparent text-foreground relative overflow-hidden transition-opacity duration-[2000ms] ${hasEntered ? 'opacity-100' : 'opacity-0 h-screen overflow-hidden'}`}>
        {/* Background Video Layer */}
        <MythicalVideoBackground videoId="idFMw9hEPgk" opacity={0.45} />

        {/* Ambient Background Glows */}
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          {/* Indigo Flow */}
          <div className="absolute top-[-5%] left-[-5%] w-[50%] h-[50%] bg-[#1A1A2E]/50 blur-[130px] rounded-full animate-[pulse_8s_ease-in-out_infinite]" />
          {/* Violet Pulse */}
          <div className="absolute top-[30%] right-[-10%] w-[60%] h-[60%] bg-[#2D2338]/40 blur-[120px] rounded-full animate-[pulse_10s_ease-in-out_infinite]" style={{ animationDelay: '1500ms' }} />
          {/* Saffron Glow */}
          <div className="absolute bottom-[5%] left-[10%] w-[50%] h-[40%] bg-[#C9976E]/15 blur-[110px] rounded-full animate-[pulse_12s_ease-in-out_infinite]" style={{ animationDelay: '3000ms' }} />
          {/* Center Depth Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#080706]/20 to-[#080706] z-10" />
        </div>

        <div className="relative z-10">
          <HeroSection />
          <WhatTatvamIs />
          <HowItWorks />
          <WhatTatvamIsNot />
          <WhoItIsFor />
          <KurukshetraScroll />
          <TatvamValues />
          <TatvamSources />
          <TatvamPricing />
          <Footer />
        </div>
      </div>
    </>
  )
}
