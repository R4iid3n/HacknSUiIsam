import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';

interface QRDialogProps {
  open: boolean;
  onClose: () => void;
  eventId: string;
  missionId: number;
  missionTitle: string;
}

export function QRDialog({ open, onClose, eventId, missionId, missionTitle }: QRDialogProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && missionId !== null) {
      fetchQRCode();
    }
  }, [open, missionId]);

  const fetchQRCode = async () => {
    setLoading(true);
    setError(null);

    const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

    try {
      const response = await fetch(
        `${API_BASE}/api/missions/${missionId}/qr?eventId=${eventId}`
      );

      if (!response.ok) {
        throw new Error('Failed to generate QR code');
      }

      const data = await response.json();
      setQrCodeUrl(data.qrCodeDataUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">Mission QR Code</DialogTitle>
          <DialogDescription className="text-slate-400 text-base">{missionTitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-12 w-12 animate-spin text-sky-400 mb-4" />
              <p className="text-sm text-slate-400">Generating QR code...</p>
            </div>
          )}

          {error && (
            <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-300">{error}</div>
              </div>
            </div>
          )}

          {qrCodeUrl && !loading && (
            <div className="space-y-5">
              <div className="flex justify-center p-6 bg-white rounded-3xl shadow-xl">
                <img src={qrCodeUrl} alt="Mission QR Code" className="w-64 h-64" />
              </div>

              <div className="rounded-2xl bg-sky-500/10 border border-sky-500/30 p-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-sky-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-slate-300">
                    <span className="font-semibold text-sky-300">For Demo:</span> Since we don't have QR scanner integrated, click
                    "Claim Reward" on the mission card to simulate QR scanning and claim.
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-500 text-center font-medium">
                QR code valid for 1 hour
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
