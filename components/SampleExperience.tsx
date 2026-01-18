'use client'

import { Button } from '@/components/ui/button'
import { useState } from 'react'

export default function SampleExperience() {
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)

  return (
    <section className="px-6 md:px-12 py-20 md:py-32 bg-card border-t border-border">
      <div className="max-w-3xl mx-auto space-y-8">
        <h2 className="font-serif text-4xl md:text-5xl font-600 leading-tight text-balance text-foreground">
          Sample Experience
        </h2>
        
        <div className="bg-secondary p-8 md:p-12 space-y-8 rounded-lg border border-border">
          {/* Sanskrit Verse */}
          <div className="space-y-2">
            <p className="text-lg md:text-xl font-serif leading-relaxed text-center text-foreground">
              कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।<br />
              मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥
            </p>
          </div>

          {/* Audio Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="outline"
              onClick={() => setPlayingAudio(playingAudio === 'hindi' ? null : 'hindi')}
              className="border-foreground text-foreground hover:bg-primary"
            >
              {playingAudio === 'hindi' ? '⏸' : '▶'} श्रवण करें (हिंदी)
            </Button>
            <Button
              variant="outline"
              onClick={() => setPlayingAudio(playingAudio === 'english' ? null : 'english')}
              className="border-foreground text-foreground hover:bg-primary"
            >
              {playingAudio === 'english' ? '⏸' : '▶'} Listen (English)
            </Button>
          </div>

          {/* Hindi Meaning */}
          <div className="space-y-3">
            <h3 className="font-serif text-lg font-600 text-foreground">हिंदी अनुवाद</h3>
            <p className="text-foreground leading-relaxed">
              तुम्हारा अधिकार केवल कर्म पर है, उसके फल पर नहीं। इसलिए कर्म को अपने लिए फल की आशा से न करो, न ही कर्म न करने से मोह रखो।
            </p>
          </div>

          {/* English Relevance */}
          <div className="space-y-3">
            <h3 className="font-serif text-lg font-600 text-foreground">English Relevance</h3>
            <p className="text-foreground leading-relaxed">
              You have the right to act, but not to the fruits of action. Do not be attached to the results of your work, nor be attached to inaction. This verse teaches that our responsibility lies in sincere effort, not in controlling outcomes.
            </p>
          </div>

          {/* Reflection */}
          <div className="pt-4 border-t border-muted">
            <p className="text-foreground italic">
              "In this moment, what can you control? What must you release?"
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
