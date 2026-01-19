'use client'

import React, { useState } from "react"
import { Button } from '@/components/ui/button'
import CometCardDemo from './comet-card-demo'

interface WaitlistFormProps {
  isInsidePortal?: boolean;
  onClose?: () => void;
}

export default function WaitlistForm({ isInsidePortal, onClose }: WaitlistFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  })
  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  React.useEffect(() => {
    const isJoined = localStorage.getItem('tatvam_waitlist_joined') === 'true'
    if (isJoined) setSubmitted(true)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (error) setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong')
      }

      localStorage.setItem('tatvam_waitlist_joined', 'true')
      setSubmitted(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const formContent = (
    <div className={`max-w-2xl mx-auto ${isInsidePortal ? 'space-y-4 md:space-y-6' : 'space-y-8 md:space-y-12'}`}>
      {!submitted && (
        <div className="text-center space-y-2 md:space-y-4">
          <h2 className={`font-serif tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] ${isInsidePortal ? 'text-2xl md:text-5xl' : 'text-3xl md:text-5xl font-medium'}`}>
            {isInsidePortal ? 'Join the Inner Circle' : 'Tatvam is being shaped with care'}
          </h2>
          <p className={`text-white/90 font-light leading-relaxed drop-shadow-sm ${isInsidePortal ? 'text-base md:text-xl' : 'text-lg md:text-xl'}`}>
            {isInsidePortal
              ? 'Step through the mirror and walk with us.'
              : 'If this space feels like something you need, walk with us from the beginning.'}
          </p>
          <div className="h-0.5 w-12 md:w-16 bg-accent/50 mx-auto" />
        </div>
      )}

      {submitted ? (
        <div className="flex flex-col items-center justify-center space-y-6 md:space-y-8 min-h-[300px] md:min-h-[400px]">
          <div className="scale-75 md:scale-100">
            <CometCardDemo />
          </div>

          <div className="flex flex-col items-center space-y-3 md:space-y-4 w-full px-4 md:px-8">
            <Button
              disabled
              className="w-full bg-[#1a1614]/80 text-[#c9976e] py-6 md:py-8 text-xl md:text-2xl font-tiro rounded-xl border border-accent/20 cursor-default opacity-90 shadow-none"
            >
              जल्द ही आपके पास
            </Button>

            {isInsidePortal && (
              <Button
                onClick={onClose}
                variant="ghost"
                className="text-white/60 hover:text-white hover:bg-white/5 transition-all font-light tracking-widest text-[10px] md:text-xs uppercase"
              >
                Return to Landing
              </Button>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-xl text-destructive text-sm text-center animate-shake">
              {error}
            </div>
          )}

          <div className="space-y-4 md:space-y-5">
            <div>
              <label className="block text-[10px] md:text-sm mb-1 md:mb-2 text-white font-bold tracking-wide uppercase opacity-90">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={isLoading}
                className="w-full px-3 md:px-4 py-3 md:py-4 bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-accent rounded-xl transition-all text-base md:text-lg disabled:opacity-50"
                placeholder="What shall we call you?"
              />
            </div>

            <div>
              <label className="block text-[10px] md:text-sm mb-1 md:mb-2 text-white font-bold tracking-wide uppercase opacity-90">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isLoading}
                className="w-full px-3 md:px-4 py-3 md:py-4 bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-accent rounded-xl transition-all text-base md:text-lg disabled:opacity-50"
                placeholder="Where can we reach you?"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-accent text-[#1a1614] hover:bg-white py-6 md:py-8 text-lg md:text-xl font-black rounded-xl shadow-[0_0_30px_rgba(201,151,110,0.3)] transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-70"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 border-2 border-[#1a1614] border-t-transparent rounded-full animate-spin" />
                <span>CONNECTING...</span>
              </div>
            ) : (
              'JOIN THE WAITLIST'
            )}
          </Button>

          <p className="text-xs text-white/60 text-center tracking-[0.2em] font-medium uppercase">
            Your journey begins in silence.
          </p>
        </form>
      )}
    </div>
  )

  if (isInsidePortal) {
    return formContent
  }

  return (
    <section id="waitlist-form" className="px-6 md:px-12 py-24 md:py-32 bg-background border-t border-border/50">
      {formContent}
    </section>
  )
}
