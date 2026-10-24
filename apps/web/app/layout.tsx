import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export const metadata: Metadata = {
  title: 'EVENTRA — Premiere Event Discovery, Booking & Ticketing',
  description:
    'Discover, reserve, and experience world-class conferences, summits, music performances, and exhibitions. Featuring instant digital QR passes and real-time seat availability.',
  keywords: ['event tickets', 'conference registration', 'live music', 'tech summits', 'ticket booking', 'QR passes'],
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full scroll-smooth dark">
      <body className="flex flex-col min-h-screen text-slate-100 bg-[#0B0F19]">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
