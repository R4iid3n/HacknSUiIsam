'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Html5Qrcode } from 'html5-qrcode';
import { useAuthClient } from '@/lib/ic-auth';
import { CANISTER_IDS } from '@/config';
import { createActor, BackendActor, convertQRPayloadToCanister } from '@/lib/canisters';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Simplified IDL Factory
const backendIdlFactory = ({ IDL }: any) => {
  return IDL.Service({
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
  });
};

export default function ScanPage() {
  const router = useRouter();
  const { isAuthenticated, authClient, loading } = useAuthClient();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    attestationId?: string;
    rewardAmount?: bigint;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scanAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/');
    }
  }, [loading, isAuthenticated, router]);

  async function startScanning() {
    if (!authClient) return;

    try {
      setError(null);
      setResult(null);
      setScanning(true);

      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          // Stop scanning
          await scanner.stop();
          scannerRef.current = null;
          setScanning(false);

          // Parse QR payload
          try {
            const payload = JSON.parse(decodedText);
            
            // Validate payload structure
            if (
              !payload.eventId ||
              !payload.missionId ||
              !payload.nonce ||
              !payload.signature ||
              !payload.expiresAt
            ) {
              setError('Invalid QR code format');
              return;
            }

            // Convert to canister format
            const canisterPayload = convertQRPayloadToCanister(payload);

            // Complete mission
            const identity = authClient.getIdentity();
            const backendActor = createActor<BackendActor>(
              CANISTER_IDS.backend,
              backendIdlFactory,
              identity
            );

            const result = await backendActor.completeMission(canisterPayload);

            if ('ok' in result && result.ok) {
              setResult({
                success: true,
                message: 'Mission completed successfully!',
                attestationId: result.ok.attestation.id,
                rewardAmount: result.ok.attestation.rewardAmount,
              });
              
              // Redirect to dashboard after 3 seconds
              setTimeout(() => {
                router.push('/dashboard');
              }, 3000);
            } else {
              setError(result.err || 'Failed to complete mission');
            }
          } catch (err: any) {
            setError('Failed to parse QR code: ' + err.message);
          }
        },
        (errorMessage) => {
          // Ignore scanning errors (user might move camera)
        }
      );
    } catch (err: any) {
      console.error('Scanning error:', err);
      setError('Failed to start camera: ' + err.message);
      setScanning(false);
    }
  }

  async function stopScanning() {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    setScanning(false);
  }

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

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
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Scan QR Code
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Point your camera at a mission QR code to complete it
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            {!scanning && !result && (
              <div className="text-center py-12">
                <div className="mb-6">
                  <svg
                    className="mx-auto h-24 w-24 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                    />
                  </svg>
                </div>
                <Button onClick={startScanning} size="lg">
                  Start Scanning
                </Button>
              </div>
            )}

            {scanning && (
              <div>
                <div id="qr-reader" ref={scanAreaRef} className="w-full"></div>
                <div className="mt-4 text-center">
                  <Button variant="danger" onClick={stopScanning}>
                    Stop Scanning
                  </Button>
                </div>
              </div>
            )}

            {result && (
              <div className="text-center py-8">
                {result.success ? (
                  <>
                    <div className="mb-4">
                      <svg
                        className="mx-auto h-16 w-16 text-green-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {result.message}
                    </h3>
                    {result.attestationId && (
                      <Badge variant="success" className="mt-2">
                        Attestation ID: {result.attestationId.slice(0, 16)}...
                      </Badge>
                    )}
                    {result.rewardAmount && Number(result.rewardAmount) > 0 && (
                      <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                        Reward: {Number(result.rewardAmount).toLocaleString()} cycles
                      </p>
                    )}
                    <p className="mt-4 text-sm text-gray-500 dark:text-gray-500">
                      Redirecting to dashboard...
                    </p>
                  </>
                ) : (
                  <>
                    <div className="mb-4">
                      <svg
                        className="mx-auto h-16 w-16 text-red-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {result.message}
                    </h3>
                  </>
                )}
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-200">{error}</p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    setError(null);
                    setResult(null);
                  }}
                >
                  Try Again
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

