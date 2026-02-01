import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, Map, Users, Trophy, AlertTriangle,
  CheckCircle, Shield, Swords, Lightbulb, Zap,
  Eye, Sparkles, TrendingUp, TrendingDown,
  Clock, Crosshair, Activity
} from 'lucide-react';
import type { TacticalBriefing as TacticalBriefingType } from '../types';

// Agent UUIDs from valorant-api.com for fetching images
const agentUUIDs: Record<string, string> = {
  Jett: 'add6443a-41bd-e414-f6ad-e58d267f4e95',
  Raze: 'f94c3b30-42be-e959-889c-5aa313dba261',
  Reyna: 'a3bfb853-43b2-7238-a4f1-ad90e9e46bcc',
  Phoenix: 'eb93336a-449b-9c1b-0a54-a891f7921d69',
  Yoru: '7f94d92c-4234-0a36-9646-3a87eb8b5c89',
  Neon: 'bb2a4828-46eb-8cd1-e765-15848195d751',
  Iso: '0e38b510-41a8-5780-5e8f-568b2a4f2d6c',
  Omen: '8e253930-4c05-31dd-1b6c-968525494517',
  Brimstone: '9f0d8ba9-4140-b941-57d3-a7ad57c6b417',
  Astra: '41fb69c1-4189-7b37-f117-bcaf1e96f1bf',
  Viper: '707eab51-4836-f488-046a-cda6bf494859',
  Harbor: '95b78ed7-4637-86d9-7e41-71ba8c293152',
  Clove: '1dbf2edd-4729-0984-3115-daa5eed44993',
  Sova: '320b2a48-4d9b-a075-30f1-1f93a9b638fa',
  Breach: '5f8d3a7f-467b-97f3-062c-13acf203c006',
  Skye: '6f2a04ca-43e0-be17-7f36-b3908627744d',
  'KAY/O': '601dbbe7-43ce-be57-2a40-4abd24953621',
  Fade: 'dade69b4-4f5a-8528-247b-219e5a1facd6',
  Gekko: 'e370fa57-4757-3604-3648-499e1f642d3f',
  Killjoy: '1e58de9c-4950-5125-93e9-a0aee9f98746',
  Cypher: '117ed9e3-49f3-6512-3ccf-0cada7e3823b',
  Sage: '569fdd95-4d10-43ab-ca70-79becc718b46',
  Chamber: '22697a3d-45bf-8dd7-4fec-84a9e28c69d7',
  Deadlock: 'cc8b64c8-4b25-4ff9-6e7f-37b4da43d235',
  Vyse: 'efba5359-4016-a1e5-7626-b1ae76895940',
  Tejo: 'b444168c-4e35-8076-db47-ef9bf368f384',
};

const getAgentIcon = (agent: string): string => {
  const uuid = agentUUIDs[agent];
  return uuid ? `https://media.valorant-api.com/agents/${uuid}/displayicon.png` : '';
};

interface TacticalBriefingProps {
  briefing: TacticalBriefingType;
}

// Strip markdown formatting from text
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')  // **bold** -> bold
    .replace(/\*([^*]+)\*/g, '$1')       // *italic* -> italic
    .replace(/__([^_]+)__/g, '$1')       // __bold__ -> bold
    .replace(/_([^_]+)_/g, '$1')         // _italic_ -> italic
    .replace(/`([^`]+)`/g, '$1')         // `code` -> code
    .replace(/#+\s*/g, '')               // # headers -> remove
    .trim();
}

// Extract key insights from verbose text
function extractKeyPoints(text: string, maxPoints: number = 3): string[] {
  if (!text) return [];
  
  const cleanText = stripMarkdown(text);
  const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 20);
  
  const priorityKeywords = ['weakness', 'strength', 'exploit', 'vulnerable', 'dangerous', 'key', 'primary', 'main', 'focus', 'attack', 'defense'];
  
  const scored = sentences.map(s => ({
    text: s.trim(),
    score: priorityKeywords.filter(k => s.toLowerCase().includes(k)).length
  }));
  
  scored.sort((a, b) => b.score - a.score);
  
  return scored.slice(0, maxPoints).map(s => s.text + '.');
}

// Get attack/defense assessment from text
function getPlaystyleAssessment(text: string): { attack: 'strong' | 'average' | 'weak', defense: 'strong' | 'average' | 'weak' } {
  const lower = text.toLowerCase();
  
  let attack: 'strong' | 'average' | 'weak' = 'average';
  let defense: 'strong' | 'average' | 'weak' = 'average';
  
  if (lower.includes('attack') && (lower.includes('strong') || lower.includes('engine') || lower.includes('74%') || lower.includes('aggressive'))) {
    attack = 'strong';
  } else if (lower.includes('attack') && (lower.includes('weak') || lower.includes('fragile') || lower.includes('struggle'))) {
    attack = 'weak';
  }
  
  if (lower.includes('defense') && (lower.includes('strong') || lower.includes('solid') || lower.includes('dominant'))) {
    defense = 'strong';
  } else if (lower.includes('defense') && (lower.includes('weak') || lower.includes('fragile') || lower.includes('43%') || lower.includes('vulnerable'))) {
    defense = 'weak';
  }
  
  return { attack, defense };
}

export function TacticalBriefing({ briefing }: TacticalBriefingProps) {
  const [selectedMap, setSelectedMap] = useState<string | null>(
    briefing?.map_strategies?.[0]?.map_name || null
  );

  if (!briefing) {
    return (
      <div className="rounded-xl bg-surface-300/80 backdrop-blur p-12 text-center border border-white/5">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-valorant-gray" />
        <p className="text-valorant-gray">Tactical briefing not available</p>
        <p className="text-sm text-valorant-gray/60 mt-2">Generate a report to see AI-powered insights</p>
      </div>
    );
  }

  const teamIdentity = briefing.team_identity || briefing.playstyle_summary || '';
  const keyInsights = extractKeyPoints(teamIdentity);
  const playstyle = getPlaystyleAssessment(teamIdentity);
  const selectedStrategy = briefing.map_strategies?.find(s => s.map_name === selectedMap);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { icon: Target, label: 'Matches Analyzed', value: briefing.matches_analyzed, color: 'purple' },
          { icon: Map, label: 'Maps Covered', value: briefing.map_strategies?.length || 0, color: 'green' },
          { icon: Users, label: 'Key Players', value: briefing.star_players?.length || 0, color: 'amber' },
          { icon: Sparkles, label: 'AI Insights', value: 'GPT-5.2', color: 'cyan' },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="rounded-xl bg-surface-300/80 backdrop-blur p-4 border border-white/5"
          >
            <stat.icon className={`w-5 h-5 text-${stat.color}-400 mb-2`} />
            <p className={`text-2xl font-bold text-${stat.color}-400`}>{stat.value}</p>
            <p className="text-xs text-valorant-gray">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* The Game Plan - Visual Summary */}
      {briefing.primary_win_condition && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl bg-surface-300/80 backdrop-blur border border-white/5 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-valorant-red/20 to-transparent p-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-valorant-red/30 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-valorant-red" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-valorant-cream">The Game Plan</h3>
                <p className="text-sm text-valorant-gray">Your path to victory against {briefing.team_name}</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <p className="text-lg text-valorant-cream leading-relaxed">{stripMarkdown(briefing.primary_win_condition)}</p>
          </div>
        </motion.div>
      )}

      {/* Team DNA - Visual Cards Instead of Text Wall */}
      {teamIdentity && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="font-bold text-valorant-cream">Team DNA</h3>
          </div>

          {/* Playstyle Meters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl bg-surface-300/80 backdrop-blur p-5 border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Swords className="w-4 h-4 text-orange-400" />
                  <span className="text-sm font-medium text-valorant-cream">Attack Side</span>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  playstyle.attack === 'strong' ? 'bg-green-500/20 text-green-400' :
                  playstyle.attack === 'weak' ? 'bg-red-500/20 text-red-400' :
                  'bg-amber-500/20 text-amber-400'
                }`}>
                  {playstyle.attack === 'strong' ? 'DANGEROUS' : playstyle.attack === 'weak' ? 'EXPLOITABLE' : 'BALANCED'}
                </span>
              </div>
              <div className="h-2 bg-surface-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: playstyle.attack === 'strong' ? '85%' : playstyle.attack === 'weak' ? '35%' : '55%' }}
                  transition={{ duration: 0.8 }}
                  className={`h-full rounded-full ${
                    playstyle.attack === 'strong' ? 'bg-gradient-to-r from-orange-500 to-red-500' :
                    playstyle.attack === 'weak' ? 'bg-gradient-to-r from-gray-500 to-gray-400' :
                    'bg-gradient-to-r from-orange-400 to-orange-500'
                  }`}
                />
              </div>
              <p className="text-xs text-valorant-gray mt-2">
                {playstyle.attack === 'strong' ? 'Their attack is their engine - respect it' :
                 playstyle.attack === 'weak' ? 'Push them on attack side' : 'Standard attack execution'}
              </p>
            </div>

            <div className="rounded-xl bg-surface-300/80 backdrop-blur p-5 border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-valorant-cream">Defense Side</span>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  playstyle.defense === 'strong' ? 'bg-green-500/20 text-green-400' :
                  playstyle.defense === 'weak' ? 'bg-red-500/20 text-red-400' :
                  'bg-amber-500/20 text-amber-400'
                }`}>
                  {playstyle.defense === 'strong' ? 'SOLID' : playstyle.defense === 'weak' ? 'VULNERABLE' : 'BALANCED'}
                </span>
              </div>
              <div className="h-2 bg-surface-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: playstyle.defense === 'strong' ? '80%' : playstyle.defense === 'weak' ? '40%' : '55%' }}
                  transition={{ duration: 0.8, delay: 0.1 }}
                  className={`h-full rounded-full ${
                    playstyle.defense === 'strong' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                    playstyle.defense === 'weak' ? 'bg-gradient-to-r from-gray-500 to-gray-400' :
                    'bg-gradient-to-r from-blue-400 to-blue-500'
                  }`}
                />
              </div>
              <p className="text-xs text-valorant-gray mt-2">
                {playstyle.defense === 'strong' ? 'Avoid straight fights on their CT' :
                 playstyle.defense === 'weak' ? 'Attack their weak defense' : 'Standard defensive setups'}
              </p>
            </div>
          </div>

          {/* Key Insights - Condensed */}
          {keyInsights.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {keyInsights.map((insight, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + idx * 0.1 }}
                  className="rounded-lg bg-surface-200/50 p-4 border border-white/5"
                >
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-valorant-gray leading-relaxed">{insight}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Quick Wins & Critical Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {briefing.quick_wins && briefing.quick_wins.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-xl bg-surface-300/80 backdrop-blur p-6 border border-white/5 border-l-2 border-l-green-500/50"
          >
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-green-400" />
              <h3 className="font-semibold text-valorant-cream">Quick Wins</h3>
            </div>
            <div className="space-y-3">
              {briefing.quick_wins.slice(0, 3).map((win, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-valorant-cream">{stripMarkdown(win)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {briefing.critical_actions && briefing.critical_actions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-xl bg-surface-300/80 backdrop-blur p-6 border border-white/5 border-l-2 border-l-amber-500/50"
          >
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-amber-400" />
              <h3 className="font-semibold text-valorant-cream">Must-Do Actions</h3>
            </div>
            <div className="space-y-3">
              {briefing.critical_actions.slice(0, 3).map((action, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-surface-200/50 rounded-lg border border-white/5">
                  <div className="w-6 h-6 rounded bg-amber-500/20 flex items-center justify-center flex-shrink-0 text-xs font-bold text-amber-400">
                    {idx + 1}
                  </div>
                  <span className="text-sm text-valorant-gray">{stripMarkdown(action)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Star Players - Compact */}
      {briefing.star_players && briefing.star_players.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-xl bg-surface-300/80 backdrop-blur p-6 border border-white/5"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <Eye className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="font-bold text-valorant-cream">Threats to Neutralize</h3>
              <p className="text-xs text-valorant-gray">Key players and how to shut them down</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {briefing.star_players.slice(0, 3).map((player, idx) => {
              const isHighThreat = player.threat_level === 'high';
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + idx * 0.05 }}
                  className={`rounded-xl p-4 border transition-all ${
                    isHighThreat 
                      ? 'bg-red-500/10 border-red-500/30' 
                      : 'bg-surface-200/50 border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-xl overflow-hidden ${
                      isHighThreat ? 'ring-2 ring-red-500/50' : 'ring-1 ring-white/10'
                    }`}>
                      {getAgentIcon(player.agent) ? (
                        <img src={getAgentIcon(player.agent)} alt={player.agent} className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center ${isHighThreat ? 'bg-red-500/20' : 'bg-surface-200'}`}>
                          <Crosshair className={`w-5 h-5 ${isHighThreat ? 'text-red-400' : 'text-valorant-gray'}`} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-valorant-cream">{player.name}</h4>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-valorant-gray">{player.agent}</span>
                        <span className="text-valorant-gray">•</span>
                        <span className={`font-mono ${player.kd >= 1.2 ? 'text-green-400' : player.kd >= 1.0 ? 'text-amber-400' : 'text-red-400'}`}>
                          {player.kd.toFixed(2)} K/D
                        </span>
                      </div>
                    </div>
                    {isHighThreat && (
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded">
                        PRIORITY
                      </span>
                    )}
                  </div>
                  
                  <div className="pt-3 border-t border-white/5">
                    <div className="flex items-start gap-2">
                      <Swords className="w-3 h-3 text-green-400 mt-1 flex-shrink-0" />
                      <p className="text-xs text-valorant-gray leading-relaxed">{stripMarkdown(player.counter)}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Economy Intel - Condensed */}
      {(briefing.economy_weakness || briefing.economy_strength) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {briefing.economy_weakness && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="rounded-xl bg-surface-300/80 backdrop-blur p-5 border border-white/5 border-l-2 border-l-red-500/50"
            >
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-red-400" />
                <span className="font-medium text-valorant-cream text-sm">Eco Exploit</span>
              </div>
              <p className="text-sm text-valorant-gray">{stripMarkdown(briefing.economy_weakness)}</p>
            </motion.div>
          )}
          {briefing.economy_strength && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="rounded-xl bg-surface-300/80 backdrop-blur p-5 border border-white/5 border-l-2 border-l-amber-500/50"
            >
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span className="font-medium text-valorant-cream text-sm">Full Buy Warning</span>
              </div>
              <p className="text-sm text-valorant-gray">{stripMarkdown(briefing.economy_strength)}</p>
            </motion.div>
          )}
        </div>
      )}

      {/* Map Playbook - Story-Driven */}
      {briefing.map_strategies && briefing.map_strategies.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="rounded-xl bg-surface-300/80 backdrop-blur border border-white/5 overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Map className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="font-bold text-valorant-cream">Map Playbook</h3>
                <p className="text-xs text-valorant-gray">Your battle plan for each map</p>
              </div>
            </div>

            {/* Map Selector */}
            <div className="flex flex-wrap gap-2 mt-4">
              {briefing.map_strategies.map((strategy) => (
                <button
                  key={strategy.map_name}
                  onClick={() => setSelectedMap(strategy.map_name)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedMap === strategy.map_name
                      ? 'bg-valorant-red text-white shadow-lg shadow-valorant-red/30'
                      : 'bg-surface-200 text-valorant-gray hover:bg-surface-100 hover:text-valorant-cream'
                  }`}
                >
                  <span className="capitalize">{strategy.map_name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Map Strategy Content */}
          <AnimatePresence mode="wait">
            {selectedStrategy && (
              <motion.div
                key={selectedMap}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-6"
              >
                {/* The Story - Main Narrative */}
                {selectedStrategy.narrative && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-valorant-red" />
                      <span className="text-sm font-medium text-valorant-cream uppercase tracking-wider">The Story</span>
                    </div>
                    <div className="relative pl-4 border-l-2 border-valorant-red/30">
                      <p className="text-valorant-gray leading-relaxed">{stripMarkdown(selectedStrategy.narrative)}</p>
                    </div>
                  </div>
                )}

                {/* Two Column: Intel & Counter */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* What to Expect */}
                  {selectedStrategy.key_tendencies && selectedStrategy.key_tendencies.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Eye className="w-4 h-4 text-amber-400" />
                        <span className="text-sm font-medium text-valorant-cream">What to Expect</span>
                      </div>
                      <div className="space-y-2">
                        {selectedStrategy.key_tendencies.slice(0, 4).map((tendency, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 bg-amber-500/5 rounded-lg border border-amber-500/10">
                            <div className="w-5 h-5 rounded bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-amber-400 text-xs font-bold">{i + 1}</span>
                            </div>
                            <span className="text-sm text-valorant-gray">{stripMarkdown(tendency)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Your Response */}
                  {selectedStrategy.counter_strategies && selectedStrategy.counter_strategies.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Swords className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-medium text-valorant-cream">Your Response</span>
                      </div>
                      <div className="space-y-2">
                        {selectedStrategy.counter_strategies.slice(0, 4).map((counter, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 bg-green-500/5 rounded-lg border border-green-500/10">
                            <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-valorant-gray">{stripMarkdown(counter)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Recommended Agents to Play */}
                {selectedStrategy.agent_picks && selectedStrategy.agent_picks.length > 0 && (
                  <div className="mb-6 p-4 bg-green-500/5 rounded-xl border border-green-500/20">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-sm font-medium text-green-400">Recommended Agents</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {selectedStrategy.agent_picks.map((agent, i) => {
                        const iconUrl = getAgentIcon(agent);
                        return (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex flex-col items-center gap-2"
                          >
                            <div className="w-14 h-14 rounded-xl overflow-hidden bg-green-500/20 ring-2 ring-green-500/40 hover:ring-green-400 transition-all">
                              {iconUrl ? (
                                <img src={iconUrl} alt={agent} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-green-400">
                                  {agent.slice(0, 2)}
                                </div>
                              )}
                            </div>
                            <span className="text-xs font-medium text-valorant-cream">{agent}</span>
                          </motion.div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-valorant-gray mt-4">These agents counter their playstyle on this map</p>
                  </div>
                )}

                {/* Timing Intel */}
                {selectedStrategy.timing_notes && (
                  <div className="mb-6">
                    <div className="flex items-start gap-3 p-4 bg-cyan-500/5 rounded-xl border border-cyan-500/20">
                      <Clock className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-sm font-medium text-cyan-400">Timing Intel</span>
                        <p className="text-sm text-valorant-gray mt-1 leading-relaxed">{stripMarkdown(selectedStrategy.timing_notes)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Map Win Condition */}
                {selectedStrategy.win_condition && (
                  <div className="p-4 bg-gradient-to-r from-valorant-red/20 to-transparent rounded-xl border border-valorant-red/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="w-4 h-4 text-valorant-red" />
                      <span className="text-sm font-bold text-valorant-cream">Win Condition</span>
                    </div>
                    <p className="text-sm text-valorant-cream/90">{stripMarkdown(selectedStrategy.win_condition)}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
