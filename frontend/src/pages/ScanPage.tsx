/**
 * MODULE 7 - Scan Page
 *
 * QR Scanner with camera access
 * Uses getUserMedia + QR decode
 * POST /api/claim on success
 */

import { useState, useEffect, useRef } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useNavigate } from 'react-router-dom';
import { BrowserQRCodeReader } from '@zxing/browser';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, CameraOff, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';
const DEFAULT_EVENT_ID = import.meta.env.VITE_EVENT_ID || '0xe13b43211fca648ff5a3198b3282d15a3c9c976ed922d418231f76680755710d';

export function ScanPage() {
  const account = useCurrentAccount();
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    missionTitle?: string;
    rewardAmount?: number;
  } | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserQRCodeReader | null>(null);

  useEffect(() => {
    // Redirect to login if not connected
    if (!account) {
      navigate('/login');
    }
  }, [account, navigate]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    try {
      setCameraError(null);
      setResult(null);
      setScanning(true);

      // Initialize QR code reader
      const codeReader = new BrowserQRCodeReader();
      codeReaderRef.current = codeReader;

      // Get video input devices
      const videoInputDevices = await BrowserQRCodeReader.listVideoInputDevices();

      if (videoInputDevices.length === 0) {
        throw new Error('No camera found');
      }

      // Use the first camera (or back camera on mobile)
      const selectedDeviceId = videoInputDevices[0].deviceId;

      // Start decoding
      await codeReader.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current!,
        async (result, error) => {
          if (result) {
            // QR code detected!
            const qrToken = result.getText();
            console.log('QR Code detected:', qrToken);

            // Stop scanning
            stopScanning();

            // Claim mission
            await handleClaim(qrToken);
          }

          if (error && error.name !== 'NotFoundException') {
            console.error('QR Scan error:', error);
          }
        }
      );
    } catch (error: any) {
      console.error('Camera error:', error);
      setCameraError(error.message || 'Failed to access camera');
      setScanning(false);
    }
  };

  const stopScanning = () => {
    if (codeReaderRef.current) {
      // codeReaderRef.current.reset() - deprecated;
      codeReaderRef.current = null;
    }
    setScanning(false);
  };

  const handleClaim = async (qrToken: string) => {
    setClaiming(true);

    try {
      const response = await fetch(`${API_BASE}/api/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          eventId: DEFAULT_EVENT_ID,
          qrToken,
          autoRegisterPassport: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Claim failed');
      }

      const data = await response.json();

      setResult({
        success: true,
        message: data.mock
          ? 'Mission claimed! (Mock mode)'
          : `Mission claimed! TX: ${data.digest.slice(0, 10)}...`,
        missionTitle: data.missionTitle,
        rewardAmount: data.rewardAmount,
      });

      toast.success('Mission claimed successfully!');
    } catch (error: any) {
      console.error('Claim error:', error);
      setResult({
        success: false,
        message: error.message || 'Failed to claim mission',
      });
      toast.error(error.message || 'Failed to claim mission');
    } finally {
      setClaiming(false);
    }
  };

  /**
   * MODULE 8 - Simulate Claim (Fallback for demo)
   * Generates QR token for first available mission and auto-claims
   */
  const handleSimulateClaim = async () => {
    if (!account) {
      toast.error('Please connect your wallet first');
      return;
    }

    setClaiming(true);
    setResult(null);

    try {
      // Fetch available missions
      const missionsResponse = await fetch(
        `${API_BASE}/api/missions?eventId=${DEFAULT_EVENT_ID}`,
        { credentials: 'include' }
      );

      if (!missionsResponse.ok) {
        throw new Error('Failed to fetch missions');
      }

      const missionsData = await missionsResponse.json();
      const availableMissions = missionsData.missions || [];

      if (availableMissions.length === 0) {
        throw new Error('No missions available');
      }

      // Get first mission
      const mission = availableMissions[0];

      // Generate QR token for this mission
      const qrResponse = await fetch(
        `${API_BASE}/api/missions/${mission.missionId}/qr?eventId=${DEFAULT_EVENT_ID}`,
        { credentials: 'include' }
      );

      if (!qrResponse.ok) {
        throw new Error('Failed to generate QR token');
      }

      const qrData = await qrResponse.json();

      // Auto-claim using the generated token
      await handleClaim(qrData.token);

      toast.success('Simulated QR scan successfully!');
    } catch (error: any) {
      console.error('Simulate claim error:', error);
      setResult({
        success: false,
        message: error.message || 'Failed to simulate claim',
      });
      toast.error(error.message || 'Failed to simulate claim');
      setClaiming(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">Scan Mission QR</h1>
        <p className="text-muted-foreground text-lg">
          Point your camera at the mission QR code to claim your reward
        </p>
      </div>

      {/* Camera Preview */}
      <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-2xl mb-8">
        <div className="aspect-video relative bg-black flex items-center justify-center">
          {scanning ? (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
              />
              {claiming && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
                    <p className="text-lg font-medium">Processing claim...</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-400 p-8">
              <Camera className="h-24 w-24 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Camera inactive</p>
              <p className="text-sm mt-2">Click "Start Scanning" to begin</p>
            </div>
          )}
        </div>

        {/* Scan Overlay */}
        {scanning && !claiming && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-1/4 border-4 border-blue-500 rounded-xl animate-pulse" />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-4 mb-8">
        <div className="flex gap-4">
          {!scanning ? (
            <Button size="lg" onClick={startScanning} className="gap-2">
              <Camera className="h-5 w-5" />
              Start Scanning
            </Button>
          ) : (
            <Button size="lg" variant="destructive" onClick={stopScanning} className="gap-2">
              <CameraOff className="h-5 w-5" />
              Stop Scanning
            </Button>
          )}
        </div>

        {/* MODULE 8 - Simulate Claim Button (Demo Fallback) */}
        {!scanning && !claiming && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Camera not working? Use demo mode:
            </p>
            <Button
              onClick={handleSimulateClaim}
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={claiming}
            >
              {claiming ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Simulate Claim (Demo)
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Camera Error */}
      {cameraError && (
        <Alert variant="destructive" className="mb-8">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Camera Error:</strong> {cameraError}
            <br />
            <span className="text-sm">
              Make sure you've granted camera permissions and your browser supports WebRTC.
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Result */}
      {result && (
        <Alert variant={result.success ? 'default' : 'destructive'} className="mb-8">
          {result.success ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <AlertDescription>
            <strong>{result.success ? 'Success!' : 'Failed'}</strong>
            <br />
            {result.message}
            {result.missionTitle && (
              <>
                <br />
                <span className="text-sm">
                  Mission: {result.missionTitle} • Reward:{' '}
                  {((result.rewardAmount || 0) / 1_000_000_000).toFixed(4)} SUI
                </span>
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Instructions */}
      <div className="bg-muted/50 rounded-xl p-6">
        <h3 className="font-semibold mb-4 text-lg">How to use:</h3>
        <ol className="space-y-3 text-sm text-muted-foreground">
          <li className="flex items-start gap-3">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">
              1
            </span>
            <span>Click "Start Scanning" to activate your camera</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">
              2
            </span>
            <span>Point your camera at the mission QR code</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">
              3
            </span>
            <span>The system will automatically detect and claim the mission</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">
              4
            </span>
            <span>Rewards are instantly credited to your passport (gasless!)</span>
          </li>
        </ol>
      </div>
    </div>
  );
}
