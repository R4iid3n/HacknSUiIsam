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
        setPassport({
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
      setPassport(data);
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

      toast.success('Passport registered successfully!');
      await fetchPassport();
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Failed to register passport');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-6xl py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  // No passport
  if (!passport?.hasPassport) {
    return (
      <div className="container mx-auto max-w-4xl py-16 px-4">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="p-6 bg-blue-500/10 rounded-full">
              <Wallet className="h-16 w-16 text-blue-500" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">No Passport Yet</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Register your passport to start collecting mission attestations and earning SUI
            rewards. Your passport is your digital identity for this hackathon.
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <Button
            size="lg"
            onClick={handleRegisterPassport}
            disabled={registering}
            className="gap-2"
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
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your passport is a soulbound token (SBT) that stores all your mission completions.
            Registration is <strong>gasless</strong> and only takes a few seconds.
          </AlertDescription>
        </Alert>
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
    <div className="container mx-auto max-w-6xl py-8 px-4 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">My Passport</h1>
        <p className="text-lg text-muted-foreground">
          Your digital identity and rewards portfolio
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Rewards Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <GrantBadge amount={passport.totalRewards} variant="large" showIcon={true} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Award className="h-4 w-4" />
              Missions Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{passport.attestationCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {passport.attestationCount === 1 ? 'attestation' : 'attestations'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Member Since
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{createdDate}</div>
            <p className="text-xs text-muted-foreground mt-1 font-mono truncate">
              {passport.passportId?.slice(0, 10)}...{passport.passportId?.slice(-8)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Passport Card */}
      <PassportCard
        passportId={passport.passportId!}
        attestations={passport.attestations}
        totalRewards={passport.totalRewards}
      />

      {/* Attestations Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Mission Attestations</h2>
            <p className="text-sm text-muted-foreground">
              Your collection of completed missions
            </p>
          </div>
          {passport.attestationCount > 0 && (
            <div className="text-sm text-muted-foreground">
              {passport.attestationCount} {passport.attestationCount === 1 ? 'item' : 'items'}
            </div>
          )}
        </div>

        <AttestationGrid attestations={passport.attestations} />
      </div>

      {/* Share Section */}
      {passport.attestationCount > 0 && (
        <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg mb-1">Share Your Achievements</h3>
                <p className="text-sm text-muted-foreground">
                  Show off your mission completions and rewards
                </p>
              </div>
              <Button variant="outline" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Share Portfolio
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
