/**
 * MODULE 7 - Admin Page
 *
 * Event management for organizers
 * Create events, missions, fund grant pools
 */

import { useState, useEffect } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Shield, Plus, Loader2, CheckCircle2, AlertCircle, Wallet, Eye, Coins } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';
const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID;

export function AdminPage() {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [funding, setFunding] = useState(false);
  const [creatingMission, setCreatingMission] = useState(false);
  const [loadingEventDetails, setLoadingEventDetails] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingAdminCaps, setLoadingAdminCaps] = useState(false);
  const [availableEvents, setAvailableEvents] = useState<any[]>([]);
  const [adminCaps, setAdminCaps] = useState<any[]>([]);

  // Event form
  const [eventForm, setEventForm] = useState({
    name: '',
    description: '',
    initialFunding: '0.3', // SUI
  });

  // Mission form
  const [missionForm, setMissionForm] = useState({
    eventId: '',
    adminCapId: '',
    title: '',
    description: '',
    rewardAmount: '0.05', // SUI
  });

  // Fund event form
  const [fundForm, setFundForm] = useState({
    eventId: '',
    amount: '0.2', // SUI
  });

  // View event details form
  const [viewEventId, setViewEventId] = useState('');
  const [eventDetails, setEventDetails] = useState<any>(null);

  // Created event IDs
  const [createdEvent, setCreatedEvent] = useState<{
    eventId: string;
    adminCapId: string;
  } | null>(null);

  useEffect(() => {
    if (!account) {
      navigate('/login');
    } else {
      fetchAvailableEvents();
      fetchAdminCaps();
    }
  }, [account, navigate]);

  const fetchAvailableEvents = async () => {
    setLoadingEvents(true);
    try {
      const response = await fetch(`${API_BASE}/api/events`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const allEvents = data.events || [];

        // Filter events to only include those from the current package deployment
        const compatibleEvents = allEvents.filter((event: any) => {
          // Require objectType and PACKAGE_ID to be present
          if (!event.objectType) {
            console.log(`[Admin] Filtered out event without type info: ${event.name}`);
            return false;
          }
          if (!PACKAGE_ID) {
            console.warn('[Admin] PACKAGE_ID not configured');
            return false;
          }

          const eventPackageId = event.objectType.split('::')[0];
          const isCompatible = eventPackageId === PACKAGE_ID;
          if (!isCompatible) {
            console.log(`[Admin] Filtered out incompatible event: ${event.name} (package: ${eventPackageId}, expected: ${PACKAGE_ID})`);
          }
          return isCompatible;
        });

        setAvailableEvents(compatibleEvents);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchAdminCaps = async () => {
    if (!account?.address) return;

    setLoadingAdminCaps(true);
    try {
      const packageId = import.meta.env.VITE_PACKAGE_ID;
      if (!packageId) {
        console.warn('VITE_PACKAGE_ID not set');
        return;
      }

      // Fetch all objects owned by the user
      const ownedObjects = await suiClient.getOwnedObjects({
        owner: account.address,
        filter: {
          StructType: `${packageId}::event::EventAdminCap`,
        },
        options: {
          showContent: true,
          showType: true,
        },
      });

      const caps = ownedObjects.data
        .map((obj: any) => {
          const content = obj.data?.content as any;
          const fields = content?.fields;
          if (!fields) return null;

          return {
            id: obj.data.objectId,
            eventId: fields.event_id,
          };
        })
        .filter((cap: any) => cap !== null);

      setAdminCaps(caps);
    } catch (error) {
      console.error('Failed to fetch admin caps:', error);
    } finally {
      setLoadingAdminCaps(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const response = await fetch(`${API_BASE}/api/admin/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: eventForm.name,
          description: eventForm.description,
          startTime: Date.now(),
          endTime: Date.now() + 86400000 * 7, // +7 days
          initialFunding: parseFloat(eventForm.initialFunding) * 1_000_000_000,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create event');
      }

      const data = await response.json();

      setCreatedEvent({
        eventId: data.eventId,
        adminCapId: data.adminCapId,
      });

      setMissionForm({
        ...missionForm,
        eventId: data.eventId,
        adminCapId: data.adminCapId,
      });

      toast.success('Event created successfully!');

      // Refresh events list and admin caps
      fetchAvailableEvents();
      // Wait a bit for blockchain to sync, then fetch admin caps
      setTimeout(() => {
        fetchAdminCaps();
      }, 2000);
    } catch (error: any) {
      console.error('Event creation error:', error);
      toast.error(error.message || 'Failed to create event');
    } finally {
      setCreating(false);
    }
  };

  const handleCreateMission = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingMission(true);

    try {
      const response = await fetch(`${API_BASE}/api/admin/missions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          eventId: missionForm.eventId,
          adminCapId: missionForm.adminCapId,
          title: missionForm.title,
          description: missionForm.description,
          rewardAmount: parseFloat(missionForm.rewardAmount) * 1_000_000_000,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create mission');
      }

      const data = await response.json();

      toast.success(`Mission created! ID: ${data.missionId}`);

      // Reset mission form
      setMissionForm({
        ...missionForm,
        title: '',
        description: '',
        rewardAmount: '0.1',
      });
    } catch (error: any) {
      console.error('Mission creation error:', error);
      toast.error(error.message || 'Failed to create mission');
    } finally {
      setCreatingMission(false);
    }
  };

  const handleFundEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFunding(true);

    try {
      const response = await fetch(`${API_BASE}/api/admin/fund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          eventId: fundForm.eventId,
          amount: parseFloat(fundForm.amount) * 1_000_000_000,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fund event');
      }

      const data = await response.json();

      toast.success(`Event funded with ${fundForm.amount} SUI!`);
      console.log('Fund transaction:', data.digest);

      // Refresh event details if viewing same event
      if (viewEventId === fundForm.eventId) {
        handleViewEventDetails();
      }
    } catch (error: any) {
      console.error('Event funding error:', error);
      toast.error(error.message || 'Failed to fund event');
    } finally {
      setFunding(false);
    }
  };

  const handleViewEventDetails = async () => {
    if (!viewEventId) {
      toast.error('Please enter an Event ID');
      return;
    }

    setLoadingEventDetails(true);
    setEventDetails(null);

    try {
      const response = await fetch(`${API_BASE}/api/events/${viewEventId}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch event details');
      }

      const data = await response.json();
      setEventDetails(data);
      toast.success('Event details loaded!');
    } catch (error: any) {
      console.error('Event details error:', error);
      toast.error(error.message || 'Failed to load event details');
    } finally {
      setLoadingEventDetails(false);
    }
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 pb-24 md:pb-12 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-2xl shadow-lg shadow-sky-500/30">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
        </div>
        <p className="text-sm text-slate-400">
          Manage events, create missions, and fund grant pools
        </p>
      </div>

      <div className="rounded-2xl bg-sky-500/10 border border-sky-500/30 p-4">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-sky-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-slate-300">
            <span className="font-semibold text-sky-300">Admin Access:</span> This panel allows you to create hackathon events and
            missions. All transactions are sponsored (gasless).
          </div>
        </div>
      </div>

      {/* Create Event */}
      <div className="rounded-3xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-xl">
        <div className="bg-gradient-to-r from-sky-900/40 to-indigo-900/40 border-b border-sky-700/50 p-5">
          <div className="flex items-center gap-2 mb-1.5">
            <Plus className="h-5 w-5 text-sky-400" />
            <h2 className="text-xl font-semibold text-white">Create New Event</h2>
          </div>
          <p className="text-sm text-slate-400">
            Initialize a new hackathon event with initial grant pool funding
          </p>
        </div>
        <div className="p-6">
          <form onSubmit={handleCreateEvent} className="space-y-5">
            <div>
              <Label htmlFor="eventName" className="text-sm font-medium text-slate-300">Event Name</Label>
              <Input
                id="eventName"
                placeholder="SUI Hackathon 2025"
                value={eventForm.name}
                onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                required
                className="mt-1.5 rounded-xl bg-slate-950/60 border-slate-700 focus:border-sky-500 text-white placeholder:text-slate-500"
              />
            </div>

            <div>
              <Label htmlFor="eventDescription" className="text-sm font-medium text-slate-300">Description</Label>
              <Textarea
                id="eventDescription"
                placeholder="Build on SUI blockchain..."
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                required
                className="mt-1.5 rounded-xl bg-slate-950/60 border-slate-700 focus:border-sky-500 text-white placeholder:text-slate-500"
              />
            </div>

            <div>
              <Label htmlFor="initialFunding" className="text-sm font-medium text-slate-300">Initial Funding (SUI)</Label>
              <Input
                id="initialFunding"
                type="number"
                step="0.01"
                placeholder="0.3"
                value={eventForm.initialFunding}
                onChange={(e) => setEventForm({ ...eventForm, initialFunding: e.target.value })}
                required
                className="mt-1.5 rounded-xl bg-slate-950/60 border-slate-700 focus:border-sky-500 text-white placeholder:text-slate-500"
              />
              <p className="text-xs text-slate-500 mt-2">
                Total SUI to allocate for mission rewards (max 0.5 with current balance)
              </p>
            </div>

            <Button type="submit" disabled={creating} className="w-full gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-white font-semibold shadow-lg shadow-sky-500/30">
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Event...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create Event
                </>
              )}
            </Button>
          </form>

          {createdEvent && (
            <div className="mt-5 space-y-3">
              <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4">
                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-slate-300">
                    <span className="font-semibold text-emerald-300 block mb-2">Event Created Successfully!</span>
                    <div className="space-y-2 font-mono text-xs">
                      <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800">
                        <div className="text-slate-400 mb-1">Event ID:</div>
                        <div className="text-sky-300 break-all">{createdEvent.eventId}</div>
                      </div>
                      <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800">
                        <div className="text-slate-400 mb-1">Admin Cap ID:</div>
                        <div className="text-sky-300 break-all">{createdEvent.adminCapId}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl bg-sky-500/10 border border-sky-500/30 p-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-sky-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-slate-300">
                    <span className="font-semibold text-sky-300">Next Step:</span> Use these IDs below to create missions. The form has been auto-filled for you!
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Mission */}
      <div className="rounded-3xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-xl">
        <div className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border-b border-indigo-700/50 p-5">
          <div className="flex items-center gap-2 mb-1.5">
            <Plus className="h-5 w-5 text-indigo-400" />
            <h2 className="text-xl font-semibold text-white">Create Mission</h2>
          </div>
          <p className="text-sm text-slate-400">
            Add a new mission to an existing event
          </p>
        </div>
        <div className="p-6">
          <form onSubmit={handleCreateMission} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <Label htmlFor="missionEventId" className="text-sm font-medium text-slate-300">Select Event</Label>
                {loadingEvents ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                  </div>
                ) : availableEvents.length > 0 ? (
                  <Select
                    value={missionForm.eventId}
                    onValueChange={(value) => {
                      // Find matching admin cap for this event
                      const matchingCap = adminCaps.find((cap) => cap.eventId === value);
                      setMissionForm({
                        ...missionForm,
                        eventId: value,
                        adminCapId: matchingCap?.id || ''
                      });
                    }}
                  >
                    <SelectTrigger className="mt-1.5 rounded-xl bg-slate-950/60 border-slate-700 text-white">
                      <SelectValue placeholder="Select an event" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      {availableEvents.map((event) => (
                        <SelectItem key={event.id} value={event.id} className="text-white">
                          <div className="flex flex-col">
                            <span className="font-medium">{event.name}</span>
                            <span className="text-xs text-slate-400 font-mono">
                              {event.id.slice(0, 10)}...{event.id.slice(-8)}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="missionEventId"
                    placeholder="0x... (No events found - enter manually)"
                    value={missionForm.eventId}
                    onChange={(e) => setMissionForm({ ...missionForm, eventId: e.target.value })}
                    required
                    className="mt-1.5 rounded-xl bg-slate-950/60 border-slate-700 focus:border-indigo-500 text-white placeholder:text-slate-500 font-mono text-sm"
                  />
                )}
              </div>

              <div>
                <Label htmlFor="missionAdminCap" className="text-sm font-medium text-slate-300">
                  Admin Cap ID
                  {missionForm.adminCapId && (
                    <span className="ml-2 text-xs text-emerald-400">✓ Auto-filled</span>
                  )}
                  {missionForm.eventId && !missionForm.adminCapId && (
                    <span className="ml-2 text-xs text-amber-400">⚠ Not found in wallet</span>
                  )}
                </Label>
                <Input
                  id="missionAdminCap"
                  placeholder="0x... (auto-filled if found)"
                  value={missionForm.adminCapId}
                  onChange={(e) =>
                    setMissionForm({ ...missionForm, adminCapId: e.target.value })
                  }
                  required
                  className="mt-1.5 rounded-xl bg-slate-950/60 border-slate-700 focus:border-indigo-500 text-white placeholder:text-slate-500 font-mono text-sm"
                />
                {missionForm.eventId && !missionForm.adminCapId && (
                  <p className="text-xs text-slate-500 mt-2">
                    Admin Cap not found in your wallet. Copy it from the event creation success message.
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="missionTitle" className="text-sm font-medium text-slate-300">Mission Title</Label>
              <Input
                id="missionTitle"
                placeholder="Check-in at Hackathon"
                value={missionForm.title}
                onChange={(e) => setMissionForm({ ...missionForm, title: e.target.value })}
                required
                className="mt-1.5 rounded-xl bg-slate-950/60 border-slate-700 focus:border-indigo-500 text-white placeholder:text-slate-500"
              />
            </div>

            <div>
              <Label htmlFor="missionDescription" className="text-sm font-medium text-slate-300">Mission Description</Label>
              <Textarea
                id="missionDescription"
                placeholder="Scan QR at entrance..."
                value={missionForm.description}
                onChange={(e) => setMissionForm({ ...missionForm, description: e.target.value })}
                required
                className="mt-1.5 rounded-xl bg-slate-950/60 border-slate-700 focus:border-indigo-500 text-white placeholder:text-slate-500"
              />
            </div>

            <div>
              <Label htmlFor="rewardAmount" className="text-sm font-medium text-slate-300">Reward Amount (SUI)</Label>
              <Input
                id="rewardAmount"
                type="number"
                step="0.01"
                placeholder="0.05"
                value={missionForm.rewardAmount}
                onChange={(e) =>
                  setMissionForm({ ...missionForm, rewardAmount: e.target.value })
                }
                required
                className="mt-1.5 rounded-xl bg-slate-950/60 border-slate-700 focus:border-indigo-500 text-white placeholder:text-slate-500"
              />
              <p className="text-xs text-slate-500 mt-2">
                SUI reward per mission completion
              </p>
            </div>

            <Button type="submit" disabled={creatingMission} className="w-full gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white font-semibold shadow-lg shadow-indigo-500/30">
              {creatingMission ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Mission...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create Mission
                </>
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* Fund Event */}
      <div className="rounded-3xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-xl">
        <div className="bg-gradient-to-r from-emerald-900/40 to-teal-900/40 border-b border-emerald-700/50 p-5">
          <div className="flex items-center gap-2 mb-1.5">
            <Wallet className="h-5 w-5 text-emerald-400" />
            <h2 className="text-xl font-semibold text-white">Fund Event Grant Pool</h2>
          </div>
          <p className="text-sm text-slate-400">
            Add more SUI to an event's grant pool for mission rewards
          </p>
        </div>
        <div className="p-6">
          <form onSubmit={handleFundEvent} className="space-y-5">
            <div>
              <Label htmlFor="fundEventId" className="text-sm font-medium text-slate-300">Select Event</Label>
              {loadingEvents ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                </div>
              ) : availableEvents.length > 0 ? (
                <Select
                  value={fundForm.eventId}
                  onValueChange={(value) => setFundForm({ ...fundForm, eventId: value })}
                >
                  <SelectTrigger className="mt-1.5 rounded-xl bg-slate-950/60 border-slate-700 text-white">
                    <SelectValue placeholder="Select an event" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {availableEvents.map((event) => (
                      <SelectItem key={event.id} value={event.id} className="text-white">
                        <div className="flex flex-col">
                          <span className="font-medium">{event.name}</span>
                          <span className="text-xs text-slate-400 font-mono">
                            {event.id.slice(0, 10)}...{event.id.slice(-8)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="fundEventId"
                  placeholder="0x... (No events found - enter manually)"
                  value={fundForm.eventId}
                  onChange={(e) => setFundForm({ ...fundForm, eventId: e.target.value })}
                  required
                  className="mt-1.5 rounded-xl bg-slate-950/60 border-slate-700 focus:border-emerald-500 text-white placeholder:text-slate-500 font-mono text-sm"
                />
              )}
            </div>

            <div>
              <Label htmlFor="fundAmount" className="text-sm font-medium text-slate-300">Amount (SUI)</Label>
              <Input
                id="fundAmount"
                type="number"
                step="0.01"
                placeholder="0.2"
                value={fundForm.amount}
                onChange={(e) => setFundForm({ ...fundForm, amount: e.target.value })}
                required
                className="mt-1.5 rounded-xl bg-slate-950/60 border-slate-700 focus:border-emerald-500 text-white placeholder:text-slate-500"
              />
              <p className="text-xs text-slate-500 mt-2">
                Additional SUI to add to the grant pool (max 0.5 with current balance)
              </p>
            </div>

            <Button type="submit" disabled={funding} className="w-full gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold shadow-lg shadow-emerald-500/30">
              {funding ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Funding Event...
                </>
              ) : (
                <>
                  <Wallet className="h-4 w-4" />
                  Fund Event
                </>
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* View Event Details */}
      <div className="rounded-3xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-xl">
        <div className="bg-gradient-to-r from-cyan-900/40 to-sky-900/40 border-b border-cyan-700/50 p-5">
          <div className="flex items-center gap-2 mb-1.5">
            <Eye className="h-5 w-5 text-cyan-400" />
            <h2 className="text-xl font-semibold text-white">View Event Details</h2>
          </div>
          <p className="text-sm text-slate-400">
            Check event grant pool balance and mission information
          </p>
        </div>
        <div className="p-6">
          <div className="space-y-5">
            <div>
              <Label htmlFor="viewEventId" className="text-sm font-medium text-slate-300">Select Event</Label>
              {loadingEvents ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                </div>
              ) : availableEvents.length > 0 ? (
                <div className="flex gap-2 mt-1.5">
                  <div className="flex-1">
                    <Select
                      value={viewEventId}
                      onValueChange={(value) => setViewEventId(value)}
                    >
                      <SelectTrigger className="rounded-xl bg-slate-950/60 border-slate-700 text-white">
                        <SelectValue placeholder="Select an event" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700">
                        {availableEvents.map((event) => (
                          <SelectItem key={event.id} value={event.id} className="text-white">
                            <div className="flex flex-col">
                              <span className="font-medium">{event.name}</span>
                              <span className="text-xs text-emerald-400 font-mono">
                                Balance: {(event.grantPoolBalance / 1_000_000_000).toFixed(4)} SUI
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleViewEventDetails}
                    disabled={loadingEventDetails || !viewEventId}
                    className="gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 shadow-lg shadow-cyan-500/30"
                  >
                    {loadingEventDetails ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4" />
                        View Details
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2 mt-1.5">
                  <div className="flex-1">
                    <Input
                      id="viewEventId"
                      placeholder="0x... (No events found - enter manually)"
                      value={viewEventId}
                      onChange={(e) => setViewEventId(e.target.value)}
                      className="rounded-xl bg-slate-950/60 border-slate-700 focus:border-cyan-500 text-white placeholder:text-slate-500 font-mono text-sm"
                    />
                  </div>
                  <Button
                    onClick={handleViewEventDetails}
                    disabled={loadingEventDetails || !viewEventId}
                    className="gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 shadow-lg shadow-cyan-500/30"
                  >
                    {loadingEventDetails ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4" />
                        View Details
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            {eventDetails && (
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl bg-sky-500/10 border border-sky-500/30 p-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <div className="text-xs text-slate-400 mb-1">Event Name</div>
                      <div className="text-lg font-semibold text-white">{eventDetails.event?.name || eventDetails.name}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 mb-1">Grant Pool Balance</div>
                      <div className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                        {((eventDetails.event?.grantPoolBalance || eventDetails.grantPoolBalance || 0) / 1_000_000_000).toFixed(4)} SUI
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 mb-1">Total Missions</div>
                      <div className="text-lg font-semibold text-white">{eventDetails.event?.totalMissions || eventDetails.totalMissions || 0}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 mb-1">Status</div>
                      <div className="text-lg font-semibold">
                        {(eventDetails.event?.active || eventDetails.active) ?
                          <span className="text-emerald-400">✓ Active</span> :
                          <span className="text-red-400">✗ Inactive</span>
                        }
                      </div>
                    </div>
                  </div>
                </div>

                {eventDetails.missions && eventDetails.missions.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <span className="text-lg">Missions</span>
                      <span className="px-2 py-0.5 bg-sky-500/20 rounded-full text-xs text-sky-300">{eventDetails.missions.length}</span>
                    </h3>
                    <div className="space-y-3">
                      {eventDetails.missions.map((mission: any, index: number) => (
                        <div key={index} className="rounded-2xl bg-slate-800/40 border border-slate-700 p-4 hover:border-sky-700/50 transition-colors">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <span className="text-sm font-semibold text-sky-400">Mission {mission.missionId}</span>
                                <h4 className="text-base font-bold text-white mt-0.5">{mission.title}</h4>
                                <p className="text-sm text-slate-400 mt-1">{mission.description}</p>
                              </div>
                              {mission.active ?
                                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-semibold whitespace-nowrap">Active</span> :
                                <span className="px-2.5 py-1 bg-slate-700/40 text-slate-400 border border-slate-600 rounded-full text-xs font-semibold whitespace-nowrap">Inactive</span>
                              }
                            </div>
                            <div className="flex gap-4 text-sm">
                              <div className="flex items-center gap-1.5">
                                <Coins className="h-4 w-4 text-emerald-400" />
                                <span className="text-slate-400">Reward:</span>
                                <span className="font-semibold text-emerald-300">
                                  {(mission.rewardAmount / 1_000_000_000).toFixed(4)} SUI
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <CheckCircle2 className="h-4 w-4 text-sky-400" />
                                <span className="text-slate-400">Completions:</span>
                                <span className="font-semibold text-white">{mission.completions}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
