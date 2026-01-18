'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import HeroSection from '@/components/HeroSection'
import WhatTatvamIs from '@/components/WhatTatvamIs'
import HowItWorks from '@/components/HowItWorks'
import SampleExperience from '@/components/SampleExperience'
import WhoItIsFor from '@/components/WhoItIsFor'
import WaitlistForm from '@/components/WaitlistForm'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <HeroSection />
      <WhatTatvamIs />
      <HowItWorks />
      <SampleExperience />
      <WhoItIsFor />
      <WaitlistForm />
      <Footer />
    </div>
  )
}
