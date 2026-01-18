import React from "react"
import type { Metadata } from 'next'
import { Geist_Mono, Source_Sans_3, Crimson_Text } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geistMono = Geist_Mono({ subsets: ["latin"] });
const _sourceSans = Source_Sans_3({ subsets: ["latin"], variable: '--font-sans' });
const _crimsonText = Crimson_Text({ subsets: ["latin"], weight: ['400', '600'], variable: '--font-serif' });

export const metadata: Metadata = {
  title: 'Tatvam — A Quiet Place to Reflect',
  description: 'Guidance from the Bhagavad Gita, Ramayana, and Mahabharata — not as advice, but as understanding.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${_sourceSans.variable} ${_crimsonText.variable} font-sans antialiased bg-background text-foreground`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
