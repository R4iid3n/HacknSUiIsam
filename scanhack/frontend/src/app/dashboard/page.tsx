'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthClient } from '@/lib/ic-auth';
import { CANISTER_IDS, IC_HOST } from '@/config';
import { createActor, BackendActor, MissionsActor, Mission, HackPass, Attestation, Grant } from '@/lib/canisters';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Principal } from '@dfinity/principal';

// Simplified IDL Factory (in production, generate from .did files)
const backendIdlFactory = ({ IDL }: any) => {
  return IDL.Service({
    generateQRPayload: IDL.Func(
      [IDL.Text, IDL.Text, IDL.Nat64],
      [IDL.Variant({ ok: IDL.Record({
        eventId: IDL.Text,
        missionId: IDL.Text,
        nonce: IDL.Text,
        signature: IDL.Vec(IDL.Nat8),
        expiresAt: IDL.Nat64,
      }), err: IDL.Text })],
      []
    ),
    completeMission: IDL.Func(
      [IDL.Record({
        eventId: IDL.Text,
        missionId: IDL.Text,
        nonce: IDL.Text,
        signature: IDL.Vec(IDL.Nat8),
        expiresAt: IDL.Nat64,
      })],
      [IDL.Variant({ ok: IDL.Record({
        attestation: IDL.Record({
          id: IDL.Text,
          userId: IDL.Principal,
          hackPassId: IDL.Text,
          missionId: IDL.Text,
          eventId: IDL.Text,
          completedAt: IDL.Nat64,
          rewardAmount: IDL.Nat,
        }),
        grant: IDL.Opt(IDL.Record({
          id: IDL.Text,
          userId: IDL.Principal,
          eventId: IDL.Text,
          amount: IDL.Nat,
          missionId: IDL.Text,
          distributedAt: IDL.Nat64,
        })),
      }), err: IDL.Text })],
      []
    ),
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
    createEvent: IDL.Func(
      [IDL.Text, IDL.Nat],
      [IDL.Variant({ ok: IDL.Null, err: IDL.Text })],
      []
    ),
  });
};

const missionsIdlFactory = ({ IDL }: any) => {
  return IDL.Service({
    createMission: IDL.Func(
      [IDL.Text, IDL.Text, IDL.Text, IDL.Nat],
      [IDL.Variant({ ok: IDL.Record({
        id: IDL.Text,
        eventId: IDL.Text,
        title: IDL.Text,
        description: IDL.Text,
        rewardAmount: IDL.Nat,
        active: IDL.Bool,
        completions: IDL.Nat,
        createdAt: IDL.Nat64,
      }), err: IDL.Text })],
      []
    ),
    getMissions: IDL.Func([IDL.Text], [IDL.Vec(IDL.Record({
      id: IDL.Text,
      eventId: IDL.Text,
      title: IDL.Text,
      description: IDL.Text,
      rewardAmount: IDL.Nat,
      active: IDL.Bool,
      completions: IDL.Nat,
      createdAt: IDL.Nat64,
    }))], ['query']),
    getUserAttestations: IDL.Func(
      [IDL.Principal],
      [IDL.Vec(IDL.Record({
        id: IDL.Text,
        userId: IDL.Principal,
        hackPassId: IDL.Text,
        missionId: IDL.Text,
        eventId: IDL.Text,
        completedAt: IDL.Nat64,
        rewardAmount: IDL.Nat,
      }))],
      ['query']
    ),
    getMission: IDL.Func(
      [IDL.Text],
      [IDL.Opt(IDL.Record({
        id: IDL.Text,
        eventId: IDL.Text,
        title: IDL.Text,
        description: IDL.Text,
        rewardAmount: IDL.Nat,
        active: IDL.Bool,
        completions: IDL.Nat,
        createdAt: IDL.Nat64,
      }))],
      ['query']
    ),
    setMissionActive: IDL.Func(
      [IDL.Text, IDL.Bool],
      [IDL.Variant({ ok: IDL.Null, err: IDL.Text })],
      []
    ),
  });
};

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, principal, authClient, loading } = useAuthClient();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [hackPass, setHackPass] = useState<HackPass | null>(null);
  const [attestations, setAttestations] = useState<Attestation[]>([]);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string>('dorahacks-2024');

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && authClient && principal) {
      loadData();
    }
  }, [isAuthenticated, authClient, principal, selectedEventId]);

  async function loadData() {
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
      const missionsActor = createActor<MissionsActor>(
        CANISTER_IDS.missions,
        missionsIdlFactory,
        identity
      );

      // Get user data
      const userData = await backendActor.getUserData([selectedEventId]);
      setHackPass(userData.hackPass[0] || null);
      setAttestations(userData.attestations);
      setGrants(userData.grants);

      // Get missions
      const missionsList = await missionsActor.getMissions(selectedEventId);
      setMissions(missionsList);
    } catch (err: any) {
      console.error('Failed to load data:', err);
      setError(err.message || 'Failed to load data');
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

  const completedMissionIds = new Set(attestations.map((a) => a.missionId));
  const totalRewards = grants.reduce((sum, g) => sum + Number(g.amount), 0);

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Complete missions, earn attestations, and claim rewards
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
                {hackPass ? Number(hackPass.attestationCount) : 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Attestations Earned
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {missions.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Available Missions
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {totalRewards}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Total Rewards (Cycles)
              </div>
            </CardContent>
          </Card>
        </div>

        {/* HackPass */}
        {hackPass && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Your HackPass</CardTitle>
              <CardDescription>
                Event: {hackPass.eventId} • Created:{' '}
                {new Date(Number(hackPass.createdAt / BigInt(1_000_000))).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Badge variant="info">Soulbound SBT</Badge>
                <Badge variant="success">
                  {Number(hackPass.attestationCount)} Attestations
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Missions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Missions
          </h2>
          {loadingData ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading missions...</p>
            </div>
          ) : missions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  No missions available yet. Check back later!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {missions.map((mission) => {
                const isCompleted = completedMissionIds.has(mission.id);
                return (
                  <Card key={mission.id} hover>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{mission.title}</CardTitle>
                        {isCompleted && <Badge variant="success">Completed</Badge>}
                        {!mission.active && <Badge variant="danger">Inactive</Badge>}
                      </div>
                      <CardDescription>{mission.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mt-4">
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Reward: {Number(mission.rewardAmount).toLocaleString()} cycles
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {Number(mission.completions)} completions
                          </div>
                        </div>
                        {!isCompleted && mission.active && (
                          <Button
                            size="sm"
                            onClick={() => router.push('/scan')}
                          >
                            Scan QR
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

