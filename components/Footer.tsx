export default function Footer() {
  return (
    <footer className="border-t border-accent/10 px-6 md:px-12 py-12 md:py-16 bg-accent/[0.02]" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">Footer Acknowledgements</h2>
      <div className="max-w-4xl mx-auto">
        <div className="space-y-8">
          <div className="space-y-4 text-sm text-foreground/80 leading-relaxed">
            <p>
              Tatvam draws wisdom from three great traditions: the Bhagavad Gita's philosophy of action and purpose, the Ramayana's exploration of dharma and righteousness, and the Mahabharata's profound meditation on duty, ethics, and human nature.
            </p>
            <p>
              These are not sacred objects to be worshipped, but living wisdom to be contemplated. We approach them with reverence and respect, as bridges between ancient understanding and modern seeking.
            </p>
          </div>

          <nav className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-8 border-t border-accent/10" aria-label="Footer Navigation">
            <div>
              <h3 className="font-serif font-600 mb-3 text-accent">Tatvam</h3>
              <p className="text-sm text-foreground/70">
                A quiet place to reflect and understand.
              </p>
            </div>
            <div>
              <h3 className="font-serif font-600 mb-3 text-accent">Philosophy</h3>
              <p className="text-sm text-foreground/70">
                Guidance, not advice. Understanding, not instruction.
              </p>
            </div>
            <div>
              <h3 className="font-serif font-600 mb-3 text-accent">Practice</h3>
              <p className="text-sm text-foreground/70">
                Share, listen, reflect, understand.
              </p>
            </div>
          </nav>

          <div className="pt-8 border-t border-accent/10 text-center text-[10px] tracking-[0.1em] text-accent/40 uppercase font-light">
            <p>© 2026 Tatvam. Guided by the sacred texts. Innovation by Devansh and Nandini</p>
          </div>
        </div>
      </div>
    </footer>

  )
}
