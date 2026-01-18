'use client';

import { Button } from '@/components/ui/button'

export default function HeroSection() {
  const handleScrollToWaitlist = () => {
    const element = document.getElementById('waitlist-form')
    element?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="min-h-screen flex items-center justify-center px-6 md:px-12 py-20 md:py-32 bg-gradient-to-b from-background to-secondary/30">
      <div className="max-w-4xl w-full text-center space-y-8">
        <div className="space-y-6">
          <div className="flex justify-center mb-8">
            <img 
              src="/logo.png" 
              alt="Tatvam" 
              className="h-32 w-auto"
            />
          </div>
          <h1 className="font-serif text-5xl md:text-6xl font-600 leading-tight text-balance text-foreground">
            A quiet place to reflect
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed text-balance max-w-2xl mx-auto">
            Guidance from the Bhagavad Gita, Ramayana, and Mahabharata — not as advice, but as understanding.
          </p>
        </div>
        <Button
          onClick={handleScrollToWaitlist}
          className="mx-auto bg-accent text-accent-foreground hover:bg-primary px-8 py-6 text-base rounded-full font-medium"
        >
          Join the Waitlist
        </Button>
      </div>
    </section>
  )
}
