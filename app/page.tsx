'use client'

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

export default function Home() {
  return (
    <div className="min-h-screen bg-[#080706] text-foreground relative overflow-hidden">
      {/* Background Video Layer */}
      <MythicalVideoBackground videoId="idFMw9hEPgk" opacity={0.12} />

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
        <TatvamValues />
        <TatvamSources />
        <TatvamPricing />
        <Footer />
      </div>
    </div>
  )
}
