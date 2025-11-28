/**
 * MODULE 7 - Scan Page
 *
 * QR Scanner with camera access
 * Uses getUserMedia + QR decode
 * POST /api/claim on success
 */

import { useState, useEffect, useRef } from 'react';
import { useCurrentAccount, useSignTransaction } from '@mysten/dapp-kit';
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
  const { mutateAsync: signTransaction } = useSignTransaction();
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
      // Step 1: Build transaction on backend
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

      // Step 2: If transaction needs signature, sign it
      if (data.needsSignature && data.txBytes) {
        toast.loading('Please sign the transaction in your wallet...');

        // Sign transaction with user's wallet
        const { signature } = await signTransaction({
          transaction: data.txBytes,
        });

        // Step 3: Execute signed transaction
        const executeResponse = await fetch(`${API_BASE}/api/claim/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            signedTxBytes: data.txBytes,
            signature,
          }),
        });

        if (!executeResponse.ok) {
          const error = await executeResponse.json();
          throw new Error(error.error || 'Transaction execution failed');
        }

        const executeData = await executeResponse.json();

        setResult({
          success: true,
          message: executeData.digest
            ? `Mission claimed! TX: ${executeData.digest.slice(0, 10)}...`
            : 'Mission claimed successfully!',
          missionTitle: 'Mission completed',
          rewardAmount: 0,
        });

        toast.success('Mission claimed successfully!');
      } else {
        // Old flow for fully sponsored transactions (mock mode)
        setResult({
          success: true,
          message: data.mock
            ? 'Mission claimed! (Mock mode)'
            : `Mission claimed! TX: ${data.digest.slice(0, 10)}...`,
          missionTitle: data.missionTitle,
          rewardAmount: data.rewardAmount,
        });

        toast.success('Mission claimed successfully!');
      }
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
    <div className="container mx-auto max-w-5xl px-4 py-6 pb-24 md:pb-12">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Scan QR Code</h1>
        <p className="text-sm text-slate-400">
          Point your camera at the mission QR code to claim your reward
        </p>
      </div>

      {/* Camera Preview - Centered Rounded Card */}
      <div className="max-w-2xl mx-auto mb-6">
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 border-2 border-slate-800 shadow-2xl">
          <div className="aspect-video relative bg-black flex items-center justify-center">
            {scanning ? (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                />
                {/* Scan Overlay */}
                {!claiming && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-64 h-64 border-4 border-sky-500 rounded-3xl animate-pulse shadow-lg shadow-sky-500/50" />
                  </div>
                )}
                {/* Claiming Overlay */}
                {claiming && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="h-16 w-16 animate-spin mx-auto mb-4 text-sky-400" />
                      <p className="text-lg font-semibold text-white">Processing claim...</p>
                      <p className="text-sm text-slate-400 mt-1">Please wait</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-slate-500 p-12">
                <Camera className="h-32 w-32 mx-auto mb-6 opacity-30" />
                <p className="text-lg font-medium text-slate-400">Camera Inactive</p>
                <p className="text-sm text-slate-500 mt-2">Click "Start Scanning" below</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-4 mb-6">
        <div className="flex gap-3">
          {!scanning ? (
            <Button
              size="lg"
              onClick={startScanning}
              className="gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-white font-semibold shadow-lg shadow-sky-500/30 px-8"
            >
              <Camera className="h-5 w-5" />
              Start Scanning
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={stopScanning}
              className="gap-2 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-semibold shadow-lg shadow-red-500/30 px-8"
            >
              <CameraOff className="h-5 w-5" />
              Stop Scanning
            </Button>
          )}
        </div>

        {/* Demo Mode Button */}
        {!scanning && !claiming && (
          <div className="text-center">
            <p className="text-sm text-slate-500 mb-2">
              Camera not working? Use demo mode:
            </p>
            <Button
              onClick={handleSimulateClaim}
              variant="outline"
              size="sm"
              className="gap-2 rounded-2xl border-slate-700 hover:border-sky-500/50 hover:bg-sky-500/10 text-slate-300 hover:text-sky-300"
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
        <div className="max-w-2xl mx-auto mb-6 rounded-2xl bg-red-500/10 border border-red-500/30 p-4">
          <div className="flex gap-3">
            <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-200">
              <span className="font-semibold">Camera Error:</span> {cameraError}
              <br />
              <span className="text-xs text-red-300 mt-1 block">
                Make sure you've granted camera permissions and your browser supports WebRTC.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Success/Error Modal */}
      {result && (
        <div className="max-w-2xl mx-auto mb-6">
          <div
            className={`rounded-3xl p-6 text-center ${
              result.success
                ? 'bg-gradient-to-br from-emerald-900/60 to-teal-900/60 border-2 border-emerald-500/50'
                : 'bg-gradient-to-br from-red-900/60 to-orange-900/60 border-2 border-red-500/50'
            }`}
          >
            <div className="mb-4">
              {result.success ? (
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-12 w-12 text-emerald-400" />
                </div>
              ) : (
                <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="h-12 w-12 text-red-400" />
                </div>
              )}
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              {result.success ? 'Mission Unlocked!' : 'Claim Failed'}
            </h3>
            <p className="text-slate-300 mb-4">{result.message}</p>
            {result.missionTitle && result.success && (
              <div className="bg-slate-950/40 rounded-2xl p-4 backdrop-blur-sm">
                <p className="text-sm text-slate-400 mb-1">Mission Completed</p>
                <p className="text-lg font-semibold text-white">{result.missionTitle}</p>
                <p className="text-emerald-400 font-bold text-xl mt-2">
                  +{((result.rewardAmount || 0) / 1_000_000_000).toFixed(2)} SUI
                </p>
              </div>
            )}
            <Button
              onClick={() => setResult(null)}
              className="mt-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white"
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="max-w-2xl mx-auto bg-slate-900/60 rounded-3xl p-6 border border-slate-800">
        <h3 className="font-semibold mb-4 text-lg text-white flex items-center gap-2">
          <div className="w-8 h-8 bg-sky-500/20 rounded-full flex items-center justify-center">
            <span className="text-sky-400 text-lg">ℹ</span>
          </div>
          How to use
        </h3>
        <ol className="space-y-3">
          {[
            'Click "Start Scanning" to activate your camera',
            'Point your camera at the mission QR code',
            'The system will automatically detect and claim the mission',
            'Rewards are instantly credited to your passport (gasless!)',
          ].map((instruction, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="bg-gradient-to-r from-sky-500 to-cyan-500 text-white rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                {index + 1}
              </span>
              <span className="text-sm text-slate-300 pt-0.5">{instruction}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
