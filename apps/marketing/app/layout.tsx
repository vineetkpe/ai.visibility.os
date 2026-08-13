import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Instrument_Serif } from 'next/font/google';
import './globals.css';

const sansFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

const serifFont = Instrument_Serif({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  weight: ['400'],
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  title: 'AI Visibility OS — Enterprise Generative Search Intelligence Platform',
  description:
    'Monitor, analyze, and optimize how enterprise brands are represented, cited, and recommended across OpenAI Search, Google Gemini, Claude, Perplexity, and Microsoft Copilot.',
  keywords: [
    'AI Visibility',
    'Generative Engine Optimization',
    'GEO',
    'AI Search Monitoring',
    'Perplexity Ranking',
    'ChatGPT Citation Audit',
    'LLM Brand Mentions',
    'Enterprise Brand Safety AI',
  ],
  authors: [{ name: 'AI Visibility OS Engineering' }],
  openGraph: {
    title: 'AI Visibility OS — Enterprise Generative Search Intelligence',
    description:
      'The authoritative platform for tracking brand citations, recommendation share of voice, and synthetic search alignment in AI answer engines.',
    type: 'website',
    url: 'https://aivisibilityos.com',
  },
};

export const viewport: Viewport = {
  themeColor: '#fafafb',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sansFont.variable} ${serifFont.variable}`}>
      <body className="min-h-screen bg-[#fafafb] text-[#090d16] antialiased selection:bg-[#090d16] selection:text-white">
        {children}
      </body>
    </html>
  );
}
