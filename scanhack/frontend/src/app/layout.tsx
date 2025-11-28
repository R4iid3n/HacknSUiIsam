import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/ic-auth';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'ScanHack — Gasless On-Chain Rewards for Hackathons',
  description: 'QR-based mission completion with ICP attestations and micro-grants',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
