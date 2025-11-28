/**
 * MODULE 7 - AttestationGrid Component
 *
 * Grid of "NFT cards" to visualize attestations portfolio
 * Shows mission completions as collectible cards
 */

import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Award, Calendar, CheckCircle, Coins } from 'lucide-react';
import type { Attestation } from './PassportCard';

interface AttestationGridProps {
  attestations: Attestation[];
}

export function AttestationGrid({ attestations }: AttestationGridProps) {
  if (attestations.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-sky-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Award className="h-10 w-10 text-sky-400" />
        </div>
        <p className="text-lg font-semibold text-white mb-2">No attestations yet</p>
        <p className="text-sm text-slate-400">Complete missions to earn your first attestation</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {attestations.map((attestation, index) => (
        <AttestationCard key={index} attestation={attestation} />
      ))}
    </div>
  );
}

function AttestationCard({ attestation }: { attestation: Attestation }) {
  const formattedDate = new Date(attestation.completedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const rewardSui = (attestation.rewardAmount / 1_000_000_000).toFixed(4);

  return (
    <div className="rounded-3xl overflow-hidden bg-slate-900/60 border border-slate-800 shadow-lg hover:shadow-sky-500/20 hover:border-sky-700/50 transition-all duration-300 group">
      {/* Gradient Header */}
      <div className="h-28 bg-gradient-to-br from-sky-500 via-cyan-500 to-indigo-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/20 via-transparent to-indigo-500/20" />
        <div className="absolute bottom-3 right-3">
          <div className="bg-white/20 backdrop-blur-md rounded-full p-2.5 shadow-lg">
            <CheckCircle className="h-6 w-6 text-white" />
          </div>
        </div>
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16" />
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 translate-y-12" />
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-bold text-lg leading-tight mb-1.5 text-white group-hover:text-sky-300 transition-colors">
              {attestation.missionTitle}
            </h3>
            <p className="text-xs text-slate-400">{attestation.eventName}</p>
          </div>
          <Badge className="ml-2 bg-sky-500/20 text-sky-300 border-sky-500/40 rounded-full px-2.5 py-0.5">
            #{attestation.missionId}
          </Badge>
        </div>

        {/* Reward Amount */}
        <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 rounded-xl">
              <Coins className="h-5 w-5 text-emerald-400" />
            </div>
            <span className="text-sm font-medium text-slate-300">Reward</span>
          </div>
          <span className="font-bold text-xl bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            {rewardSui} SUI
          </span>
        </div>

        {/* Completion Date */}
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/60 rounded-xl px-3 py-2 border border-slate-700">
          <Calendar className="h-4 w-4 text-sky-400" />
          <span>Completed {formattedDate}</span>
        </div>

        {/* Transaction Digest */}
        {attestation.transactionDigest && (
          <div className="text-xs font-mono text-sky-300 bg-sky-950/40 rounded-xl px-3 py-2 truncate border border-sky-900/50">
            TX: {attestation.transactionDigest.slice(0, 12)}...{attestation.transactionDigest.slice(-8)}
          </div>
        )}
      </div>
    </div>
  );
}
