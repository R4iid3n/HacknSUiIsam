/**
 * MissionCard Component - Sui Overflow 2024 Style
 *
 * Gradient card with modern mobile-first design
 * - Large rounded corners (rounded-3xl)
 * - Sky-blue gradient for active missions
 * - Clean typography and spacing
 * - Progress indicator and reward badge
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, Coins, Loader2, QrCode } from 'lucide-react';

export interface Mission {
  missionId: number;
  title: string;
  description: string;
  rewardAmount: number;
  active: boolean;
  completions: number;
  completed?: boolean;
}

interface MissionCardProps {
  mission: Mission;
  onClaim: (missionId: number) => void;
  onViewQR: (missionId: number) => void;
  claiming: boolean;
}

export function MissionCard({ mission, onClaim, onViewQR, claiming }: MissionCardProps) {
  const isCompleted = mission.completed || false;

  return (
    <div
      className={`relative overflow-hidden rounded-3xl p-5 transition-all duration-300 ${
        isCompleted
          ? 'bg-gradient-to-br from-emerald-900/40 to-teal-900/40 border border-emerald-700/30'
          : mission.active
          ? 'bg-gradient-to-br from-sky-900/40 via-cyan-900/40 to-indigo-900/40 border border-sky-700/50 hover:border-sky-500/70 shadow-lg shadow-sky-500/10'
          : 'bg-slate-900/60 border border-slate-800'
      }`}
    >
      {/* Glow effect for active missions */}
      {!isCompleted && mission.active && (
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-cyan-500/10 to-indigo-500/10 opacity-0 hover:opacity-100 transition-opacity rounded-3xl" />
      )}

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <h3 className="text-lg font-semibold text-slate-100">
                {mission.title}
              </h3>
              {isCompleted && (
                <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
              )}
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              {mission.description}
            </p>
          </div>

          {/* Reward Badge */}
          <Badge
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap ${
              isCompleted
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-gradient-to-r from-sky-500/20 to-cyan-500/20 text-sky-300 border-sky-500/40'
            }`}
          >
            <Coins className="h-4 w-4" />
            {(mission.rewardAmount / 1_000_000_000).toFixed(2)} SUI
          </Badge>
        </div>

        {/* Mission Stats */}
        <div className="flex items-center gap-4 mb-5">
          <div className="flex items-center gap-1.5 text-sm text-slate-400">
            <Clock className="h-4 w-4" />
            <span>{mission.completions} completed</span>
          </div>
          {!mission.active && (
            <Badge
              variant="outline"
              className="text-xs text-orange-400 border-orange-500/50 bg-orange-500/10"
            >
              Inactive
            </Badge>
          )}
        </div>

        {/* Progress Bar */}
        {!isCompleted && mission.active && (
          <div className="mb-5">
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-cyan-500 rounded-full transition-all duration-500"
                style={{
                  width: mission.completions > 0 ? `${Math.min((mission.completions / 10) * 100, 100)}%` : '0%',
                }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!isCompleted && mission.active && (
          <div className="flex gap-3">
            <Button
              onClick={() => onViewQR(mission.missionId)}
              variant="outline"
              className="flex-1 rounded-2xl border-slate-700 hover:border-sky-500/50 hover:bg-sky-500/10 text-slate-300 hover:text-sky-300 transition-all"
            >
              <QrCode className="h-4 w-4 mr-2" />
              View QR
            </Button>
            <Button
              onClick={() => onClaim(mission.missionId)}
              disabled={claiming}
              className="flex-1 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-white font-semibold shadow-lg shadow-sky-500/30 transition-all"
            >
              {claiming ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Claiming...
                </>
              ) : (
                <>
                  <Coins className="h-4 w-4 mr-2" />
                  Claim Reward
                </>
              )}
            </Button>
          </div>
        )}

        {/* Completed State */}
        {isCompleted && (
          <div className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/30">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-300">
              Mission Completed
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
