'use client'

import HeroSection from '@/components/HeroSection'
import WhatTatvamIs from '@/components/WhatTatvamIs'
import HowItWorks from '@/components/HowItWorks'
import WhatTatvamIsNot from '@/components/WhatTatvamIsNot'
import WhoItIsFor from '@/components/WhoItIsFor'
import TatvamValues from '@/components/TatvamValues'
import TatvamSources from '@/components/TatvamSources'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <HeroSection />
      <WhatTatvamIs />
      <HowItWorks />
      <WhatTatvamIsNot />
      <WhoItIsFor />
      <TatvamValues />
      <TatvamSources />
      <Footer />
    </div>
  )
}
