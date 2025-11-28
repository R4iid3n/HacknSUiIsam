'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthClient } from '@/lib/ic-auth';
import { CANISTER_IDS } from '@/config';
import { createActor, BackendActor, HackPass, Attestation, Grant } from '@/lib/canisters';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Simplified IDL Factory
const backendIdlFactory = ({ IDL }: any) => {
  return IDL.Service({
    getUserData: IDL.Func(
      [IDL.Opt(IDL.Text)],
      [IDL.Record({
        user: IDL.Record({
          id: IDL.Principal,
          createdAt: IDL.Nat64,
          hackPasses: IDL.Vec(IDL.Text),
        }),
        hackPass: IDL.Opt(IDL.Record({
          id: IDL.Text,
          userId: IDL.Principal,
          eventId: IDL.Text,
          createdAt: IDL.Nat64,
          attestationCount: IDL.Nat,
        })),
        attestations: IDL.Vec(IDL.Record({
          id: IDL.Text,
          userId: IDL.Principal,
          hackPassId: IDL.Text,
          missionId: IDL.Text,
          eventId: IDL.Text,
          completedAt: IDL.Nat64,
          rewardAmount: IDL.Nat,
        })),
        grants: IDL.Vec(IDL.Record({
          id: IDL.Text,
          userId: IDL.Principal,
          eventId: IDL.Text,
          amount: IDL.Nat,
          missionId: IDL.Text,
          distributedAt: IDL.Nat64,
        })),
      })],
      []
    ),
  });
};

export default function PassportPage() {
  const router = useRouter();
  const { isAuthenticated, authClient, principal, loading } = useAuthClient();
  const [hackPasses, setHackPasses] = useState<HackPass[]>([]);
  const [attestations, setAttestations] = useState<Attestation[]>([]);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && authClient && principal) {
      loadPassportData();
    }
  }, [isAuthenticated, authClient, principal]);

  async function loadPassportData() {
    if (!authClient || !principal) return;

    try {
      setLoadingData(true);
      setError(null);

      const identity = authClient.getIdentity();
      const backendActor = createActor<BackendActor>(
        CANISTER_IDS.backend,
        backendIdlFactory,
        identity
      );

      // Get all user data (no event filter)
      const userData = await backendActor.getUserData([]);
      
      // For now, we'll show all attestations and grants
      // In production, you'd want to fetch HackPasses for all events
      setHackPasses(userData.hackPass[0] ? [userData.hackPass[0]] : []);
      setAttestations(userData.attestations);
      setGrants(userData.grants);
    } catch (err: any) {
      console.error('Failed to load passport data:', err);
      setError(err.message || 'Failed to load passport data');
    } finally {
      setLoadingData(false);
    }
  }

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const totalRewards = grants.reduce((sum, g) => sum + Number(g.amount), 0);

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            My Passport
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your on-chain credentials and achievements
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {hackPasses.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                HackPasses
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {attestations.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Attestations
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {totalRewards.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Total Rewards (Cycles)
              </div>
            </CardContent>
          </Card>
        </div>

        {/* HackPasses */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            HackPasses
          </h2>
          {loadingData ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
            </div>
          ) : hackPasses.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  No HackPasses yet. Complete your first mission to get one!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hackPasses.map((hackPass) => (
                <Card key={hackPass.id} hover>
                  <CardHeader>
                    <CardTitle>HackPass</CardTitle>
                    <CardDescription>{hackPass.eventId}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Badge variant="info">Soulbound SBT</Badge>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Created: {new Date(Number(hackPass.createdAt / BigInt(1_000_000))).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Attestations: {Number(hackPass.attestationCount)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 font-mono mt-2 break-all">
                        {hackPass.id}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Attestations */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Attestations
          </h2>
          {loadingData ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
            </div>
          ) : attestations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  No attestations yet. Complete missions to earn attestations!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {attestations.map((attestation) => (
                <Card key={attestation.id} hover>
                  <CardHeader>
                    <CardTitle>Mission Attestation</CardTitle>
                    <CardDescription>
                      {attestation.missionId} • {attestation.eventId}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Badge variant="success">Soulbound SBT</Badge>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Completed: {new Date(Number(attestation.completedAt / BigInt(1_000_000))).toLocaleDateString()}
                      </div>
                      {Number(attestation.rewardAmount) > 0 && (
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          Reward: {Number(attestation.rewardAmount).toLocaleString()} cycles
                        </div>
                      )}
                      <div className="text-xs text-gray-500 dark:text-gray-500 font-mono mt-2 break-all">
                        {attestation.id}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Grants */}
        {grants.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Grants Received
            </h2>
            <div className="space-y-2">
              {grants.map((grant) => (
                <Card key={grant.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{grant.missionId}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {grant.eventId} • {new Date(Number(grant.distributedAt / BigInt(1_000_000))).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {Number(grant.amount).toLocaleString()} cycles
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

