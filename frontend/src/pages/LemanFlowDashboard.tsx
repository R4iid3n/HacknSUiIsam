import { useEffect, useState } from 'react';
import { useCurrentAccount, useSignTransaction } from '@mysten/dapp-kit';
import { MissionCard, type Mission } from '@/components/lemanflow/MissionCard';
import { PassportCard, type Attestation } from '@/components/lemanflow/PassportCard';
import { QRDialog } from '@/components/lemanflow/QRDialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import toast from 'react-hot-toast';
import { Wallet, AlertCircle, Loader2, Info } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';
const DEFAULT_EVENT_ID = import.meta.env.VITE_EVENT_ID || '0xe13b43211fca648ff5a3198b3282d15a3c9c976ed922d418231f76680755710d'; // Real event ID
const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID;

interface PassportData {
  hasPassport: boolean;
  passportId: string | null;
  attestations: Attestation[];
  totalRewards: number;
}

interface EventInfo {
  id: string;
  name: string;
  description: string;
  startTime: number;
  endTime: number;
  active: boolean;
}

export function LemanFlowDashboard() {
  const account = useCurrentAccount();
  const { mutateAsync: signTransaction } = useSignTransaction();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [event, setEvent] = useState<EventInfo | null>(null);
  const [availableEvents, setAvailableEvents] = useState<EventInfo[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [passport, setPassport] = useState<PassportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<number | null>(null);
  const [isMockMode, setIsMockMode] = useState(false);
  const [missionFilter, setMissionFilter] = useState<'all' | 'active' | 'completed' | 'rewards'>('all');
  const [qrDialog, setQrDialog] = useState<{
    open: boolean;
    missionId: number;
    title: string;
  }>({ open: false, missionId: 0, title: '' });

  useEffect(() => {
    if (account) {
      loginWithWallet();
    }
  }, [account]);

  useEffect(() => {
    checkBackendMode();
    fetchData();
  }, []);

  const checkBackendMode = async () => {
    try {
      const response = await fetch(`${API_BASE}/health`);
      if (response.ok) {
        const data = await response.json();
        setIsMockMode(data.mode !== 'production');
      }
    } catch (error) {
      console.error('Failed to check backend mode:', error);
    }
  };

  const loginWithWallet = async () => {
    if (!account) return;

    try {
      const response = await fetch(`${API_BASE}/api/login/wallet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ address: account.address }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      // Fetch passport after login
      fetchPassport();
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchMissions(), fetchPassport()]);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMissions = async (eventId?: string) => {
    try {
      // First, fetch all available events
      const eventsResponse = await fetch(`${API_BASE}/api/events`, {
        credentials: 'include',
      });

      if (!eventsResponse.ok) {
        throw new Error('Failed to fetch events');
      }

      const eventsData = await eventsResponse.json();
      const allEvents = eventsData.events || [];

      // Filter events to only include those from the current package deployment
      const compatibleEvents = allEvents.filter((event: any) => {
        // Require objectType and PACKAGE_ID to be present
        if (!event.objectType) {
          console.log(`Filtered out event without type info: ${event.name}`);
          return false;
        }
        if (!PACKAGE_ID) {
          console.warn('PACKAGE_ID not configured');
          return false;
        }

        const eventPackageId = event.objectType.split('::')[0];
        const isCompatible = eventPackageId === PACKAGE_ID;
        if (!isCompatible) {
          console.log(`Filtered out incompatible event: ${event.name} (package: ${eventPackageId}, expected: ${PACKAGE_ID})`);
        }
        return isCompatible;
      });

      setAvailableEvents(compatibleEvents);

      if (compatibleEvents.length === 0) {
        console.warn('No compatible events available');
        setMissions([]);
        setEvent(null);
        return;
      }

      // Use provided eventId, or the selected one, or the first event (newest)
      const targetEventId = eventId || selectedEventId || compatibleEvents[0].id;
      setSelectedEventId(targetEventId);

      console.log('Using event:', targetEventId);
      console.log('Available compatible events:', compatibleEvents.map((e: any) => ({ id: e.id, name: e.name })));

      // Fetch missions for the selected event
      const response = await fetch(`${API_BASE}/api/missions?eventId=${targetEventId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch missions');
      }

      const data = await response.json();
      setMissions(data.missions || []);
      setEvent(data.event || null);
    } catch (error) {
      console.error('Failed to fetch missions:', error);
      toast.error('Failed to load missions');
    }
  };

  const fetchPassport = async () => {
    if (!account) {
      setPassport(null);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/passport`, {
        credentials: 'include',
      });

      if (!response.ok) {
        // Don't reset passport state if we already have one
        // (might be indexing delay)
        setPassport((prev) => prev || {
          hasPassport: false,
          passportId: null,
          attestations: [],
          totalRewards: 0,
        });
        return;
      }

      const data = await response.json();

      // Only update if we got valid passport data OR if we don't have a passport yet
      if (data.hasPassport || !passport?.hasPassport) {
        setPassport(data);
      }
    } catch (error) {
      console.error('Failed to fetch passport:', error);
      // Preserve existing passport state on error
      if (!passport) {
        setPassport(null);
      }
    }
  };

  const handleRegisterPassport = async () => {
    if (!account) {
      toast.error('Please connect your wallet');
      return;
    }

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

      // Update passport state immediately with the new passportId
      setPassport({
        hasPassport: true,
        passportId: data.passportId,
        attestations: [],
        totalRewards: 0,
      });

      // Poll for passport data with retries (blockchain indexing takes time)
      let retries = 0;
      const maxRetries = 5;
      const pollInterval = setInterval(async () => {
        retries++;

        try {
          const response = await fetch(`${API_BASE}/api/passport`, {
            credentials: 'include',
          });

          if (response.ok) {
            const passportData = await response.json();
            if (passportData.hasPassport && passportData.passportId) {
              setPassport(passportData);
              clearInterval(pollInterval);
            }
          }
        } catch (err) {
          console.error('Failed to poll passport:', err);
        }

        if (retries >= maxRetries) {
          clearInterval(pollInterval);
        }
      }, 2000); // Check every 2 seconds
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Failed to register passport');
    }
  };

  const handleViewQR = (missionId: number) => {
    const mission = missions.find((m) => m.missionId === missionId);
    if (mission) {
      setQrDialog({
        open: true,
        missionId,
        title: mission.title,
      });
    }
  };

  const handleClaim = async (missionId: number) => {
    if (!account) {
      toast.error('Please connect your wallet');
      return;
    }

    // Use selectedEventId, NOT DEFAULT_EVENT_ID
    const eventIdToUse = selectedEventId || DEFAULT_EVENT_ID;

    console.log('🎯 [CLAIM DEBUG] Starting claim process');
    console.log('🎯 Mission ID:', missionId);
    console.log('🎯 Selected Event ID:', selectedEventId);
    console.log('🎯 DEFAULT_EVENT_ID from env:', DEFAULT_EVENT_ID);
    console.log('🎯 Event ID being used for claim:', eventIdToUse);
    console.log('🎯 Current event object:', event);

    setClaiming(missionId);

    try {
      // For demo: Generate QR token first
      console.log(`🎯 Fetching QR token for mission ${missionId} from event ${eventIdToUse}`);
      const qrResponse = await fetch(
        `${API_BASE}/api/missions/${missionId}/qr?eventId=${eventIdToUse}`
      );

      if (!qrResponse.ok) {
        throw new Error('Failed to generate QR token');
      }

      const qrData = await qrResponse.json();
      console.log('🎯 QR token generated successfully');

      // Claim mission
      console.log('🎯 Sending claim request with:', {
        eventId: eventIdToUse,
        missionId,
        hasQRToken: !!qrData.token
      });

      const response = await fetch(`${API_BASE}/api/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          eventId: eventIdToUse,
          missionId,
          qrToken: qrData.token,
          autoRegisterPassport: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Claim failed');
      }

      const result = await response.json();

      // Check if transaction needs signature
      if (result.needsSignature && result.txBytes) {
        toast.loading('Please sign the transaction in your wallet...');

        // Sign transaction with user's wallet
        const signResult = await signTransaction({
          transaction: result.txBytes,
        });

        // Extract user signature (first signature only)
        const userSignature = Array.isArray(signResult.signature)
          ? signResult.signature[0]
          : signResult.signature;

        // Execute signed transaction
        const executeResponse = await fetch(`${API_BASE}/api/claim/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            signedTxBytes: result.txBytes,
            signature: userSignature,
          }),
        });

        if (!executeResponse.ok) {
          const error = await executeResponse.json();
          throw new Error(error.error || 'Transaction execution failed');
        }

        const executeData = await executeResponse.json();
        toast.success(
          executeData.digest
            ? `Mission claimed! TX: ${executeData.digest.slice(0, 10)}...`
            : 'Mission claimed successfully!'
        );
      } else if (result.mock) {
        toast.success('Mission claimed! (Mock mode - no blockchain transaction)');
      } else if (result.digest) {
        toast.success(`Mission claimed! TX: ${result.digest.slice(0, 10)}...`);
      }

      // Update mission status
      setMissions((prev) =>
        prev.map((m) => (m.missionId === missionId ? { ...m, completed: true } : m))
      );

      // Refresh passport
      await fetchPassport();
    } catch (error: any) {
      console.error('Claim error:', error);
      toast.error(error.message || 'Failed to claim mission');
    } finally {
      setClaiming(null);
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

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 pb-24 md:pb-12 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-white">Missions</h1>
          {availableEvents.length > 1 && (
            <Select
              value={selectedEventId || undefined}
              onValueChange={(value) => {
                setSelectedEventId(value);
                fetchMissions(value);
              }}
            >
              <SelectTrigger className="w-[280px] bg-slate-900/60 border-slate-700 text-white">
                <SelectValue placeholder="Select an event" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                {availableEvents.map((evt: any) => (
                  <SelectItem key={evt.id} value={evt.id} className="text-white">
                    <div className="flex flex-col">
                      <span className="font-medium">{evt.name}</span>
                      <span className="text-xs text-slate-400">
                        {evt.id.slice(0, 8)}...{evt.id.slice(-6)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <p className="text-sm text-slate-400">
          Complete missions to earn SUI rewards. All transactions are gasless!
        </p>
      </div>

      {/* Event Info Banner */}
      {event && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-900/40 via-cyan-900/40 to-indigo-900/40 border border-sky-700/50 p-5 shadow-lg shadow-sky-500/10">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-cyan-500/5 to-indigo-500/10" />
          <div className="relative z-10">
            <h2 className="text-xl font-bold text-white mb-1.5">{event.name}</h2>
            <p className="text-sm text-slate-300 mb-3">{event.description}</p>
            <div className="flex flex-wrap gap-3 text-xs">
              <span className="px-3 py-1.5 bg-slate-900/60 backdrop-blur-sm rounded-full text-slate-300 border border-slate-700/50">
                📅 Start: {new Date(event.startTime).toLocaleDateString()}
              </span>
              <span className="px-3 py-1.5 bg-slate-900/60 backdrop-blur-sm rounded-full text-slate-300 border border-slate-700/50">
                📅 End: {new Date(event.endTime).toLocaleDateString()}
              </span>
              <span
                className={`px-3 py-1.5 backdrop-blur-sm rounded-full font-medium border ${
                  event.active
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                    : 'bg-red-500/20 text-red-300 border-red-500/50'
                }`}
              >
                {event.active ? '✅ Active' : '❌ Inactive'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Info Alert - Demo Mode */}
      {isMockMode && (
        <div className="rounded-2xl bg-blue-500/10 border border-blue-500/30 p-4">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-slate-300">
              <span className="font-semibold text-blue-300">Demo Mode:</span> Backend is running in
              mock mode. Connect your wallet and click "Claim Reward" to simulate the gasless
              transaction flow.
            </div>
          </div>
        </div>
      )}

      {/* Wallet Connection Alert */}
      {!account && (
        <div className="rounded-2xl bg-yellow-500/10 border border-yellow-500/30 p-4">
          <div className="flex gap-3">
            <Wallet className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-200 font-medium">
              Connect your wallet to view and claim missions
            </div>
          </div>
        </div>
      )}

      {/* Passport Section */}
      {account && passport && (
        <div>
          {!passport.hasPassport ? (
            <div className="rounded-2xl bg-sky-500/10 border border-sky-500/30 p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex gap-3 flex-1">
                  <AlertCircle className="h-5 w-5 text-sky-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-slate-300">
                    You don't have a passport yet. Register to start earning rewards!
                  </div>
                </div>
                <Button
                  onClick={handleRegisterPassport}
                  className="rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-white font-semibold shadow-lg shadow-sky-500/30 whitespace-nowrap"
                >
                  Register Passport
                </Button>
              </div>
            </div>
          ) : (
            <PassportCard
              passportId={passport.passportId!}
              attestations={passport.attestations}
              totalRewards={passport.totalRewards}
            />
          )}
        </div>
      )}

      {/* Missions Section */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-bold text-white">Available Missions</h2>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setMissionFilter('all')}
            className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all ${
              missionFilter === 'all'
                ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-lg shadow-sky-500/30'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-300 border border-slate-700'
            }`}
          >
            All Missions
          </button>
          <button
            onClick={() => setMissionFilter('active')}
            className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all ${
              missionFilter === 'active'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-300 border border-slate-700'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setMissionFilter('completed')}
            className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all ${
              missionFilter === 'completed'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-300 border border-slate-700'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setMissionFilter('rewards')}
            className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all ${
              missionFilter === 'rewards'
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-300 border border-slate-700'
            }`}
          >
            Rewards
          </button>
        </div>

        {missions.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-slate-600" />
            </div>
            <p className="text-sm text-slate-500">No missions available yet</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {missions
              .filter((mission) => {
                if (missionFilter === 'all') return true;
                if (missionFilter === 'active') return mission.active && !mission.completed;
                if (missionFilter === 'completed') return mission.completed;
                if (missionFilter === 'rewards') return mission.rewardAmount > 0;
                return true;
              })
              .map((mission) => (
                <MissionCard
                  key={mission.missionId}
                  mission={mission}
                  onClaim={handleClaim}
                  onViewQR={handleViewQR}
                  claiming={claiming === mission.missionId}
                />
              ))}
          </div>
        )}
      </div>

      {/* QR Dialog */}
      <QRDialog
        open={qrDialog.open}
        onClose={() => setQrDialog({ ...qrDialog, open: false })}
        eventId={DEFAULT_EVENT_ID}
        missionId={qrDialog.missionId}
        missionTitle={qrDialog.title}
      />
    </div>
  );
}
