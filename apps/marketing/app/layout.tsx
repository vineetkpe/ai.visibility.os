import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Visibility OS — Be the answer AI recommends',
  description: 'Measure, understand and improve how AI systems see your brand.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
