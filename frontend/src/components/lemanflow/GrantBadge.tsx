/**
 * MODULE 7 - GrantBadge Component
 *
 * Shows amount won per mission
 * Visual badge for reward display
 */

import { Coins, TrendingUp } from 'lucide-react';
import { Badge } from '../ui/badge';

interface GrantBadgeProps {
  amount: number; // in MIST (1 SUI = 1_000_000_000 MIST)
  variant?: 'default' | 'large' | 'compact';
  showIcon?: boolean;
  showTrending?: boolean;
}

export function GrantBadge({
  amount,
  variant = 'default',
  showIcon = true,
  showTrending = false,
}: GrantBadgeProps) {
  const suiAmount = (amount / 1_000_000_000).toFixed(4);

  if (variant === 'large') {
    return (
      <div className="inline-flex items-center gap-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-2 border-green-500/30 rounded-xl px-6 py-3">
        {showIcon && (
          <div className="p-2 bg-green-500/20 rounded-lg">
            <Coins className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
        )}
        <div className="text-left">
          <div className="text-xs font-medium text-green-700 dark:text-green-300 uppercase tracking-wide">
            Reward
          </div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {suiAmount} SUI
          </div>
        </div>
        {showTrending && (
          <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <Badge variant="secondary" className="gap-1.5 px-2 py-1 bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300">
        {showIcon && <Coins className="h-3 w-3" />}
        <span className="font-semibold">{suiAmount} SUI</span>
      </Badge>
    );
  }

  // default
  return (
    <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-2">
      {showIcon && <Coins className="h-4 w-4 text-green-600 dark:text-green-400" />}
      <span className="font-bold text-green-600 dark:text-green-400">
        {suiAmount} SUI
      </span>
    </div>
  );
}
