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
        <footer className="text-center py-6 text-gray-500 text-sm border-t border-gray-100 mt-8">
          <p>© Abderrahmane Naciri Bennani - Dec 2025</p>
          <p className="mt-1 text-xs text-gray-400">YoLa Fresh - Expense Management</p>
          <p className="mt-1 text-xs text-gray-300">Contact: demo@yolafresh.com</p>
        </footer>
      </body>
    </html>
  );
}
