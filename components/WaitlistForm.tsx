'use client'

import React from "react"

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function WaitlistForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  })
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically send data to a backend
    console.log('Form submitted:', formData)
    setSubmitted(true)
    setFormData({ name: '', email: '', message: '' })
    
    // Reset success message after 5 seconds
    setTimeout(() => setSubmitted(false), 5000)
  }

  return (
    <section id="waitlist-form" className="px-6 md:px-12 py-20 md:py-32 bg-card border-t border-border">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h2 className="font-serif text-4xl md:text-5xl font-600 leading-tight text-balance text-foreground">
            Join the Waitlist
          </h2>
          <p className="text-foreground text-lg">
            Be among the first to experience Tatvam when it opens.
          </p>
        </div>

        {submitted ? (
          <div className="bg-secondary border border-border p-8 text-center space-y-2">
            <p className="text-foreground text-lg">Thank you for joining, {formData.name}!</p>
            <p className="text-foreground">We'll be in touch at {formData.email}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm mb-2 text-foreground font-medium">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-secondary border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent rounded-lg"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-sm mb-2 text-foreground font-medium">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-secondary border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent rounded-lg"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm mb-2 text-foreground font-medium">Message (optional)</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 bg-secondary border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent rounded-lg resize-none"
                placeholder="Tell us what draws you to Tatvam..."
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-accent text-accent-foreground hover:bg-primary py-3 font-600 rounded-lg"
            >
              Join the Waitlist
            </Button>

            <p className="text-xs text-foreground text-center">
              We respect your privacy. Your information will never be shared.
            </p>
          </form>
        )}
      </div>
    </section>
  )
}
