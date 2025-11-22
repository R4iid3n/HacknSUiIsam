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
      <div className="text-center py-12 text-muted-foreground">
        <Award className="h-16 w-16 mx-auto mb-4 opacity-20" />
        <p className="text-lg font-medium">No attestations yet</p>
        <p className="text-sm">Complete missions to earn your first attestation</p>
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
    <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50">
      {/* Gradient Header */}
      <div className="h-24 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute bottom-2 right-2">
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
            <CheckCircle className="h-6 w-6 text-white" />
          </div>
        </div>
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16" />
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 translate-y-12" />
        </div>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-bold text-lg leading-tight mb-1 group-hover:text-primary transition-colors">
              {attestation.missionTitle}
            </h3>
            <p className="text-xs text-muted-foreground">{attestation.eventName}</p>
          </div>
          <Badge variant="secondary" className="ml-2">
            #{attestation.missionId}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {/* Reward Amount */}
        <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-green-500/20 rounded">
              <Coins className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Reward</span>
          </div>
          <span className="font-bold text-green-600 dark:text-green-400">
            {rewardSui} SUI
          </span>
        </div>

        {/* Completion Date */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>Completed {formattedDate}</span>
        </div>

        {/* Transaction Digest */}
        {attestation.transactionDigest && (
          <div className="text-xs font-mono text-muted-foreground bg-muted/50 rounded px-2 py-1.5 truncate">
            TX: {attestation.transactionDigest.slice(0, 12)}...{attestation.transactionDigest.slice(-8)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
