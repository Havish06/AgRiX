import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'AgRiX | Agricultural Credit Risk Framework',
  description: 'Uncertainty-aware statistical and machine learning framework for agricultural credit risk under climate and yield variability',
  keywords: ['agriculture', 'credit risk', 'climate', 'yield forecasting', 'uncertainty quantification', 'machine learning'],
  authors: [{ name: 'AgRiX Contributors' }],
  openGraph: {
    title: 'AgRiX | Agricultural Credit Risk Framework',
    description: 'Uncertainty-aware statistical and machine learning framework for agricultural credit risk',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#2d4a2b',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} font-sans`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-background text-text">
        {children}
      </body>
    </html>
  );
}