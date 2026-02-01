import { motion } from 'framer-motion';
import { User, Crosshair, Skull, Target, Sparkles, AlertCircle, UserMinus, Trophy, Shield, Users } from 'lucide-react';
import type { PlayerTendency } from '../types';

// Agent UUIDs from valorant-api.com for display icons
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

// Role colors and config
const roleConfig: Record<string, { color: string; label: string; icon: typeof Shield }> = {
  duelist: { color: '#FF4655', label: 'Duelist', icon: Crosshair },
  controller: { color: '#9B59B6', label: 'Controller', icon: Shield },
  initiator: { color: '#3498DB', label: 'Initiator', icon: Target },
  sentinel: { color: '#2ECC71', label: 'Sentinel', icon: Shield },
  flex: { color: '#F1C40F', label: 'Flex', icon: Users },
};

interface PlayerCardsProps {
  players: Record<string, PlayerTendency>;
}

export function PlayerCards({ players }: PlayerCardsProps) {
  const playerEntries = Object.entries(players);

  if (playerEntries.length === 0) {
    return (
      <div className="rounded-xl bg-surface-300/80 backdrop-blur p-12 text-center border border-white/5">
        <User className="w-12 h-12 mx-auto mb-4 text-valorant-gray" />
        <p className="text-valorant-gray">No player data available</p>
      </div>
    );
  }

  // Sort: active first (by K/D), then former (by K/D), then new at end
  const sortedPlayers = playerEntries.sort(([, a], [, b]) => {
    const statusOrder = { active: 0, former: 1, new: 2 };
    const aStatus = a.status || (a.is_new_player ? 'new' : a.is_former_player ? 'former' : 'active');
    const bStatus = b.status || (b.is_new_player ? 'new' : b.is_former_player ? 'former' : 'active');
    
    if (statusOrder[aStatus] !== statusOrder[bStatus]) {
      return statusOrder[aStatus] - statusOrder[bStatus];
    }
    return b.kd_ratio - a.kd_ratio;
  });
  
  const activePlayers = sortedPlayers.filter(([, s]) => s.status === 'active' || (!s.status && !s.is_new_player && !s.is_former_player));
  const formerPlayers = sortedPlayers.filter(([, s]) => s.status === 'former' || s.is_former_player);
  const newPlayers = sortedPlayers.filter(([, s]) => s.status === 'new' || s.is_new_player);

  // Calculate team stats
  const playersWithHistory = [...activePlayers, ...formerPlayers];
  const avgKD = playersWithHistory.length > 0 
    ? playersWithHistory.reduce((sum, [, s]) => sum + s.kd_ratio, 0) / playersWithHistory.length 
    : 0;
  const topFragger = playersWithHistory[0];

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { icon: Users, label: 'Total Players', value: playerEntries.length, color: 'purple' },
          { icon: Trophy, label: 'Top K/D', value: topFragger ? topFragger[1].kd_ratio.toFixed(2) : 'N/A', color: 'amber' },
          { icon: Target, label: 'Avg K/D', value: avgKD.toFixed(2), color: 'green' },
          { icon: Sparkles, label: 'New Players', value: newPlayers.length, color: 'cyan' },
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

      {/* Active/Historical Players */}
      {playersWithHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-px bg-gradient-to-r from-green-500 to-transparent" />
            <h3 className="text-sm font-medium text-valorant-gray uppercase tracking-widest">
              Players with VCT Match History
            </h3>
            <span className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
          </div>
          <p className="text-xs text-valorant-gray/60 mb-4">
            Based on VCT Americas 2024-2025 & Masters Madrid data
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {playersWithHistory.map(([playerId, stats], index) => (
              <PlayerCard
                key={playerId}
                playerId={playerId}
                stats={stats}
                index={index}
                isTopPerformer={index === 0 && activePlayers.length > 0}
              />
            ))}
          </div>
        </motion.div>
      )}
      
      {/* New Roster Members */}
      {newPlayers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-4 mt-8">
            <span className="w-8 h-px bg-gradient-to-r from-amber-500 to-transparent" />
            <h3 className="text-sm font-medium text-valorant-gray uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Current Roster (No VCT Data)
            </h3>
            <span className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
          </div>
          <p className="text-xs text-valorant-gray/60 mb-4">
            Data available for VCT Americas 2024-2025 & Masters Madrid only
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {newPlayers.slice(0, 6).map(([playerId, stats], index) => (
              <PlayerCard
                key={playerId}
                playerId={playerId}
                stats={stats}
                index={index}
                isTopPerformer={false}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Comparison Table */}
      {playersWithHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl bg-surface-300/80 backdrop-blur p-6 border border-white/5 overflow-x-auto"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="font-bold text-valorant-cream">Player Statistics Comparison</h3>
          </div>
          
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="text-left text-xs text-valorant-gray border-b border-white/10">
                <th className="pb-3 pr-4 font-medium">Player</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 pr-4 font-medium">Role</th>
                <th className="pb-3 pr-4 text-center font-medium">Maps</th>
                <th className="pb-3 pr-4 text-center font-medium">K/D</th>
                <th className="pb-3 pr-4 text-center font-medium" title="Average Damage per Round">ADR</th>
                <th className="pb-3 pr-4 text-center font-medium">Kills</th>
                <th className="pb-3 text-center font-medium">Deaths</th>
              </tr>
            </thead>
            <tbody>
              {playersWithHistory.map(([playerId, stats], idx) => {
                const role = roleConfig[stats.primary_role] || roleConfig.flex;
                const status = stats.status || (stats.is_former_player ? 'former' : 'active');
                const isFormer = status === 'former';
                
                return (
                  <motion.tr 
                    key={playerId} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + idx * 0.05 }}
                    className={`border-b border-white/5 last:border-0 hover:bg-surface-200/30 transition-colors ${isFormer ? 'opacity-60' : ''}`}
                  >
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        {idx === 0 && !isFormer && (
                          <Trophy className="w-4 h-4 text-amber-400" />
                        )}
                        {stats.profile_image_url ? (
                          <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-surface-200">
                            <img 
                              src={stats.profile_image_url} 
                              alt={playerId}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-surface-200 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-valorant-gray" />
                          </div>
                        )}
                        <span className={`font-medium ${isFormer ? 'text-valorant-gray' : 'text-valorant-cream'}`}>
                          {playerId}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      {isFormer ? (
                        <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-lg font-medium">
                          Former
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-lg font-medium">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <span 
                        className="px-2 py-1 rounded-lg text-xs font-medium"
                        style={{ 
                          backgroundColor: `${role.color}20`, 
                          color: isFormer ? '#888' : role.color 
                        }}
                      >
                        {role.label}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-center font-mono text-valorant-cream">
                      {stats.games_played || 0}
                    </td>
                    <td className="py-3 pr-4 text-center">
                      <span className={`font-mono font-bold ${
                        stats.kd_ratio >= 1.2 ? 'text-green-400' : 
                        stats.kd_ratio >= 1.0 ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {stats.kd_ratio.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-center">
                      <span className={`font-mono font-bold ${
                        stats.avg_damage_per_round >= 140 ? 'text-green-400' : 
                        stats.avg_damage_per_round >= 110 ? 'text-amber-400' : 'text-valorant-gray'
                      }`}>
                        {stats.avg_damage_per_round > 0 ? stats.avg_damage_per_round.toFixed(0) : '-'}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-center font-mono text-green-400">
                      {stats.kills}
                    </td>
                    <td className="py-3 text-center font-mono text-red-400">
                      {stats.deaths}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </motion.div>
      )}
    </div>
  );
}

function PlayerCard({ 
  playerId, 
  stats, 
  index, 
  isTopPerformer 
}: { 
  playerId: string; 
  stats: PlayerTendency; 
  index: number;
  isTopPerformer: boolean;
}) {
  const role = roleConfig[stats.primary_role] || roleConfig.flex;
  const status = stats.status || (stats.is_new_player ? 'new' : stats.is_former_player ? 'former' : 'active');
  const isNewPlayer = status === 'new';
  const isFormerPlayer = status === 'former';
  const RoleIcon = role.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={`rounded-xl bg-surface-300/80 backdrop-blur overflow-hidden border transition-all ${
        isTopPerformer && !isNewPlayer ? 'border-valorant-red/50 ring-1 ring-valorant-red/20' : 
        isNewPlayer ? 'border-amber-500/30' :
        isFormerPlayer ? 'border-gray-500/30 opacity-80' :
        'border-white/5 hover:border-white/10'
      }`}
    >
      {/* Header */}
      <div 
        className="p-4 relative"
        style={{ 
          background: isNewPlayer 
            ? 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, transparent 100%)'
            : isFormerPlayer 
            ? 'linear-gradient(135deg, rgba(100,100,100,0.1) 0%, transparent 100%)'
            : `linear-gradient(135deg, ${role.color}15 0%, transparent 100%)`
        }}
      >
        {isTopPerformer && !isNewPlayer && !isFormerPlayer && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className="absolute top-2 right-2 px-2 py-1 bg-valorant-red rounded-lg text-xs text-white font-bold flex items-center gap-1"
          >
            <Trophy className="w-3 h-3" />
            MVP
          </motion.div>
        )}
        {isNewPlayer && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-amber-500/20 border border-amber-500/50 rounded-lg text-xs text-amber-400 font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            NEW
          </div>
        )}
        {isFormerPlayer && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-gray-500/20 border border-gray-500/50 rounded-lg text-xs text-gray-400 font-medium flex items-center gap-1">
            <UserMinus className="w-3 h-3" />
            FORMER
          </div>
        )}
        
        <div className="flex items-center gap-3">
          <div 
            className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg overflow-hidden"
            style={{ 
              backgroundColor: isNewPlayer ? 'rgba(245,158,11,0.2)' : isFormerPlayer ? 'rgba(100,100,100,0.2)' : `${role.color}25`,
              boxShadow: isNewPlayer || isFormerPlayer ? 'none' : `0 0 20px ${role.color}20`
            }}
          >
            {stats.profile_image_url ? (
              <img 
                src={stats.profile_image_url} 
                alt={playerId}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to role icon if image fails to load
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <RoleIcon 
              className={`w-7 h-7 ${stats.profile_image_url ? 'hidden' : ''}`} 
              style={{ color: isNewPlayer ? '#F59E0B' : isFormerPlayer ? '#666' : role.color }} 
            />
          </div>
          <div>
            <h4 className={`font-bold text-lg ${isFormerPlayer ? 'text-valorant-gray' : 'text-valorant-cream'}`}>
              {playerId}
            </h4>
            <span 
              className="text-xs font-medium px-2 py-0.5 rounded-md"
              style={{ 
                backgroundColor: isNewPlayer ? 'rgba(245,158,11,0.2)' : isFormerPlayer ? 'rgba(100,100,100,0.2)' : `${role.color}20`,
                color: isNewPlayer ? '#F59E0B' : isFormerPlayer ? '#888' : role.color 
              }}
            >
              {role.label}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 space-y-4">
        {isNewPlayer ? (
          <div className="text-center py-6">
            <AlertCircle className="w-10 h-10 mx-auto mb-3 text-amber-400/40" />
            <p className="text-sm text-valorant-gray mb-1">New to roster</p>
            <p className="text-xs text-valorant-gray/60">No match history with this team yet</p>
          </div>
        ) : (
          <>
            {/* Main Stats */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'K/D', value: stats.kd_ratio.toFixed(2), color: stats.kd_ratio >= 1.0 ? 'green' : 'red' },
                { 
                  label: 'ADR', 
                  value: stats.avg_damage_per_round > 0 ? stats.avg_damage_per_round.toFixed(0) : '-',
                  color: stats.avg_damage_per_round >= 140 ? 'green' : stats.avg_damage_per_round >= 110 ? 'amber' : 'purple'
                },
                { label: 'Maps', value: stats.games_played || 0, color: 'purple' },
              ].map((stat) => (
                <div key={stat.label} className={`p-2 bg-${stat.color}-500/10 rounded-lg text-center border border-${stat.color}-500/20`}>
                  <p className={`text-lg font-bold font-mono text-${stat.color}-400`}>{stat.value}</p>
                  <p className="text-[10px] text-valorant-gray">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Combat Stats */}
            <div className="space-y-2">
              <StatRow icon={Crosshair} label="Kills" value={stats.kills.toString()} color="green" />
              <StatRow icon={Skull} label="Deaths" value={stats.deaths.toString()} color="red" />
              <StatRow icon={Target} label="Assists" value={stats.assists.toString()} color="blue" />
            </div>

            {/* Primary Agent */}
            {stats.primary_agent && (
              <div className="pt-3 border-t border-white/5">
                <p className="text-xs text-valorant-gray mb-2">Primary Agent</p>
                <div className="flex items-center gap-2 p-2 bg-surface-200/50 rounded-lg border border-white/5">
                  {getAgentIcon(stats.primary_agent) ? (
                    <img
                      src={getAgentIcon(stats.primary_agent)}
                      alt={stats.primary_agent}
                      className="w-8 h-8 rounded-lg object-cover border border-white/10"
                    />
                  ) : null}
                  <span className="text-sm font-medium text-valorant-cream">{stats.primary_agent}</span>
                </div>
              </div>
            )}

            {/* Agent Pool */}
            {Object.keys(stats.agents_played || {}).length > 0 && (
              <div className="pt-3 border-t border-white/5">
                <p className="text-xs text-valorant-gray mb-2">Agent Pool</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(stats.agents_played || {})
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 6)
                    .map(([agent, count]) => (
                      <div
                        key={agent}
                        className="flex items-center gap-2 px-2 py-1.5 bg-surface-200/50 rounded-lg border border-white/5"
                        title={`${count} games`}
                      >
                        {getAgentIcon(agent) ? (
                          <img
                            src={getAgentIcon(agent)}
                            alt={agent}
                            className="w-6 h-6 rounded object-cover border border-white/10 flex-shrink-0"
                          />
                        ) : null}
                        <span className="text-xs text-valorant-cream font-medium">{agent}</span>
                        <span className="text-[10px] text-valorant-gray">({count})</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

function StatRow({ icon: Icon, label, value, color }: { icon: typeof Crosshair; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between p-2 bg-surface-200/30 rounded-lg">
      <div className="flex items-center gap-2">
        <Icon className={`w-3.5 h-3.5 text-${color}-400`} />
        <span className="text-sm text-valorant-gray">{label}</span>
      </div>
      <span className={`text-sm font-mono font-bold text-${color}-400`}>{value}</span>
    </div>
  );
}
