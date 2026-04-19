import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import 'katex/dist/katex.min.css';
import { SessionProvider } from '@/components/ui/SessionProvider';
import Navbar from '@/components/ui/Navbar';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });

export const metadata: Metadata = {
  title: 'MindLoop — Learn. Grow. Succeed.',
  description: 'AI-powered learning and career development platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full bg-gray-50 font-sans">
        <SessionProvider>
          <Navbar />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
