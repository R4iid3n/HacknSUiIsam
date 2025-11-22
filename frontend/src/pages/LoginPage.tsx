/**
 * MODULE 7 - Login Page
 *
 * Clean, minimal login page with zkLogin CTA
 * Dark theme, big typography, no clutter
 */

import { useEffect } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useNavigate } from 'react-router-dom';
import { ConnectButton } from '@mysten/dapp-kit';
import { Zap, Shield, Award } from 'lucide-react';

export function LoginPage() {
  const account = useCurrentAccount();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to dashboard if already connected
    if (account) {
      navigate('/dashboard');
    }
  }, [account, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-indigo-950 to-purple-950 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Hero Section */}
        <div className="text-center mb-12">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="text-8xl">🌊</div>
          </div>

          {/* Title */}
          <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            LémanFlow
          </h1>

          {/* Subtitle */}
          <p className="text-2xl md:text-3xl text-gray-300 mb-4 font-light">
            Gasless Rewards for Hackathon Missions
          </p>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Complete missions, earn SUI rewards. All transactions are sponsored —{' '}
            <span className="text-indigo-400 font-semibold">zero gas fees</span>.
          </p>
        </div>

        {/* CTA Card */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 md:p-12 shadow-2xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">Get Started</h2>
            <p className="text-gray-400 text-lg">
              Connect your wallet to start earning rewards
            </p>
          </div>

          {/* Connect Wallet CTA */}
          <div className="flex justify-center mb-8">
            <div className="scale-125">
              <ConnectButton />
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="text-center p-6 bg-blue-950/30 rounded-xl border border-blue-900/50">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-blue-600/20 rounded-full">
                  <Zap className="h-8 w-8 text-blue-400" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Gasless</h3>
              <p className="text-gray-400 text-sm">
                All transactions sponsored. Zero gas fees for you.
              </p>
            </div>

            <div className="text-center p-6 bg-indigo-950/30 rounded-xl border border-indigo-900/50">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-indigo-600/20 rounded-full">
                  <Shield className="h-8 w-8 text-indigo-400" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Secure</h3>
              <p className="text-gray-400 text-sm">
                Built on SUI blockchain with zkLogin authentication.
              </p>
            </div>

            <div className="text-center p-6 bg-purple-950/30 rounded-xl border border-purple-900/50">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-purple-600/20 rounded-full">
                  <Award className="h-8 w-8 text-purple-400" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Rewards</h3>
              <p className="text-gray-400 text-sm">
                Earn SUI tokens for completing hackathon missions.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            Powered by SUI Blockchain • Walrus Storage • Enoki zkLogin • SuiNS
          </p>
        </div>
      </div>
    </div>
  );
}
