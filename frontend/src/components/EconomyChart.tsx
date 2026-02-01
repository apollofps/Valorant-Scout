import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, TrendingDown, Zap, Target, Shield, Coins, PiggyBank } from 'lucide-react';
import type { EconomyPatterns } from '../types';

interface EconomyChartProps {
  patterns?: EconomyPatterns;
}

export function EconomyChart({ patterns }: EconomyChartProps) {
  if (!patterns) {
    return (
      <div className="rounded-xl bg-surface-300/80 backdrop-blur p-12 text-center border border-white/5">
        <DollarSign className="w-12 h-12 mx-auto mb-4 text-valorant-gray" />
        <p className="text-valorant-gray">No economy data available</p>
      </div>
    );
  }

  const stats = [
    { 
      label: 'Pistol Win Rate', 
      value: patterns.pistol_win_rate * 100, 
      icon: Target,
      iconColor: 'text-valorant-red',
      textColor: 'text-valorant-red',
      barColor: 'bg-gradient-to-r from-red-600 to-red-400',
      description: 'Win rate on pistol rounds',
      trend: patterns.pistol_win_rate > 0.5 ? 'up' : 'down'
    },
    { 
      label: 'R2 Conversion', 
      value: patterns.round2_conversion_rate * 100, 
      icon: TrendingUp,
      iconColor: 'text-blue-400',
      textColor: 'text-blue-400',
      barColor: 'bg-gradient-to-r from-blue-600 to-blue-400',
      description: 'Win rate after winning pistol',
      trend: patterns.round2_conversion_rate > 0.7 ? 'up' : 'down'
    },
    { 
      label: 'Force Buy Rate', 
      value: patterns.force_buy_rate * 100, 
      icon: Zap,
      iconColor: 'text-amber-400',
      textColor: 'text-amber-400',
      barColor: 'bg-gradient-to-r from-amber-600 to-amber-400',
      description: 'How often they force buy',
      trend: 'neutral'
    },
    { 
      label: 'Eco Win Rate', 
      value: patterns.eco_round_win_rate * 100, 
      icon: Coins,
      iconColor: 'text-green-400',
      textColor: 'text-green-400',
      barColor: 'bg-gradient-to-r from-green-600 to-green-400',
      description: 'Win rate on eco rounds',
      trend: patterns.eco_round_win_rate > 0.15 ? 'up' : 'down'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ scale: 1.03, y: -2 }}
            className="rounded-xl bg-surface-300/80 backdrop-blur p-5 border border-white/5 hover:border-white/20 transition-all relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                {stat.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-400" />}
                {stat.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-400" />}
              </div>
              <motion.p 
                className={`text-3xl font-black font-mono ${stat.textColor}`}
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 + idx * 0.1, type: 'spring' }}
              >
                {stat.value.toFixed(0)}%
              </motion.p>
              <p className="text-xs text-valorant-gray mt-1">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Visual Bars */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-xl bg-surface-300/80 backdrop-blur p-6 border border-white/5"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-bold text-valorant-cream">Economic Performance</h3>
            <p className="text-xs text-valorant-gray">Visual breakdown of economy stats</p>
          </div>
        </div>

        <div className="space-y-5">
          {stats.map((stat, idx) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + idx * 0.1 }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
                  <span className="text-sm text-valorant-cream">{stat.label}</span>
                </div>
                <span className={`font-mono font-bold ${stat.textColor}`}>
                  {stat.value.toFixed(0)}%
                </span>
              </div>
              <div className="h-3 bg-surface-200 rounded-full overflow-hidden">
                <motion.div 
                  className={`h-full rounded-full ${stat.barColor}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${stat.value}%` }}
                  transition={{ duration: 1, delay: 0.5 + idx * 0.1 }}
                />
              </div>
              <p className="text-[10px] text-valorant-gray/60 mt-1">{stat.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Strategy Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pistol Strategies */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-xl bg-surface-300/80 backdrop-blur p-6 border border-white/5 border-l-2 border-l-valorant-red/50"
        >
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-valorant-red" />
            <h3 className="font-semibold text-valorant-cream">Pistol Round Strategies</h3>
          </div>
          <div className="space-y-3">
            <div className="p-4 bg-orange-500/10 rounded-xl border border-orange-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-semibold text-orange-400">Attack</span>
              </div>
              <p className="text-sm text-valorant-gray">{patterns.pistol_attack_strategy || 'No specific strategy identified'}</p>
            </div>
            <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold text-blue-400">Defense</span>
              </div>
              <p className="text-sm text-valorant-gray">{patterns.pistol_defense_strategy || 'No specific strategy identified'}</p>
            </div>
          </div>
        </motion.div>

        {/* Post-Pistol */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-xl bg-surface-300/80 backdrop-blur p-6 border border-white/5 border-l-2 border-l-green-500/50"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <h3 className="font-semibold text-valorant-cream">Post-Pistol Behavior</h3>
          </div>
          <div className="space-y-3">
            <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-sm font-semibold text-green-400">After Win</span>
              </div>
              <p className="text-sm text-valorant-gray">{patterns.round2_after_pistol_win_strategy || 'No specific strategy identified'}</p>
            </div>
            <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-red-400" />
                <span className="text-sm font-semibold text-red-400">After Loss</span>
              </div>
              <p className="text-sm text-valorant-gray">{patterns.round2_after_pistol_loss_strategy || 'No specific strategy identified'}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Economic Insights */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="rounded-xl bg-surface-300/80 backdrop-blur p-6 border border-white/5 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-green-500 to-blue-500" />
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <PiggyBank className="w-5 h-5 text-purple-400" />
          </div>
          <h3 className="font-bold text-valorant-cream">Economic Insights</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Eco Discipline */}
          {(() => {
            const isHigh = patterns.force_buy_rate < 0.25;
            const isMedium = patterns.force_buy_rate < 0.4;
            return (
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className={`p-4 bg-surface-200/50 rounded-xl border transition-all ${
                  isHigh ? 'border-green-500/20 hover:border-green-500/40' : 
                  isMedium ? 'border-amber-500/20 hover:border-amber-500/40' : 
                  'border-red-500/20 hover:border-red-500/40'
                }`}
              >
                <p className="text-xs text-valorant-gray mb-2">Eco Discipline</p>
                <p className={`text-2xl font-bold mb-1 ${
                  isHigh ? 'text-green-400' : isMedium ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {isHigh ? 'High' : isMedium ? 'Medium' : 'Low'}
                </p>
                <p className="text-xs text-valorant-gray/60">
                  {isHigh ? 'Team rarely forces, prefers full buys' : 
                   isMedium ? 'Balanced approach to eco rounds' : 
                   'Aggressive with force buys'}
                </p>
              </motion.div>
            );
          })()}
          
          {/* Eco/Force Clutch */}
          {(() => {
            const isGood = patterns.eco_round_win_rate > 0.2;
            const isOkay = patterns.eco_round_win_rate > 0.1;
            return (
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className={`p-4 bg-surface-200/50 rounded-xl border transition-all ${
                  isGood ? 'border-green-500/20 hover:border-green-500/40' : 
                  isOkay ? 'border-amber-500/20 hover:border-amber-500/40' : 
                  'border-red-500/20 hover:border-red-500/40'
                }`}
              >
                <p className="text-xs text-valorant-gray mb-2">Eco/Force Clutch</p>
                <p className={`text-2xl font-bold mb-1 ${
                  isGood ? 'text-green-400' : isOkay ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {(patterns.eco_round_win_rate * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-valorant-gray/60">Win rate when on eco or force buy</p>
              </motion.div>
            );
          })()}
          
          {/* Post-Pistol Impact */}
          {(() => {
            const isStrong = patterns.round2_conversion_rate > 0.6;
            const isAverage = patterns.round2_conversion_rate > 0.4;
            return (
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className={`p-4 bg-surface-200/50 rounded-xl border transition-all ${
                  isStrong ? 'border-green-500/20 hover:border-green-500/40' : 
                  isAverage ? 'border-amber-500/20 hover:border-amber-500/40' : 
                  'border-red-500/20 hover:border-red-500/40'
                }`}
              >
                <p className="text-xs text-valorant-gray mb-2">Post-Pistol Impact</p>
                <p className={`text-2xl font-bold mb-1 ${
                  isStrong ? 'text-green-400' : isAverage ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {isStrong ? 'Strong' : isAverage ? 'Average' : 'Weak'}
                </p>
                <p className="text-xs text-valorant-gray/60">{(patterns.round2_conversion_rate * 100).toFixed(0)}% R2 conversion rate</p>
              </motion.div>
            );
          })()}
        </div>
      </motion.div>
    </div>
  );
}
