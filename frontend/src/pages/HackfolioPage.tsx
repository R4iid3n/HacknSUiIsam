/**
 * HACKFOLIO PAGE - Portfolio personnel Web3
 * 
 * Affiche tous les HackPass, attestations et missions réussies
 * Chaque élément est cliquable vers SuiVision pour prouver l'authenticité on-chain
 * Inclut des stats en temps réel et un bouton d'export
 */

import { useEffect, useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  AlertCircle, 
  Wallet, 
  Award, 
  TrendingUp, 
  Calendar,
  ExternalLink,
  Share2,
  Download,
  Sparkles,
  Trophy,
  Target,
  Zap,
  CheckCircle2,
  Coins
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';
const NETWORK = import.meta.env.VITE_SUI_NETWORK || 'testnet';

// SuiVision URL builder
const getSuiVisionUrl = (objectId: string) => {
  const subdomain = NETWORK === 'mainnet' ? '' : `${NETWORK}.`;
  return `https://${subdomain}suivision.xyz/object/${objectId}`;
};

const getSuiVisionTxUrl = (txDigest: string) => {
  const subdomain = NETWORK === 'mainnet' ? '' : `${NETWORK}.`;
  return `https://${subdomain}suivision.xyz/txblock/${txDigest}`;
};

interface Attestation {
  eventId: string;
  eventName: string;
  missionId: number;
  missionTitle: string;
  completedAt: number;
  rewardAmount: number;
  transactionDigest?: string;
}

interface HackfolioData {
  hasPassport: boolean;
  passportId: string | null;
  owner: string;
  createdAt: number;
  attestations: Attestation[];
  totalRewards: number;
  attestationCount: number;
  uniqueEvents: number;
  averageReward: number;
}

export function HackfolioPage() {
  const account = useCurrentAccount();
  const navigate = useNavigate();
  const [hackfolio, setHackfolio] = useState<HackfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!account) {
      navigate('/login');
      return;
    }
    loginAndFetchHackfolio();
  }, [account, navigate]);

  const loginAndFetchHackfolio = async () => {
    if (!account) return;

    try {
      await fetch(`${API_BASE}/api/login/wallet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ address: account.address }),
      });

      await fetchHackfolio();
    } catch (error) {
      console.error('Login error:', error);
      await fetchHackfolio();
    }
  };

  const fetchHackfolio = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/passport`, {
        credentials: 'include',
      });

      if (!response.ok) {
        setHackfolio({
          hasPassport: false,
          passportId: null,
          owner: account?.address || '',
          createdAt: 0,
          attestations: [],
          totalRewards: 0,
          attestationCount: 0,
          uniqueEvents: 0,
          averageReward: 0,
        });
        return;
      }

      const data = await response.json();
      
      // Calculer les stats supplémentaires
      const uniqueEvents = new Set(data.attestations.map((a: Attestation) => a.eventId)).size;
      const averageReward = data.attestationCount > 0 
        ? data.totalRewards / data.attestationCount 
        : 0;

      setHackfolio({
        ...data,
        uniqueEvents,
        averageReward,
      });
    } catch (error) {
      console.error('Failed to fetch hackfolio:', error);
      toast.error('Échec du chargement du Hackfolio');
    } finally {
      setLoading(false);
    }
  };

  const handleExportHackfolio = async () => {
    if (!hackfolio) return;

    setExporting(true);
    try {
      // Créer un objet JSON exportable
      const exportData = {
        owner: hackfolio.owner,
        passportId: hackfolio.passportId,
        createdAt: new Date(hackfolio.createdAt).toISOString(),
        stats: {
          totalRewards: hackfolio.totalRewards / 1_000_000_000,
          attestationCount: hackfolio.attestationCount,
          uniqueEvents: hackfolio.uniqueEvents,
          averageReward: hackfolio.averageReward / 1_000_000_000,
        },
        attestations: hackfolio.attestations.map(a => ({
          eventName: a.eventName,
          missionTitle: a.missionTitle,
          completedAt: new Date(a.completedAt).toISOString(),
          rewardAmount: a.rewardAmount / 1_000_000_000,
          proof: a.transactionDigest ? getSuiVisionTxUrl(a.transactionDigest) : null,
        })),
        verificationUrl: hackfolio.passportId ? getSuiVisionUrl(hackfolio.passportId) : null,
        exportedAt: new Date().toISOString(),
      };

      // Télécharger en JSON
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hackfolio-${hackfolio.owner.slice(0, 8)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Hackfolio exporté avec succès !');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Échec de l\'export');
    } finally {
      setExporting(false);
    }
  };

  const handleShareHackfolio = () => {
    if (!hackfolio?.passportId) return;

    // Utilise le lien SuiVision pour partager le passport on-chain
    const shareUrl = getSuiVisionUrl(hackfolio.passportId);

    if (navigator.share) {
      navigator.share({
        title: 'Mon Hackfolio LémanFlow',
        text: `J'ai complété ${hackfolio.attestationCount} missions et gagné ${(hackfolio.totalRewards / 1_000_000_000).toFixed(4)} SUI ! Vérifiez mon passport on-chain :`,
        url: shareUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Lien SuiVision copié dans le presse-papiers !');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  if (!hackfolio?.hasPassport) {
    return (
      <div className="container mx-auto max-w-4xl py-16 px-4">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="p-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full animate-pulse">
              <Wallet className="h-16 w-16 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">Créez Votre Hackfolio</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Votre portfolio Web3 personnel pour prouver vos réalisations on-chain.
            Commencez par enregistrer votre Passport !
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <Button
            size="lg"
            onClick={() => navigate('/passport')}
            className="gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            <Sparkles className="h-5 w-5" />
            Créer Mon Hackfolio
          </Button>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Votre Hackfolio est un portfolio Web3 qui prouve vos réalisations via la blockchain Sui.
            Chaque attestation est vérifiable on-chain et <strong>100% gasless</strong>.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const createdDate = new Date(hackfolio.createdAt).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const totalSui = (hackfolio.totalRewards / 1_000_000_000).toFixed(4);
  const avgSui = (hackfolio.averageReward / 1_000_000_000).toFixed(4);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 pb-24 md:pb-12 space-y-6">
      {/* Header avec actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-gradient-to-br from-sky-500 to-indigo-500 rounded-2xl shadow-lg shadow-sky-500/30">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Mon Hackfolio</h1>
          </div>
          <p className="text-sm text-slate-400">
            Portfolio Web3 vérifié on-chain sur Sui
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleShareHackfolio}
            className="gap-2 rounded-2xl border-slate-700 hover:border-sky-500/50 hover:bg-sky-500/10 text-slate-300 hover:text-sky-300"
          >
            <Share2 className="h-4 w-4" />
            Partager
          </Button>
          <Button
            variant="outline"
            onClick={handleExportHackfolio}
            disabled={exporting}
            className="gap-2 rounded-2xl border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-500/10 text-slate-300 hover:text-emerald-300"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Exporter
          </Button>
        </div>
      </div>

      {/* Passport Card avec lien SuiVision */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-900/60 via-indigo-900/50 to-purple-900/60 border border-sky-700/50 shadow-2xl shadow-sky-500/20 p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-indigo-500/5 to-purple-500/10 opacity-70" />
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-sky-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-indigo-500/20 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-sky-500 to-indigo-500 rounded-2xl shadow-lg shadow-sky-500/40">
              <Award className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-xl text-white mb-1">HackPass SBT</h3>
              <p className="text-sm text-slate-300">
                Membre depuis {createdDate}
              </p>
              <p className="text-xs font-mono text-sky-300 mt-1">
                {hackfolio.passportId?.slice(0, 16)}...{hackfolio.passportId?.slice(-12)}
              </p>
            </div>
          </div>

          {hackfolio.passportId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(getSuiVisionUrl(hackfolio.passportId!), '_blank')}
              className="gap-2 rounded-2xl border-sky-500/50 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 hover:text-sky-200"
            >
              <ExternalLink className="h-4 w-4" />
              Voir sur SuiVision
            </Button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl bg-gradient-to-br from-emerald-900/40 to-teal-900/40 border border-emerald-700/50 p-5 shadow-lg hover:shadow-emerald-500/20 transition-all">
          <div className="flex items-center gap-2 mb-3">
            <Coins className="h-5 w-5 text-emerald-400" />
            <span className="text-sm text-slate-400 font-medium">Récompenses Totales</span>
          </div>
          <div className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            {totalSui}
          </div>
          <p className="text-xs text-emerald-300/80 mt-1">SUI vérifiés on-chain</p>
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-sky-900/40 to-indigo-900/40 border border-sky-700/50 p-5 shadow-lg hover:shadow-sky-500/20 transition-all">
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-5 w-5 text-sky-400" />
            <span className="text-sm text-slate-400 font-medium">Missions</span>
          </div>
          <div className="text-4xl font-bold text-white">
            {hackfolio.attestationCount}
          </div>
          <p className="text-xs text-sky-300/80 mt-1">
            {hackfolio.attestationCount === 1 ? 'attestation' : 'attestations'}
          </p>
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-700/50 p-5 shadow-lg hover:shadow-purple-500/20 transition-all">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-5 w-5 text-purple-400" />
            <span className="text-sm text-slate-400 font-medium">Événements</span>
          </div>
          <div className="text-4xl font-bold text-white">
            {hackfolio.uniqueEvents}
          </div>
          <p className="text-xs text-purple-300/80 mt-1">hackathons participés</p>
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-orange-900/40 to-red-900/40 border border-orange-700/50 p-5 shadow-lg hover:shadow-orange-500/20 transition-all">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-5 w-5 text-orange-400" />
            <span className="text-sm text-slate-400 font-medium">Moy. Récompense</span>
          </div>
          <div className="text-4xl font-bold text-white">
            {avgSui}
          </div>
          <p className="text-xs text-orange-300/80 mt-1">SUI par mission</p>
        </div>
      </div>

      {/* Attestations Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-yellow-500" />
              Mes Attestations
            </h2>
            <p className="text-sm text-muted-foreground">
              Collection de missions complétées avec preuves on-chain
            </p>
          </div>
          {hackfolio.attestationCount > 0 && (
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {hackfolio.attestationCount} {hackfolio.attestationCount === 1 ? 'item' : 'items'}
            </Badge>
          )}
        </div>

        {hackfolio.attestations.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="text-center py-12">
              <Award className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium text-muted-foreground mb-2">
                Aucune attestation pour le moment
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Complétez des missions pour gagner vos premières attestations
              </p>
              <Button onClick={() => navigate('/dashboard')} className="gap-2">
                <Target className="h-4 w-4" />
                Voir les Missions
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {hackfolio.attestations.map((attestation, index) => (
              <AttestationCard key={index} attestation={attestation} />
            ))}
          </div>
        )}
      </div>

      {/* Call to Action */}
      {hackfolio.attestationCount > 0 && (
        <Card className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border-2 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="font-bold text-xl mb-1 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  Partagez Vos Réalisations
                </h3>
                <p className="text-sm text-muted-foreground">
                  Montrez votre portfolio Web3 vérifié on-chain à la communauté
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleShareHackfolio}
                  className="gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  Partager
                </Button>
                <Button 
                  onClick={handleExportHackfolio}
                  disabled={exporting}
                  className="gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                >
                  {exporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Exporter JSON
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Composant AttestationCard avec lien SuiVision
function AttestationCard({ attestation }: { attestation: Attestation }) {
  const formattedDate = new Date(attestation.completedAt).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const rewardSui = (attestation.rewardAmount / 1_000_000_000).toFixed(4);

  const handleViewOnChain = () => {
    if (attestation.transactionDigest) {
      window.open(getSuiVisionTxUrl(attestation.transactionDigest), '_blank');
    }
  };

  return (
    <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50 cursor-pointer"
          onClick={handleViewOnChain}>
      {/* Gradient Header avec animation */}
      <div className="h-24 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
        <div className="absolute bottom-2 right-2">
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-2 group-hover:scale-110 transition-transform">
            <CheckCircle2 className="h-6 w-6 text-white" />
          </div>
        </div>
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16 group-hover:scale-110 transition-transform" />
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 translate-y-12 group-hover:scale-110 transition-transform" />
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
        <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-lg p-3 group-hover:bg-green-500/20 transition-colors">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-green-500/20 rounded">
              <Coins className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Récompense</span>
          </div>
          <span className="font-bold text-green-600 dark:text-green-400">
            {rewardSui} SUI
          </span>
        </div>

        {/* Completion Date */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>Complété le {formattedDate}</span>
        </div>

        {/* View on SuiVision */}
        {attestation.transactionDigest && (
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 group-hover:border-primary/50"
            onClick={handleViewOnChain}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Voir la Preuve On-Chain
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

