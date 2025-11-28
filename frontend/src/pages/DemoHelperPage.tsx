/**
 * MODULE 8 - Demo Helper Page
 *
 * Pre-demo checklist and quick setup tools
 * Access at /demo-helper (hidden from main nav)
 */

import { useState, useEffect } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Rocket,
  Server,
  Wifi,
  Database,
  Users,
  QrCode as QrCodeIcon,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

interface ChecklistItem {
  id: string;
  label: string;
  status: 'pending' | 'success' | 'error';
  message?: string;
}

export function DemoHelperPage() {
  const account = useCurrentAccount();
  const [checking, setChecking] = useState(false);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: 'backend', label: 'Backend running', status: 'pending' },
    { id: 'network', label: 'Sui network reachable', status: 'pending' },
    { id: 'event', label: 'Demo event created', status: 'pending' },
    { id: 'missions', label: 'Missions created (2-3)', status: 'pending' },
    { id: 'passport', label: 'Test user passport', status: 'pending' },
  ]);

  useEffect(() => {
    runChecks();
  }, []);

  const runChecks = async () => {
    setChecking(true);

    const newChecklist = [...checklist];

    // Check 1: Backend
    try {
      const healthRes = await fetch(`${API_BASE}/health`);
      if (healthRes.ok) {
        const data = await healthRes.json();
        newChecklist[0] = {
          ...newChecklist[0],
          status: 'success',
          message: `Mode: ${data.mode} | Network: ${data.network}`,
        };
      } else {
        throw new Error('Health check failed');
      }
    } catch (error) {
      newChecklist[0] = {
        ...newChecklist[0],
        status: 'error',
        message: 'Backend not responding',
      };
    }

    // Check 2: Network (via backend health)
    if (newChecklist[0].status === 'success') {
      newChecklist[1] = {
        ...newChecklist[1],
        status: 'success',
        message: 'Network accessible',
      };
    } else {
      newChecklist[1] = {
        ...newChecklist[1],
        status: 'error',
        message: 'Cannot verify network',
      };
    }

    // Check 3: Event
    try {
      const eventId = import.meta.env.VITE_EVENT_ID;
      if (eventId && eventId !== '0x...') {
        newChecklist[2] = {
          ...newChecklist[2],
          status: 'success',
          message: `Event ID: ${eventId.slice(0, 10)}...`,
        };
      } else {
        newChecklist[2] = {
          ...newChecklist[2],
          status: 'error',
          message: 'VITE_EVENT_ID not configured',
        };
      }
    } catch (error) {
      newChecklist[2] = {
        ...newChecklist[2],
        status: 'error',
        message: 'Event check failed',
      };
    }

    // Check 4: Missions
    try {
      const eventId = import.meta.env.VITE_EVENT_ID;
      if (eventId) {
        const missionsRes = await fetch(`${API_BASE}/api/missions?eventId=${eventId}`, {
          credentials: 'include',
        });
        if (missionsRes.ok) {
          const data = await missionsRes.json();
          const count = data.missions?.length || 0;
          if (count >= 2) {
            newChecklist[3] = {
              ...newChecklist[3],
              status: 'success',
              message: `${count} missions found`,
            };
          } else {
            newChecklist[3] = {
              ...newChecklist[3],
              status: 'error',
              message: `Only ${count} mission(s) - need at least 2`,
            };
          }
        }
      }
    } catch (error) {
      newChecklist[3] = {
        ...newChecklist[3],
        status: 'error',
        message: 'Failed to fetch missions',
      };
    }

    // Check 5: Passport
    try {
      if (account) {
        const passportRes = await fetch(`${API_BASE}/api/passport`, {
          credentials: 'include',
        });
        if (passportRes.ok) {
          const data = await passportRes.json();
          if (data.hasPassport) {
            newChecklist[4] = {
              ...newChecklist[4],
              status: 'success',
              message: `${data.attestationCount} attestation(s)`,
            };
          } else {
            newChecklist[4] = {
              ...newChecklist[4],
              status: 'error',
              message: 'No passport registered',
            };
          }
        }
      } else {
        newChecklist[4] = {
          ...newChecklist[4],
          status: 'error',
          message: 'Wallet not connected',
        };
      }
    } catch (error) {
      newChecklist[4] = {
        ...newChecklist[4],
        status: 'error',
        message: 'Failed to check passport',
      };
    }

    setChecklist(newChecklist);
    setChecking(false);
  };

  const allPassing = checklist.every((item) => item.status === 'success');

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Rocket className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Demo Helper</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Pre-demo checklist and quick setup for hackathon judges
        </p>
      </div>

      {/* Overall Status */}
      {allPassing ? (
        <Alert className="bg-green-500/10 border-green-500/20">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <strong className="text-green-600">All checks passed!</strong> You're ready for the
            demo. 🎉
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="default">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Some checks failed. Review the checklist below and fix issues before the demo.
          </AlertDescription>
        </Alert>
      )}

      {/* Checklist */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pre-Demo Checklist</CardTitle>
              <CardDescription>
                Automated checks for demo readiness
              </CardDescription>
            </div>
            <Button onClick={runChecks} disabled={checking} variant="outline" size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
              Recheck
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {checklist.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between p-4 rounded-lg border bg-muted/30"
            >
              <div className="flex items-start gap-3">
                {item.status === 'success' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                ) : item.status === 'error' ? (
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                )}
                <div>
                  <p className="font-medium">{item.label}</p>
                  {item.message && (
                    <p className="text-sm text-muted-foreground mt-1">{item.message}</p>
                  )}
                </div>
              </div>
              <Badge
                variant={
                  item.status === 'success'
                    ? 'default'
                    : item.status === 'error'
                    ? 'destructive'
                    : 'secondary'
                }
              >
                {item.status}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
          <CardDescription>Essential pages for the demo</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Button variant="outline" className="justify-start gap-3" asChild>
            <a href="/dashboard">
              <Server className="h-4 w-4" />
              Dashboard
            </a>
          </Button>

          <Button variant="outline" className="justify-start gap-3" asChild>
            <a href="/scan">
              <QrCodeIcon className="h-4 w-4" />
              QR Scanner
            </a>
          </Button>

          <Button variant="outline" className="justify-start gap-3" asChild>
            <a href="/passport">
              <Users className="h-4 w-4" />
              My Passport
            </a>
          </Button>

          <Button variant="outline" className="justify-start gap-3" asChild>
            <a href="/admin">
              <Database className="h-4 w-4" />
              Admin Panel
            </a>
          </Button>

          <Button variant="outline" className="justify-start gap-3" asChild>
            <a href={`${API_BASE}/health`} target="_blank" rel="noopener noreferrer">
              <Wifi className="h-4 w-4" />
              Backend Health
              <ExternalLink className="h-3 w-3 ml-auto" />
            </a>
          </Button>

          <Button variant="outline" className="justify-start gap-3" asChild>
            <a
              href="https://suiscan.xyz/devnet/home"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4" />
              SUI Explorer
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Demo Tips */}
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardHeader>
          <CardTitle className="text-blue-600 dark:text-blue-400">Demo Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <div className="bg-blue-500/20 rounded-full p-1 mt-0.5">
              <div className="w-2 h-2 bg-blue-600 rounded-full" />
            </div>
            <p>
              <strong>Camera fails?</strong> Use the "Simulate Claim" button on the scan page
            </p>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-blue-500/20 rounded-full p-1 mt-0.5">
              <div className="w-2 h-2 bg-blue-600 rounded-full" />
            </div>
            <p>
              <strong>Network slow?</strong> Show a pre-completed attestation from the passport
              page
            </p>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-blue-500/20 rounded-full p-1 mt-0.5">
              <div className="w-2 h-2 bg-blue-600 rounded-full" />
            </div>
            <p>
              <strong>zkLogin issue?</strong> Use wallet connection and mention "authenticated via
              zkLogin"
            </p>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-blue-500/20 rounded-full p-1 mt-0.5">
              <div className="w-2 h-2 bg-blue-600 rounded-full" />
            </div>
            <p>
              <strong>Keep it under 90 seconds:</strong> Focus on login → scan → attestation flow
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Demo Script Reference */}
      <Alert>
        <Rocket className="h-4 w-4" />
        <AlertDescription>
          <strong>Demo Script:</strong> See{' '}
          <code className="bg-muted px-1.5 py-0.5 rounded text-xs">DEMO_GUIDE.md</code> for the
          full 60-90 second demo script with talking points.
        </AlertDescription>
      </Alert>
    </div>
  );
}
