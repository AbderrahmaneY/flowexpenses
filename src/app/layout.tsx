import type { Metadata } from 'next';
import './globals.css';
import SecurityBanner from '@/components/SecurityBanner';
import EasterEggs from '@/components/EasterEggs';

export const metadata: Metadata = {
  title: 'YoLa Fresh - Expense Management',
  description: 'Premium Expense Management by YoLa Fresh',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <SecurityBanner />
        <EasterEggs />
        {children}
      </body>
    </html>
  );
}
