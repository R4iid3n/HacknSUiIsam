/**
 * MODULE 7 - Passport Page
 *
 * User portfolio view
 * Shows passport details and attestations grid
 */

import { useEffect, useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useNavigate } from 'react-router-dom';
import { PassportCard, type Attestation } from '@/components/lemanflow/PassportCard';
import { AttestationGrid } from '@/components/lemanflow/AttestationGrid';
import { GrantBadge } from '@/components/lemanflow/GrantBadge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, Wallet, Award, TrendingUp, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

interface PassportData {
  hasPassport: boolean;
  passportId: string | null;
  owner: string;
  createdAt: number;
  attestations: Attestation[];
  totalRewards: number;
  attestationCount: number;
}

export function PassportPage() {
  const account = useCurrentAccount();
  const navigate = useNavigate();
  const [passport, setPassport] = useState<PassportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    // Redirect to login if not connected
    if (!account) {
      navigate('/login');
      return;
    }

    // Login with wallet
    loginWithWallet();
  }, [account, navigate]);

  const loginWithWallet = async () => {
    if (!account) return;

    try {
      await fetch(`${API_BASE}/api/login/wallet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ address: account.address }),
      });

      fetchPassport();
    } catch (error) {
      console.error('Login error:', error);
      fetchPassport(); // Try anyway
    }
  };

  const fetchPassport = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/passport`, {
        credentials: 'include',
      });

      if (!response.ok) {
        // Don't reset passport if we already have one (indexing delay)
        setPassport((prev) => prev || {
          hasPassport: false,
          passportId: null,
          owner: account?.address || '',
          createdAt: 0,
          attestations: [],
          totalRewards: 0,
          attestationCount: 0,
        });
        return;
      }

      const data = await response.json();

      // Only update if we got valid data or don't have a passport yet
      if (data.hasPassport || !passport?.hasPassport) {
        setPassport(data);
      }
    } catch (error) {
      console.error('Failed to fetch passport:', error);
      toast.error('Failed to load passport');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterPassport = async () => {
    if (!account) {
      toast.error('Please connect your wallet');
      return;
    }

    setRegistering(true);
    try {
      const response = await fetch(`${API_BASE}/api/passport/register`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
      }

      const data = await response.json();
      toast.success('Passport registered successfully!');

      // Refresh passport with delay for blockchain indexing
      setTimeout(async () => {
        await fetchPassport();
      }, 2000);
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Failed to register passport');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-12 pb-24 md:pb-12">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-sky-400" />
        </div>
      </div>
    );
  }

  // No passport
  if (!passport?.hasPassport) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-12 pb-24 md:pb-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="p-8 bg-gradient-to-br from-sky-500/20 to-indigo-500/20 rounded-full border-2 border-sky-500/50">
              <Wallet className="h-20 w-20 text-sky-400" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4 text-white">No Passport Yet</h1>
          <p className="text-lg text-slate-400 mb-8">
            Register your passport to start collecting mission attestations and earning SUI
            rewards. Your passport is your digital identity for this event.
          </p>

          <Button
            size="lg"
            onClick={handleRegisterPassport}
            disabled={registering}
            className="gap-2 mb-8 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-white font-semibold shadow-lg shadow-sky-500/30 px-8"
          >
            {registering ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Registering...
              </>
            ) : (
              <>
                <Award className="h-5 w-5" />
                Register Passport
              </>
            )}
          </Button>

          <div className="rounded-2xl bg-sky-500/10 border border-sky-500/30 p-4 text-left">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-sky-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-slate-300">
                Your passport is a <span className="font-semibold text-sky-300">soulbound token (SBT)</span> that stores all your mission completions.
                Registration is <span className="font-semibold text-sky-300">gasless</span> and only takes a few seconds.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Has passport
  const createdDate = new Date(passport.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 pb-24 md:pb-12 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">My Passport</h1>
        <p className="text-sm text-slate-400">
          Your digital identity and rewards portfolio
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Total Rewards */}
        <div className="bg-gradient-to-br from-emerald-900/40 to-teal-900/40 border border-emerald-700/50 rounded-3xl p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            <span className="text-sm text-slate-400 font-medium">Total Rewards</span>
          </div>
          <div className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            {passport.totalRewards.toFixed(2)}
          </div>
          <p className="text-xs text-emerald-300/80 mt-1">SUI Earned</p>
        </div>

        {/* Missions Completed */}
        <div className="bg-gradient-to-br from-sky-900/40 to-indigo-900/40 border border-sky-700/50 rounded-3xl p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <Award className="h-5 w-5 text-sky-400" />
            <span className="text-sm text-slate-400 font-medium">Missions</span>
          </div>
          <div className="text-4xl font-bold text-white">{passport.attestationCount}</div>
          <p className="text-xs text-sky-300/80 mt-1">
            {passport.attestationCount === 1 ? 'Attestation' : 'Attestations'}
          </p>
        </div>

        {/* Member Since */}
        <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-700/50 rounded-3xl p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-5 w-5 text-purple-400" />
            <span className="text-sm text-slate-400 font-medium">Member Since</span>
          </div>
          <div className="text-lg font-semibold text-white">{createdDate}</div>
          <p className="text-xs text-purple-300/80 mt-1 font-mono truncate">
            {passport.passportId?.slice(0, 10)}...{passport.passportId?.slice(-8)}
          </p>
        </div>
      </div>

      {/* Passport Card */}
      <PassportCard
        passportId={passport.passportId!}
        attestations={passport.attestations}
        totalRewards={passport.totalRewards}
      />

      {/* Attestations Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">Mission Attestations</h2>
            <p className="text-sm text-slate-400">
              Your collection of completed missions
            </p>
          </div>
          {passport.attestationCount > 0 && (
            <div className="text-sm text-slate-500">
              {passport.attestationCount} {passport.attestationCount === 1 ? 'item' : 'items'}
            </div>
          )}
        </div>

        <AttestationGrid attestations={passport.attestations} />
      </div>

      {/* Share Section */}
      {passport.attestationCount > 0 && (
        <div className="rounded-3xl bg-gradient-to-br from-sky-900/40 via-cyan-900/40 to-indigo-900/40 border border-sky-700/50 p-6 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="font-bold text-xl text-white mb-1">Share Your Achievements</h3>
              <p className="text-sm text-slate-400">
                Show off your mission completions and rewards
              </p>
            </div>
            <Button
              variant="outline"
              className="gap-2 rounded-2xl border-slate-700 hover:border-sky-500/50 hover:bg-sky-500/10 text-slate-300 hover:text-sky-300 whitespace-nowrap"
            >
              <TrendingUp className="h-4 w-4" />
              Share Portfolio
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
