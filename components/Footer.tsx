export default function Footer() {
  return (
    <footer className="border-t border-border px-6 md:px-12 py-12 md:py-16 bg-secondary/20">
      <div className="max-w-4xl mx-auto">
        <div className="space-y-8">
          <div className="space-y-4 text-sm text-foreground leading-relaxed">
            <p>
              Tatvam draws wisdom from three great traditions: the Bhagavad Gita's philosophy of action and purpose, the Ramayana's exploration of dharma and righteousness, and the Mahabharata's profound meditation on duty, ethics, and human nature.
            </p>
            <p>
              These are not sacred objects to be worshipped, but living wisdom to be contemplated. We approach them with reverence and respect, as bridges between ancient understanding and modern seeking.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-8 border-t border-border">
            <div>
              <h3 className="font-serif font-600 mb-3 text-foreground">Tatvam</h3>
              <p className="text-sm text-foreground">
                A quiet place to reflect and understand.
              </p>
            </div>
            <div>
              <h3 className="font-serif font-600 mb-3 text-foreground">Philosophy</h3>
              <p className="text-sm text-foreground">
                Guidance, not advice. Understanding, not instruction.
              </p>
            </div>
            <div>
              <h3 className="font-serif font-600 mb-3 text-foreground">Practice</h3>
              <p className="text-sm text-foreground">
                Share, listen, reflect, understand.
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-border text-center text-xs text-foreground">
            <p>© 2024 Tatvam. All rights reserved. Made with reflection. Innovation by Devansh and Nandini</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
