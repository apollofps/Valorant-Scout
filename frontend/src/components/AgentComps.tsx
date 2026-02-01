import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Users, Map, ChevronRight, Percent, Sparkles, Target } from 'lucide-react';
import type { AgentTendencies, MapAgentData } from '../types';

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

const agentColors: Record<string, string> = {
  Jett: '#00D4FF', Raze: '#FFA500', Reyna: '#9B59B6', Phoenix: '#FF6B35',
  Yoru: '#1E3A8A', Neon: '#00FFFF', Iso: '#8B5CF6',
  Omen: '#4B0082', Brimstone: '#D2691E', Astra: '#9D4EDD',
  Viper: '#228B22', Harbor: '#0EA5E9', Clove: '#EC4899',
  Sova: '#2563EB', Breach: '#DC2626', Skye: '#22C55E',
  'KAY/O': '#64748B', Fade: '#1F2937', Gekko: '#84CC16',
  Killjoy: '#FACC15', Cypher: '#F5F5DC', Sage: '#06B6D4',
  Chamber: '#C4A000', Deadlock: '#7C3AED', Vyse: '#F472B6',
};

interface AgentCompsProps {
  tendencies?: AgentTendencies;
}

export function AgentComps({ tendencies }: AgentCompsProps) {
  const [selectedMap, setSelectedMap] = useState<string | null>(null);
  
  if (!tendencies) {
    return (
      <div className="rounded-xl bg-surface-300/80 backdrop-blur p-12 text-center border border-white/5">
        <Users className="w-12 h-12 mx-auto mb-4 text-valorant-gray" />
        <p className="text-valorant-gray">No agent data available</p>
      </div>
    );
  }

  const mapData = tendencies.map_compositions || {};
  const maps = Object.keys(mapData).sort((a, b) => 
    (mapData[b]?.games_played || 0) - (mapData[a]?.games_played || 0)
  );

  const sortedAgents = Object.entries(tendencies.agent_pick_rates)
    .sort(([, a], [, b]) => b - a);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { icon: Users, label: 'Unique Agents', value: sortedAgents.length, color: 'purple' },
          { icon: Map, label: 'Maps Analyzed', value: maps.length, color: 'green' },
          { icon: Trophy, label: 'Top Pick', value: sortedAgents[0]?.[0] || 'N/A', color: 'amber' },
          { icon: Sparkles, label: 'Flex Picks', value: tendencies.flex_picks.length, color: 'cyan' },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`rounded-xl bg-surface-300/80 backdrop-blur p-4 border border-white/5 hover:border-${stat.color}-500/30 transition-all`}
          >
            <stat.icon className={`w-5 h-5 text-${stat.color}-400 mb-2`} />
            <p className={`text-2xl font-bold text-${stat.color}-400`}>{stat.value}</p>
            <p className="text-xs text-valorant-gray">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Map-wise Compositions */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl bg-surface-300/80 backdrop-blur p-6 border border-white/5 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-valorant-red to-amber-500" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Map className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="font-bold text-valorant-cream">Map-Specific Compositions</h3>
              <p className="text-xs text-valorant-gray">Agent compositions and win rates for each map</p>
            </div>
          </div>
          
          {maps.length > 0 ? (
            <div className="mt-6 space-y-4">
              {/* Map Pills */}
              <div className="flex flex-wrap gap-2">
                {maps.map((mapName) => {
                  const data = mapData[mapName];
                  return (
                    <button
                      key={mapName}
                      onClick={() => setSelectedMap(selectedMap === mapName ? null : mapName)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                        selectedMap === mapName
                          ? 'bg-valorant-red text-white shadow-lg shadow-valorant-red/30'
                          : 'bg-surface-200 text-valorant-gray hover:bg-surface-100 hover:text-valorant-cream'
                      }`}
                    >
                      <span className="capitalize">{mapName}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        selectedMap === mapName ? 'bg-white/20' : 'bg-surface-100'
                      }`}>
                        {data?.games_played || 0}
                      </span>
                    </button>
                  );
                })}
              </div>
              
              {/* Map Details */}
              <AnimatePresence mode="wait">
                {selectedMap && mapData[selectedMap] && (
                  <MapCompositionCard key={selectedMap} data={mapData[selectedMap]} />
                )}
              </AnimatePresence>
              
              {/* All Maps Overview */}
              {!selectedMap && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {maps.slice(0, 6).map((mapName, idx) => {
                    const data = mapData[mapName];
                    if (!data) return null;
                    return (
                      <MapOverviewCard 
                        key={mapName}
                        data={data}
                        onClick={() => setSelectedMap(mapName)}
                        index={idx}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <p className="text-valorant-gray text-sm text-center py-8">
              No map-specific composition data available
            </p>
          )}
        </div>
      </motion.div>

      {/* Overall Pick Rates */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-xl bg-surface-300/80 backdrop-blur p-6 border border-white/5"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-valorant-red/20 flex items-center justify-center">
            <Percent className="w-5 h-5 text-valorant-red" />
          </div>
          <h3 className="font-bold text-valorant-cream">Overall Agent Pick Rates</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {sortedAgents.slice(0, 8).map(([agent, rate], index) => (
            <motion.div
              key={agent}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.05 }}
              whileHover={{ scale: 1.03 }}
              className="flex items-center gap-3 p-3 bg-surface-200/50 rounded-xl border border-white/5 hover:border-purple-500/30 transition-all cursor-default"
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-lg overflow-hidden ring-2 ring-transparent hover:ring-valorant-red/30 transition-all">
                  {getAgentIcon(agent) ? (
                    <img src={getAgentIcon(agent)} alt={agent} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-surface-100 text-xs font-bold text-valorant-gray">
                      {agent.slice(0, 2)}
                    </div>
                  )}
                </div>
                {index === 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
                    <Trophy className="w-3 h-3 text-black" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-valorant-cream font-medium truncate">{agent}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-surface-100 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full rounded-full"
                      style={{ backgroundColor: agentColors[agent] || '#FF4655' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${rate * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.5 + index * 0.05 }}
                    />
                  </div>
                  <span className="text-xs font-mono text-valorant-red">{(rate * 100).toFixed(0)}%</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Flex Picks & Player Pools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl bg-surface-300/80 backdrop-blur p-6 border border-white/5 border-l-2 border-l-amber-500/50"
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-valorant-cream">Flex Picks</h3>
          </div>
          <p className="text-xs text-valorant-gray mb-4">Agents played by multiple players</p>
          <div className="flex flex-wrap gap-2">
            {tendencies.flex_picks.length > 0 ? (
              tendencies.flex_picks.map((agent, idx) => (
                <motion.div 
                  key={agent} 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + idx * 0.05 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-200/50 border border-amber-500/20 hover:border-amber-500/50 transition-all"
                >
                  <div className="w-8 h-8 rounded overflow-hidden">
                    {getAgentIcon(agent) && (
                      <img src={getAgentIcon(agent)} alt={agent} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-valorant-cream">{agent}</span>
                </motion.div>
              ))
            ) : (
              <span className="text-valorant-gray text-sm">No flex picks identified</span>
            )}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-xl bg-surface-300/80 backdrop-blur p-6 border border-white/5 border-l-2 border-l-cyan-500/50"
        >
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-cyan-400" />
            <h3 className="font-semibold text-valorant-cream">Player Agent Pools</h3>
          </div>
          <div className="space-y-3">
            {Object.entries(tendencies.player_agent_pools).slice(0, 5).map(([player, agents], idx) => (
              <motion.div 
                key={player} 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + idx * 0.05 }}
                className="flex items-center gap-3 p-2 bg-surface-200/30 rounded-lg"
              >
                <span className="text-sm text-valorant-cream w-20 truncate font-medium">{player}</span>
                <div className="flex gap-1 flex-1">
                  {agents.slice(0, 4).map((agent) => (
                    <div key={agent} className="w-7 h-7 rounded overflow-hidden ring-1 ring-white/10" title={agent}>
                      {getAgentIcon(agent) ? (
                        <img src={getAgentIcon(agent)} alt={agent} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-surface-100 flex items-center justify-center text-[8px] text-valorant-gray">
                          {agent.slice(0, 2)}
                        </div>
                      )}
                    </div>
                  ))}
                  {agents.length > 4 && (
                    <span className="text-xs text-valorant-gray self-center ml-1">+{agents.length - 4}</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// Map Overview Card
function MapOverviewCard({ data, onClick, index }: { data: MapAgentData; onClick: () => void; index: number }) {
  const topComp = data.top_compositions[0];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + index * 0.05 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="bg-surface-200/50 rounded-xl p-4 cursor-pointer border border-white/5 hover:border-purple-500/30 transition-all group"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-valorant-cream capitalize flex items-center gap-2">
          {data.map_name}
          <ChevronRight className="w-4 h-4 text-valorant-gray group-hover:text-valorant-red group-hover:translate-x-1 transition-all" />
        </h4>
        <span className="text-xs px-2 py-1 bg-surface-100 rounded text-valorant-gray">{data.games_played} games</span>
      </div>
      
      {topComp && (
        <div>
          <p className="text-[10px] text-valorant-gray uppercase tracking-wider mb-2">Top Composition</p>
          <div className="flex items-center gap-1">
            {topComp.agents.slice(0, 5).map((agent) => (
              <div key={agent} className="w-8 h-8 rounded-lg overflow-hidden ring-1 ring-white/10" title={agent}>
                {getAgentIcon(agent) ? (
                  <img src={getAgentIcon(agent)} alt={agent} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-surface-100 flex items-center justify-center text-[8px]">
                    {agent.slice(0, 2)}
                  </div>
                )}
              </div>
            ))}
            <span className={`ml-2 text-sm font-mono font-bold ${
              topComp.win_rate >= 0.5 ? 'text-green-400' : 'text-red-400'
            }`}>
              {(topComp.win_rate * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// Detailed Map Composition Card
function MapCompositionCard({ data }: { data: MapAgentData }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-surface-200/50 rounded-xl p-6 border border-purple-500/20"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <Map className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h4 className="text-xl font-bold text-valorant-cream capitalize">{data.map_name}</h4>
            <p className="text-xs text-valorant-gray">{data.games_played} games analyzed</p>
          </div>
        </div>
      </div>
      
      {/* Compositions */}
      <div className="space-y-4">
        {data.top_compositions.slice(0, 3).map((comp, idx) => (
          <motion.div 
            key={idx} 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`p-4 rounded-lg border ${
              idx === 0 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-surface-300/50 border-white/5'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {idx === 0 && <Trophy className="w-4 h-4 text-amber-400" />}
                <span className="text-sm text-valorant-gray">
                  {idx === 0 ? 'Primary Composition' : `Composition #${idx + 1}`}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-valorant-gray">{comp.games_played}g</span>
                <span className={`font-mono font-bold ${
                  comp.win_rate >= 0.6 ? 'text-green-400' : 
                  comp.win_rate >= 0.4 ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {(comp.win_rate * 100).toFixed(0)}% WR
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {comp.agents.map((agent) => (
                <div key={agent} className="flex flex-col items-center gap-1 flex-1">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-surface-100 ring-2 ring-transparent hover:ring-purple-500/30 transition-all">
                    {getAgentIcon(agent) ? (
                      <img src={getAgentIcon(agent)} alt={agent} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold text-valorant-gray">
                        {agent.slice(0, 2)}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-valorant-cream text-center truncate w-full">{agent}</span>
                </div>
              ))}
            </div>
            
            {/* Win/Loss Bar */}
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-2 bg-surface-100 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${comp.win_rate * 100}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
              <span className="text-xs text-valorant-gray font-mono">
                {comp.wins}W - {comp.games_played - comp.wins}L
              </span>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Pick Rates */}
      <div className="mt-6 pt-6 border-t border-white/5">
        <h5 className="text-sm font-medium text-valorant-gray mb-4 flex items-center gap-2">
          <Percent className="w-4 h-4" />
          Agent Pick Rates on {data.map_name}
        </h5>
        <div className="flex flex-wrap gap-2">
          {Object.entries(data.agent_pick_rates)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([agent, rate], idx) => (
              <motion.div 
                key={agent}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.03 }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface-300/50 rounded-lg border border-white/5"
              >
                <div className="w-6 h-6 rounded overflow-hidden">
                  {getAgentIcon(agent) && (
                    <img src={getAgentIcon(agent)} alt={agent} className="w-full h-full object-cover" />
                  )}
                </div>
                <span className="text-xs text-valorant-cream">{agent}</span>
                <span className="text-xs font-mono" style={{ color: agentColors[agent] || '#FF4655' }}>
                  {(rate * 100).toFixed(0)}%
                </span>
              </motion.div>
            ))}
        </div>
      </div>
    </motion.div>
  );
}
