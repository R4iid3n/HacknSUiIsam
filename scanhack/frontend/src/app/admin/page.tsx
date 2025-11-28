'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthClient } from '@/lib/ic-auth';
import { CANISTER_IDS } from '@/config';
import { createActor, BackendActor, MissionsActor, GrantVaultActor, Mission, QRPayload, convertQRPayload } from '@/lib/canisters';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import QRCode from 'qrcode.react';

// Simplified IDL Factories
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
  });
};

const grantVaultIdlFactory = ({ IDL }: any) => {
  return IDL.Service({
    createVault: IDL.Func(
      [IDL.Text, IDL.Nat],
      [IDL.Variant({ ok: IDL.Record({
        eventId: IDL.Text,
        totalCycles: IDL.Nat,
        distributedCycles: IDL.Nat,
        createdAt: IDL.Nat64,
      }), err: IDL.Text })],
      []
    ),
    fundVault: IDL.Func(
      [IDL.Text, IDL.Nat],
      [IDL.Variant({ ok: IDL.Record({
        eventId: IDL.Text,
        totalCycles: IDL.Nat,
        distributedCycles: IDL.Nat,
        createdAt: IDL.Nat64,
      }), err: IDL.Text })],
      []
    ),
    getVaultBalance: IDL.Func([IDL.Text], [IDL.Opt(IDL.Nat)], ['query']),
  });
};

export default function AdminPage() {
  const router = useRouter();
  const { isAuthenticated, authClient, loading } = useAuthClient();
  const [activeTab, setActiveTab] = useState<'event' | 'mission' | 'qr'>('event');
  const [missions, setMissions] = useState<Mission[]>([]);
  const [generatedQR, setGeneratedQR] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [eventId, setEventId] = useState('dorahacks-2024');
  const [vaultCycles, setVaultCycles] = useState('1000000');
  const [missionTitle, setMissionTitle] = useState('');
  const [missionDescription, setMissionDescription] = useState('');
  const [missionReward, setMissionReward] = useState('10000');
  const [selectedMissionId, setSelectedMissionId] = useState('');
  const [qrExpiresIn, setQrExpiresIn] = useState('3600');

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && authClient && activeTab === 'mission') {
      loadMissions();
    }
  }, [isAuthenticated, authClient, activeTab]);

  async function loadMissions() {
    if (!authClient) return;

    try {
      const identity = authClient.getIdentity();
      const missionsActor = createActor<MissionsActor>(
        CANISTER_IDS.missions,
        missionsIdlFactory,
        identity
      );
      const missionsList = await missionsActor.getMissions(eventId);
      setMissions(missionsList);
    } catch (err: any) {
      console.error('Failed to load missions:', err);
    }
  }

  async function createEvent() {
    if (!authClient) return;

    try {
      setLoadingAction(true);
      setError(null);
      setSuccess(null);

      const identity = authClient.getIdentity();
      const backendActor = createActor<BackendActor>(
        CANISTER_IDS.backend,
        backendIdlFactory,
        identity
      );

      const result = await backendActor.createEvent(eventId, BigInt(vaultCycles));

      if ('ok' in result && result.ok !== undefined) {
        setSuccess('Event created successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.err || 'Failed to create event');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create event');
    } finally {
      setLoadingAction(false);
    }
  }

  async function createMission() {
    if (!authClient) return;

    try {
      setLoadingAction(true);
      setError(null);
      setSuccess(null);

      const identity = authClient.getIdentity();
      const missionsActor = createActor<MissionsActor>(
        CANISTER_IDS.missions,
        missionsIdlFactory,
        identity
      );

      const result = await missionsActor.createMission(
        eventId,
        missionTitle,
        missionDescription,
        BigInt(missionReward)
      );

      if ('ok' in result && result.ok) {
        setSuccess('Mission created successfully!');
        setMissionTitle('');
        setMissionDescription('');
        setMissionReward('10000');
        setTimeout(() => {
          setSuccess(null);
          loadMissions();
        }, 2000);
      } else {
        setError(result.err || 'Failed to create mission');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create mission');
    } finally {
      setLoadingAction(false);
    }
  }

  async function generateQR() {
    if (!authClient || !selectedMissionId) return;

    try {
      setLoadingAction(true);
      setError(null);
      setSuccess(null);
      setGeneratedQR(null);

      const identity = authClient.getIdentity();
      const backendActor = createActor<BackendActor>(
        CANISTER_IDS.backend,
        backendIdlFactory,
        identity
      );

      const result = await backendActor.generateQRPayload(
        eventId,
        selectedMissionId,
        BigInt(qrExpiresIn)
      );

      if ('ok' in result && result.ok) {
        const payload = convertQRPayload(result.ok);
        const qrData = JSON.stringify(payload);
        setGeneratedQR(qrData);
        setSuccess('QR code generated successfully!');
      } else {
        setError(result.err || 'Failed to generate QR code');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate QR code');
    } finally {
      setLoadingAction(false);
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

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Admin Panel
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage events, missions, and generate QR codes
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('event')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'event'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Create Event
          </button>
          <button
            onClick={() => setActiveTab('mission')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'mission'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Create Mission
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'qr'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Generate QR
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-800 dark:text-green-200">{success}</p>
          </div>
        )}

        {/* Create Event */}
        {activeTab === 'event' && (
          <Card>
            <CardHeader>
              <CardTitle>Create Event</CardTitle>
              <CardDescription>Create a new event with a grant vault</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Event ID"
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                placeholder="dorahacks-2024"
              />
              <Input
                label="Initial Vault Cycles"
                type="number"
                value={vaultCycles}
                onChange={(e) => setVaultCycles(e.target.value)}
                placeholder="1000000"
              />
              <Button onClick={createEvent} loading={loadingAction} disabled={!eventId || !vaultCycles}>
                Create Event
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Create Mission */}
        {activeTab === 'mission' && (
          <Card>
            <CardHeader>
              <CardTitle>Create Mission</CardTitle>
              <CardDescription>Add a new mission to the event</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Event ID"
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                placeholder="dorahacks-2024"
              />
              <Input
                label="Mission Title"
                value={missionTitle}
                onChange={(e) => setMissionTitle(e.target.value)}
                placeholder="Complete Workshop"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  value={missionDescription}
                  onChange={(e) => setMissionDescription(e.target.value)}
                  placeholder="Mission description..."
                  rows={3}
                />
              </div>
              <Input
                label="Reward Amount (Cycles)"
                type="number"
                value={missionReward}
                onChange={(e) => setMissionReward(e.target.value)}
                placeholder="10000"
              />
              <Button onClick={createMission} loading={loadingAction} disabled={!missionTitle || !missionDescription}>
                Create Mission
              </Button>

              {missions.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Existing Missions</h3>
                  <div className="space-y-2">
                    {missions.map((mission) => (
                      <div
                        key={mission.id}
                        className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-between"
                      >
                        <div>
                          <div className="font-medium">{mission.title}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {Number(mission.rewardAmount).toLocaleString()} cycles • {Number(mission.completions)} completions
                          </div>
                        </div>
                        <Badge variant={mission.active ? 'success' : 'danger'}>
                          {mission.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Generate QR */}
        {activeTab === 'qr' && (
          <Card>
            <CardHeader>
              <CardTitle>Generate QR Code</CardTitle>
              <CardDescription>Generate a signed QR code for a mission</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Event ID"
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                placeholder="dorahacks-2024"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select Mission
                </label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  value={selectedMissionId}
                  onChange={(e) => setSelectedMissionId(e.target.value)}
                >
                  <option value="">Select a mission...</option>
                  {missions.map((mission) => (
                    <option key={mission.id} value={mission.id}>
                      {mission.title}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Expires In (seconds)"
                type="number"
                value={qrExpiresIn}
                onChange={(e) => setQrExpiresIn(e.target.value)}
                placeholder="3600"
              />
              <Button onClick={generateQR} loading={loadingAction} disabled={!selectedMissionId}>
                Generate QR Code
              </Button>

              {generatedQR && (
                <div className="mt-6 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                  <h3 className="text-lg font-semibold mb-4">QR Code Generated</h3>
                  <div className="flex justify-center mb-4">
                    <QRCode value={generatedQR} size={256} />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Expires in {Number(qrExpiresIn) / 60} minutes
                  </p>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      const blob = new Blob([generatedQR], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `qr-${selectedMissionId}.json`;
                      a.click();
                    }}
                  >
                    Download QR Data
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

