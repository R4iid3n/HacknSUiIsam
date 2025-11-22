/**
 * MODULE 7 - Admin Page
 *
 * Event management for organizers
 * Create events, missions, fund grant pools
 */

import { useState, useEffect } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Shield, Plus, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

export function AdminPage() {
  const account = useCurrentAccount();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  // const [funding, setFunding] = useState(false);
  const [creatingMission, setCreatingMission] = useState(false);

  // Event form
  const [eventForm, setEventForm] = useState({
    name: '',
    description: '',
    initialFunding: '10', // SUI
  });

  // Mission form
  const [missionForm, setMissionForm] = useState({
    eventId: '',
    adminCapId: '',
    title: '',
    description: '',
    rewardAmount: '0.1', // SUI
  });

  // Created event IDs
  const [createdEvent, setCreatedEvent] = useState<{
    eventId: string;
    adminCapId: string;
  } | null>(null);

  useEffect(() => {
    if (!account) {
      navigate('/login');
    }
  }, [account, navigate]);

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

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Admin Panel</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Manage events, create missions, and fund grant pools
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Admin Access:</strong> This panel allows you to create hackathon events and
          missions. All transactions are sponsored (gasless).
        </AlertDescription>
      </Alert>

      {/* Create Event */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Event
          </CardTitle>
          <CardDescription>
            Initialize a new hackathon event with initial grant pool funding
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateEvent} className="space-y-4">
            <div>
              <Label htmlFor="eventName">Event Name</Label>
              <Input
                id="eventName"
                placeholder="SUI Hackathon 2025"
                value={eventForm.name}
                onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="eventDescription">Description</Label>
              <Textarea
                id="eventDescription"
                placeholder="Build on SUI blockchain..."
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="initialFunding">Initial Funding (SUI)</Label>
              <Input
                id="initialFunding"
                type="number"
                step="0.01"
                placeholder="10"
                value={eventForm.initialFunding}
                onChange={(e) => setEventForm({ ...eventForm, initialFunding: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Total SUI to allocate for mission rewards
              </p>
            </div>

            <Button type="submit" disabled={creating} className="w-full gap-2">
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
            <Alert className="mt-4 bg-green-500/10 border-green-500/20">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <strong>Event Created!</strong>
                <br />
                Event ID: <code className="text-xs">{createdEvent.eventId}</code>
                <br />
                Admin Cap: <code className="text-xs">{createdEvent.adminCapId}</code>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Create Mission */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create Mission
          </CardTitle>
          <CardDescription>
            Add a new mission to an existing event
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateMission} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="missionEventId">Event ID</Label>
                <Input
                  id="missionEventId"
                  placeholder="0x..."
                  value={missionForm.eventId}
                  onChange={(e) => setMissionForm({ ...missionForm, eventId: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="missionAdminCap">Admin Cap ID</Label>
                <Input
                  id="missionAdminCap"
                  placeholder="0x..."
                  value={missionForm.adminCapId}
                  onChange={(e) =>
                    setMissionForm({ ...missionForm, adminCapId: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="missionTitle">Mission Title</Label>
              <Input
                id="missionTitle"
                placeholder="Check-in at Hackathon"
                value={missionForm.title}
                onChange={(e) => setMissionForm({ ...missionForm, title: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="missionDescription">Mission Description</Label>
              <Textarea
                id="missionDescription"
                placeholder="Scan QR at entrance..."
                value={missionForm.description}
                onChange={(e) => setMissionForm({ ...missionForm, description: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="rewardAmount">Reward Amount (SUI)</Label>
              <Input
                id="rewardAmount"
                type="number"
                step="0.01"
                placeholder="0.1"
                value={missionForm.rewardAmount}
                onChange={(e) =>
                  setMissionForm({ ...missionForm, rewardAmount: e.target.value })
                }
                required
              />
            </div>

            <Button type="submit" disabled={creatingMission} className="w-full gap-2">
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
        </CardContent>
      </Card>
    </div>
  );
}
