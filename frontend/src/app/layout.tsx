import type { Metadata } from 'next';
import '@/styles/globals.css';
import { AuthProvider } from '@/lib/auth';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: {
    default: 'ChessLearn - Learn Chess for Kids & Beginners',
    template: '%s | ChessLearn',
  },
  description: 'Learn chess through structured lessons covering openings, concepts, and endgames. Perfect for kids, beginners, and intermediate players.',
  keywords: ['chess', 'learn chess', 'chess lessons', 'chess for kids', 'chess beginners'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'ChessLearn',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
