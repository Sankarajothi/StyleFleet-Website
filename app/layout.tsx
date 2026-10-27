import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'StyleFleet | Luxury Salon Management Platform',
  description: 'The modern luxury salon management suite. Express billing, real time appointments, stylist performance, and WhatsApp engagement in one elegant workspace.',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/assets/stylefleet-logo.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#0B1F44',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased selection:bg-[#D4AF37] selection:text-slate-900" suppressHydrationWarning>
        {/* Ambient Gradient Glow Lights */}
        <div className="ambient-glow-wrapper" aria-hidden="true">
          <div className="glow-orb glow-gold" />
          <div className="glow-orb glow-blue" />
        </div>
        
        {children}
      </body>
    </html>
  );
}
