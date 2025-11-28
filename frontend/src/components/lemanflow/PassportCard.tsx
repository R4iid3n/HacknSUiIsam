/**
 * PassportCard Component - Sui Overflow 2024 Style
 *
 * Gradient passport card with stats
 * - Sky-blue to indigo gradient header
 * - Clean stat grid
 * - Recent achievements list
 * - Soulbound badge
 */

import { Badge } from '@/components/ui/badge';
import { Award, Calendar, Coins, Trophy, Sparkles } from 'lucide-react';

export interface Attestation {
  eventId: string;
  eventName: string;
  missionId: number;
  missionTitle: string;
  completedAt: number;
  rewardAmount: number;
  transactionDigest?: string;
}

interface PassportCardProps {
  passportId: string;
  attestations: Attestation[];
  totalRewards: number;
}

export function PassportCard({ passportId, attestations, totalRewards }: PassportCardProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-900/60 via-cyan-900/50 to-indigo-900/60 border border-sky-700/50 shadow-2xl shadow-sky-500/20">
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-cyan-500/5 to-indigo-500/10 opacity-70" />

      {/* Decorative circles */}
      <div className="absolute -top-20 -right-20 w-60 h-60 bg-sky-500/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-indigo-500/20 rounded-full blur-3xl" />

      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-6 w-6 text-yellow-400" />
              <h2 className="text-2xl font-bold text-white">My Passport</h2>
            </div>
            <p className="text-xs font-mono text-sky-300/80 break-all">
              {passportId.slice(0, 24)}...{passportId.slice(-12)}
            </p>
          </div>
          <Badge className="bg-indigo-500/30 text-indigo-200 border-indigo-400/50 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" />
            Soulbound
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Attestations */}
          <div className="bg-slate-950/40 backdrop-blur-sm rounded-2xl p-4 border border-sky-700/30">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-4 w-4 text-sky-400" />
              <span className="text-xs text-slate-400 font-medium">Attestations</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {attestations.length}
            </div>
          </div>

          {/* Total SUI */}
          <div className="bg-slate-950/40 backdrop-blur-sm rounded-2xl p-4 border border-emerald-700/30">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="h-4 w-4 text-emerald-400" />
              <span className="text-xs text-slate-400 font-medium">Total SUI</span>
            </div>
            <div className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              {totalRewards.toFixed(2)}
            </div>
          </div>

          {/* Events */}
          <div className="bg-slate-950/40 backdrop-blur-sm rounded-2xl p-4 border border-purple-700/30">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-purple-400" />
              <span className="text-xs text-slate-400 font-medium">Events</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {new Set(attestations.map((a) => a.eventId)).size}
            </div>
          </div>
        </div>

        {/* Recent Achievements */}
        {attestations.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-400" />
              Recent Achievements
            </h3>
            <div className="space-y-2.5">
              {attestations.slice(0, 3).map((att, index) => (
                <div
                  key={`${att.eventId}-${att.missionId}-${index}`}
                  className="flex items-start justify-between gap-3 p-3.5 rounded-2xl bg-slate-950/60 backdrop-blur-sm border border-slate-800/50 hover:border-sky-700/50 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-200 truncate mb-0.5">
                      {att.missionTitle}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {att.eventName}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-emerald-500/10 text-emerald-300 border-emerald-500/40 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
                  >
                    +{(att.rewardAmount / 1_000_000_000).toFixed(2)} SUI
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {attestations.length === 0 && (
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">
              Complete missions to earn your first attestation
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
