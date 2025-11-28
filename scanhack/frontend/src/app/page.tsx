'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthClient } from '@/lib/ic-auth';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, login, loading } = useAuthClient();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          ScanHack
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-4">
          Gasless On-Chain Rewards for Hackathons
        </p>
        <p className="text-lg text-gray-500 dark:text-gray-400 mb-8">
          Built on Internet Computer Protocol • Zero Gas Fees • Web2 UX • Web3 Security
        </p>
        <div className="space-y-4">
          <Button onClick={login} size="lg" className="w-full sm:w-auto">
            Login with Internet Identity
          </Button>
          <div className="mt-8 text-left max-w-md mx-auto">
            <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
              Features:
            </h2>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>No wallet needed — Login with Internet Identity</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Zero gas fees — ICP cycles, no transaction costs</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Instant rewards — Automatic micro-grant distribution</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Soulbound credentials — Permanent proof of achievement</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

