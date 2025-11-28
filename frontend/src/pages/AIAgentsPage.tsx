/**
 * AI Agents Page - Gestion des agents IA
 * 
 * Interface admin pour créer et gérer les agents IA d'automatisation
 */

import { useEffect, useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Bot, 
  Plus, 
  Power, 
  PowerOff, 
  Play,
  Settings,
  Zap,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

interface AgentConfig {
  autoApprove: boolean;
  rewardMultiplier: number;
  minReward: number;
  maxReward: number;
  cooldownPeriod: number;
}

interface AIAgent {
  id: string;
  name: string;
  eventId: string;
  agentType: 'CHECK_IN' | 'REWARDS' | 'MISSIONS' | 'ANALYTICS';
  isActive: boolean;
  createdAt: number;
  executionCount: number;
  config: AgentConfig;
  rules: any[];
}

const AGENT_TYPES = [
  { value: 'CHECK_IN', label: 'Check-In', icon: '✓', color: 'bg-blue-500' },
  { value: 'REWARDS', label: 'Récompenses', icon: '💰', color: 'bg-green-500' },
  { value: 'MISSIONS', label: 'Missions', icon: '🎯', color: 'bg-purple-500' },
  { value: 'ANALYTICS', label: 'Analytics', icon: '📊', color: 'bg-orange-500' },
];

export function AIAgentsPage() {
  const account = useCurrentAccount();
  const navigate = useNavigate();
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    if (!account) {
      navigate('/login');
      return;
    }
    fetchAgents();
  }, [account, navigate]);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/agents`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setAgents(data.agents);
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      toast.error('Échec du chargement des agents');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAgent = async (agentId: string, isActive: boolean) => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/agents/${agentId}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive }),
      });

      if (response.ok) {
        toast.success(`Agent ${isActive ? 'activé' : 'désactivé'}`);
        fetchAgents();
      } else {
        throw new Error('Failed to toggle agent');
      }
    } catch (error) {
      console.error('Toggle error:', error);
      toast.error('Échec de la modification');
    }
  };

  const handleExecuteAgent = async (agentId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/agents/${agentId}/execute`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Agent exécuté avec succès');
        fetchAgents();
      } else {
        throw new Error('Failed to execute agent');
      }
    } catch (error) {
      console.error('Execute error:', error);
      toast.error('Échec de l\'exécution');
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

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 pb-24 md:pb-12 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg shadow-purple-500/30">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">AI Agents</h1>
          </div>
          <p className="text-sm text-slate-400">
            Automatisez vos workflows d'événements avec des agents intelligents
          </p>
        </div>

        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="gap-2 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-semibold shadow-lg shadow-purple-500/30"
        >
          <Plus className="h-5 w-5" />
          Créer un Agent
        </Button>
      </div>

      {/* Formulaire de création */}
      {showCreateForm && (
        <CreateAgentForm
          onSuccess={() => {
            setShowCreateForm(false);
            fetchAgents();
          }}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl bg-gradient-to-br from-sky-900/40 to-indigo-900/40 border border-sky-700/50 p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <Bot className="h-5 w-5 text-sky-400" />
            <span className="text-sm text-slate-400 font-medium">Total Agents</span>
          </div>
          <div className="text-4xl font-bold text-white">{agents.length}</div>
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-emerald-900/40 to-teal-900/40 border border-emerald-700/50 p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <span className="text-sm text-slate-400 font-medium">Actifs</span>
          </div>
          <div className="text-4xl font-bold text-emerald-400">
            {agents.filter(a => a.isActive).length}
          </div>
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700 p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-5 w-5 text-slate-500" />
            <span className="text-sm text-slate-400 font-medium">Inactifs</span>
          </div>
          <div className="text-4xl font-bold text-slate-400">
            {agents.filter(a => !a.isActive).length}
          </div>
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-yellow-900/40 to-orange-900/40 border border-yellow-700/50 p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-5 w-5 text-yellow-400" />
            <span className="text-sm text-slate-400 font-medium">Exécutions</span>
          </div>
          <div className="text-4xl font-bold text-yellow-400">
            {agents.reduce((sum, a) => sum + a.executionCount, 0)}
          </div>
        </div>
      </div>

      {/* Liste des agents */}
      {agents.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-slate-700 bg-slate-900/40">
          <div className="text-center py-16 px-4">
            <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bot className="h-10 w-10 text-purple-400" />
            </div>
            <p className="text-lg font-semibold text-white mb-2">
              Aucun agent IA pour le moment
            </p>
            <p className="text-sm text-slate-400 mb-6">
              Créez votre premier agent pour automatiser vos workflows
            </p>
            <Button onClick={() => setShowCreateForm(true)} className="gap-2 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 shadow-lg shadow-purple-500/30">
              <Plus className="h-4 w-4" />
              Créer un Agent
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onToggle={handleToggleAgent}
              onExecute={handleExecuteAgent}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Composant AgentCard
function AgentCard({
  agent,
  onToggle,
  onExecute
}: {
  agent: AIAgent;
  onToggle: (id: string, isActive: boolean) => void;
  onExecute: (id: string) => void;
}) {
  const agentTypeInfo = AGENT_TYPES.find(t => t.value === agent.agentType);

  return (
    <div className={`rounded-3xl overflow-hidden border-2 shadow-lg transition-all ${agent.isActive ? 'border-emerald-500/50 shadow-emerald-500/20' : 'border-slate-700 shadow-slate-900/50'}`}>
      <div className={`h-3 ${agentTypeInfo?.color || 'bg-gray-500'}`} />

      <div className="p-5 space-y-4 bg-slate-900/60">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{agentTypeInfo?.icon}</span>
            <div>
              <h3 className="font-bold text-lg text-white">{agent.name}</h3>
              <Badge className="mt-1.5 bg-sky-500/20 text-sky-300 border-sky-500/40 rounded-full px-2.5 py-0.5">
                {agentTypeInfo?.label}
              </Badge>
            </div>
          </div>
          {agent.isActive ? (
            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
          ) : (
            <AlertCircle className="h-6 w-6 text-slate-500" />
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700">
            <p className="text-xs text-slate-400 mb-1">Exécutions</p>
            <p className="font-bold text-2xl text-white">{agent.executionCount}</p>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700">
            <p className="text-xs text-slate-400 mb-1">Règles</p>
            <p className="font-bold text-2xl text-white">{agent.rules.length}</p>
          </div>
        </div>

        {/* Config */}
        <div className="bg-slate-950/60 rounded-xl p-3 space-y-2 text-xs border border-slate-800">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Auto-approve</span>
            <span className={`font-semibold ${agent.config.autoApprove ? 'text-emerald-400' : 'text-slate-400'}`}>
              {agent.config.autoApprove ? '✓ Oui' : '✗ Non'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Multiplicateur</span>
            <span className="font-semibold text-sky-300">{agent.config.rewardMultiplier}%</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onToggle(agent.id, !agent.isActive)}
            className="flex-1 gap-2 rounded-2xl border-slate-700 hover:border-sky-500/50 hover:bg-sky-500/10 text-slate-300 hover:text-sky-300"
          >
            {agent.isActive ? (
              <>
                <PowerOff className="h-4 w-4" />
                Désactiver
              </>
            ) : (
              <>
                <Power className="h-4 w-4" />
                Activer
              </>
            )}
          </Button>
          <Button
            size="sm"
            onClick={() => onExecute(agent.id)}
            disabled={!agent.isActive}
            className="flex-1 gap-2 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:shadow-none"
          >
            <Play className="h-4 w-4" />
            Exécuter
          </Button>
        </div>
      </div>
    </div>
  );
}

// Composant CreateAgentForm
function CreateAgentForm({ 
  onSuccess, 
  onCancel 
}: { 
  onSuccess: () => void; 
  onCancel: () => void; 
}) {
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    eventId: '',
    agentType: 'CHECK_IN',
    autoApprove: true,
    rewardMultiplier: 100,
    minReward: 100000000, // 0.1 SUI
    maxReward: 1000000000, // 1 SUI
    cooldownPeriod: 60000, // 1 minute
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const response = await fetch(`${API_BASE}/api/admin/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          eventId: formData.eventId,
          agentType: formData.agentType,
          config: {
            autoApprove: formData.autoApprove,
            rewardMultiplier: formData.rewardMultiplier,
            minReward: formData.minReward,
            maxReward: formData.maxReward,
            cooldownPeriod: formData.cooldownPeriod,
          },
        }),
      });

      if (response.ok) {
        toast.success('Agent créé avec succès !');
        onSuccess();
      } else {
        throw new Error('Failed to create agent');
      }
    } catch (error) {
      console.error('Create error:', error);
      toast.error('Échec de la création');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="rounded-3xl bg-slate-900/60 border-2 border-purple-500/50 overflow-hidden shadow-xl shadow-purple-500/20">
      <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 border-b border-purple-700/50 p-5">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-purple-400" />
          <h2 className="text-xl font-semibold text-white">Créer un Nouvel Agent IA</h2>
        </div>
      </div>
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <Label htmlFor="name" className="text-sm font-medium text-slate-300">Nom de l'Agent</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Agent Check-In Principal"
                required
                className="mt-1.5 rounded-xl bg-slate-950/60 border-slate-700 focus:border-purple-500 text-white placeholder:text-slate-500"
              />
            </div>

            <div>
              <Label htmlFor="eventId" className="text-sm font-medium text-slate-300">Event ID</Label>
              <Input
                id="eventId"
                value={formData.eventId}
                onChange={(e) => setFormData({ ...formData, eventId: e.target.value })}
                placeholder="0x..."
                required
                className="mt-1.5 rounded-xl bg-slate-950/60 border-slate-700 focus:border-purple-500 text-white placeholder:text-slate-500 font-mono text-sm"
              />
            </div>

            <div>
              <Label htmlFor="agentType" className="text-sm font-medium text-slate-300">Type d'Agent</Label>
              <select
                id="agentType"
                value={formData.agentType}
                onChange={(e) => setFormData({ ...formData, agentType: e.target.value })}
                className="mt-1.5 w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-950/60 text-white focus:border-purple-500"
              >
                {AGENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="rewardMultiplier" className="text-sm font-medium text-slate-300">Multiplicateur (%)</Label>
              <Input
                id="rewardMultiplier"
                type="number"
                value={formData.rewardMultiplier}
                onChange={(e) => setFormData({ ...formData, rewardMultiplier: parseInt(e.target.value) })}
                min="0"
                max="500"
                className="mt-1.5 rounded-xl bg-slate-950/60 border-slate-700 focus:border-purple-500 text-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            <input
              type="checkbox"
              id="autoApprove"
              checked={formData.autoApprove}
              onChange={(e) => setFormData({ ...formData, autoApprove: e.target.checked })}
              className="h-4 w-4 rounded border-slate-600 text-purple-500 focus:ring-purple-500"
            />
            <Label htmlFor="autoApprove" className="cursor-pointer text-sm font-medium text-slate-300">
              Auto-approuver les actions
            </Label>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onCancel} className="rounded-2xl border-slate-700 hover:border-slate-600 text-slate-300">
              Annuler
            </Button>
            <Button type="submit" disabled={creating} className="gap-2 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 shadow-lg shadow-purple-500/30">
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Créer l'Agent
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

