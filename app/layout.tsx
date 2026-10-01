import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://postcraft.ai'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'PostCraft AI — AI Social Media Content Generator',
    template: '%s | PostCraft AI',
  },
  description:
    'Create viral social media posts with AI in seconds. Generate stunning images, captions and hashtags for Instagram, TikTok, YouTube Shorts, Reels, X, Facebook and LinkedIn.',
  keywords: ['social media AI', 'AI content generator', 'Instagram post maker', 'TikTok content', 'AI image generator', 'caption generator', 'hashtag generator', 'PostCraft AI'],
  alternates: { canonical: '/' },
  openGraph: {
    title: 'PostCraft AI — AI Social Media Content Generator',
    description: 'Create viral social media posts with AI in seconds.',
    url: SITE_URL,
    siteName: 'PostCraft AI',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PostCraft AI — AI Social Media Content Generator',
    description: 'Create viral social media posts with AI in seconds.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
