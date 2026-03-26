import type { Metadata } from 'next';
import '@/styles/globals.css';
import { AuthProvider } from '@/lib/auth';
import { ToastProvider } from '@/lib/toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

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
          <ToastProvider>
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1">
                <ErrorBoundary>
                  {children}
                </ErrorBoundary>
              </main>
              <Footer />
            </div>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
