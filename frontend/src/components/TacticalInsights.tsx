import { motion } from 'framer-motion';
import { Target, Skull, Crosshair, AlertTriangle, Zap, Shield, TrendingDown, Clock, Users } from 'lucide-react';
import type { ExploitablePatterns, PlayerTactics } from '../types';

interface TacticalInsightsProps {
  patterns?: ExploitablePatterns;
}

export function TacticalInsights({ patterns }: TacticalInsightsProps) {
  if (!patterns) {
    return (
      <div className="rounded-xl bg-surface-300/80 backdrop-blur p-12 text-center border border-white/5">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-valorant-gray" />
        <p className="text-valorant-gray">No tactical data available</p>
      </div>
    );
  }

  const playerTactics = patterns.player_tactics || [];
  const topFragger = playerTactics[0];

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { icon: Target, label: 'Players Tracked', value: playerTactics.length, color: 'purple' },
          { icon: Crosshair, label: 'Top First Bloods', value: topFragger?.first_bloods || 0, color: 'green' },
          { icon: Skull, label: 'Most First Deaths', value: Math.max(...playerTactics.map(p => p.first_deaths), 0), color: 'red' },
          { icon: Zap, label: 'Timing Tells', value: patterns.timing_tells.length, color: 'amber' },
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

      {/* Opening Duel Stats */}
      {playerTactics.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl bg-surface-300/80 backdrop-blur p-6 border border-white/5 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-amber-500 to-red-500" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl -translate-y-1/2" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h3 className="font-bold text-valorant-cream">Opening Duel Statistics</h3>
                <p className="text-xs text-valorant-gray">First blood and first death analysis</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {playerTactics.slice(0, 6).map((player, idx) => (
                <PlayerTacticsCard key={player.player_name} player={player} rank={idx + 1} index={idx} />
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Timing Tells & Counter Strategies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Timing Tells */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl bg-surface-300/80 backdrop-blur p-6 border border-white/5 border-l-2 border-l-amber-500/50"
        >
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-valorant-cream">Key Insights</h3>
          </div>
          <div className="space-y-3">
            {patterns.timing_tells.length > 0 ? (
              patterns.timing_tells.map((tell, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + idx * 0.05 }}
                  className="flex items-start gap-3 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20"
                >
                  <span className="w-6 h-6 rounded-full bg-amber-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Zap className="w-3 h-3 text-amber-400" />
                  </span>
                  <span className="text-sm text-valorant-gray">{tell}</span>
                </motion.div>
              ))
            ) : (
              <p className="text-sm text-valorant-gray/60 text-center py-4">No timing tells identified</p>
            )}
          </div>
        </motion.div>

        {/* Counter Strategies */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl bg-surface-300/80 backdrop-blur p-6 border border-white/5 border-l-2 border-l-green-500/50"
        >
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-green-400" />
            <h3 className="font-semibold text-valorant-cream">Counter Strategies</h3>
          </div>
          <div className="space-y-3">
            {patterns.counter_strategies.length > 0 ? (
              patterns.counter_strategies.map((strat, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + idx * 0.05 }}
                  className="flex items-start gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20"
                >
                  <span className="w-6 h-6 rounded-full bg-green-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Crosshair className="w-3 h-3 text-green-400" />
                  </span>
                  <span className="text-sm text-valorant-gray">{strat}</span>
                </motion.div>
              ))
            ) : (
              <p className="text-sm text-valorant-gray/60 text-center py-4">No counter strategies identified</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Weak Sites */}
      {Object.keys(patterns.weak_sites).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-xl bg-surface-300/80 backdrop-blur p-6 border border-white/5 border-l-2 border-l-red-500/50"
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h3 className="font-semibold text-valorant-cream">Vulnerable Sites</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(patterns.weak_sites).map(([mapName, site], idx) => (
              <motion.div
                key={mapName}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + idx * 0.05 }}
                whileHover={{ scale: 1.03 }}
                className="p-4 bg-red-500/10 rounded-xl border border-red-500/20 hover:border-red-500/40 transition-all"
              >
                <p className="text-xs text-valorant-gray mb-1 capitalize">{mapName}</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-red-400">{site}</span>
                  <span className="text-xs text-red-400/70">Site</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Behavioral Patterns */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-xl bg-surface-300/80 backdrop-blur p-6 border border-white/5"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h3 className="font-bold text-valorant-cream">Behavioral Patterns</h3>
            <p className="text-xs text-valorant-gray">Team tendencies under pressure</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="p-5 bg-orange-500/10 rounded-xl border border-orange-500/20"
          >
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="w-4 h-4 text-orange-400" />
              <p className="text-xs text-orange-400 font-semibold uppercase tracking-wider">After Losing Streak</p>
            </div>
            <p className="text-sm text-valorant-cream">{patterns.after_losing_streak || 'No pattern identified'}</p>
          </motion.div>
          
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="p-5 bg-red-500/10 rounded-xl border border-red-500/20"
          >
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <p className="text-xs text-red-400 font-semibold uppercase tracking-wider">Under Pressure</p>
            </div>
            <p className="text-sm text-valorant-cream">{patterns.under_pressure || 'No pattern identified'}</p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

function PlayerTacticsCard({ player, rank, index }: { player: PlayerTactics; rank: number; index: number }) {
  const winRate = player.opening_duel_win_rate * 100;
  const isPositive = winRate >= 50;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + index * 0.05 }}
      whileHover={{ scale: 1.02 }}
      className={`p-4 rounded-xl border transition-all ${
        rank === 1 
          ? 'bg-amber-500/10 border-amber-500/30' 
          : 'bg-surface-200/50 border-white/5 hover:border-white/10'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
            rank === 1 ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/30' : 
            rank === 2 ? 'bg-gray-400 text-black' : 
            rank === 3 ? 'bg-amber-700 text-white' : 
            'bg-surface-100 text-valorant-gray'
          }`}>
            {rank}
          </span>
          <span className="font-semibold text-valorant-cream">{player.player_name}</span>
        </div>
        <span className={`text-lg font-mono font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {winRate.toFixed(0)}%
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-green-500/10 rounded-lg text-center border border-green-500/20">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Target className="w-4 h-4 text-green-400" />
            <span className="text-xl font-bold font-mono text-green-400">{player.first_bloods}</span>
          </div>
          <p className="text-[10px] text-valorant-gray">First Bloods</p>
        </div>
        <div className="p-3 bg-red-500/10 rounded-lg text-center border border-red-500/20">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Skull className="w-4 h-4 text-red-400" />
            <span className="text-xl font-bold font-mono text-red-400">{player.first_deaths}</span>
          </div>
          <p className="text-[10px] text-valorant-gray">First Deaths</p>
        </div>
      </div>
      
      {/* Win Rate Bar */}
      <div className="mt-3">
        <div className="h-1.5 bg-surface-100 rounded-full overflow-hidden">
          <motion.div 
            className={`h-full rounded-full ${isPositive ? 'bg-green-500' : 'bg-red-500'}`}
            initial={{ width: 0 }}
            animate={{ width: `${winRate}%` }}
            transition={{ duration: 0.8, delay: 0.4 + index * 0.05 }}
          />
        </div>
        <p className="text-[9px] text-valorant-gray mt-1 text-center">Opening Duel Win Rate</p>
      </div>
    </motion.div>
  );
}
