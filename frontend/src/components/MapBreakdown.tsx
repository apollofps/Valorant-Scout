import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Trophy, Shield, Swords, Map, TrendingUp, TrendingDown, Target, Percent } from 'lucide-react';
import type { SiteTendencies } from '../types';

// Map colors
const mapColors: Record<string, string> = {
  ascent: '#7C93C3',
  haven: '#C4A77D',
  bind: '#D4A574',
  split: '#8FBC8F',
  icebox: '#B0E0E6',
  breeze: '#87CEEB',
  fracture: '#DDA0DD',
  pearl: '#E6E6FA',
  lotus: '#FFB6C1',
  sunset: '#FFA07A',
  abyss: '#4B0082',
  corrode: '#50C878',
};

interface MapBreakdownProps {
  siteTendencies: Record<string, SiteTendencies>;
}

export function MapBreakdown({ siteTendencies }: MapBreakdownProps) {
  const maps = Object.keys(siteTendencies);
  const [selectedMap, setSelectedMap] = useState(maps[0] || '');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [_previousMap, setPreviousMap] = useState<string>('');

  useEffect(() => {
    if (maps.length > 0 && !maps.includes(selectedMap)) {
      setSelectedMap(maps[0]);
    }
  }, [maps, selectedMap]);

  const [clickedMap, setClickedMap] = useState<string | null>(null);

  const handleMapChange = (mapName: string) => {
    if (mapName === selectedMap) return;
    
    // Immediate visual feedback
    setClickedMap(mapName);
    setTimeout(() => setClickedMap(null), 300);
    
    setPreviousMap(selectedMap);
    setIsTransitioning(true);
    setSelectedMap(mapName);
    
    // Brief transition animation
    setTimeout(() => {
      setIsTransitioning(false);
    }, 400);
  };

  if (maps.length === 0) {
    return (
      <div className="rounded-xl bg-surface-300/80 backdrop-blur p-12 text-center border border-white/5">
        <Map className="w-12 h-12 mx-auto mb-4 text-valorant-gray" />
        <p className="text-valorant-gray">No map data available</p>
        <p className="text-sm text-valorant-gray/60 mt-2">Match data may not contain map details</p>
      </div>
    );
  }

  const currentMapData = siteTendencies[selectedMap];
  const sortedMaps = maps.sort((a, b) => 
    (siteTendencies[b].map_win_rate || 0) - (siteTendencies[a].map_win_rate || 0)
  );

  // Calculate totals
  const totalGames = maps.reduce((sum, m) => sum + (siteTendencies[m].games_played || 0), 0);
  const totalWins = maps.reduce((sum, m) => sum + Math.round((siteTendencies[m].map_win_rate || 0) * (siteTendencies[m].games_played || 0)), 0);
  const overallWinRate = totalGames > 0 ? (totalWins / totalGames) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { icon: Map, label: 'Maps Played', value: maps.length, color: 'green' },
          { icon: Target, label: 'Total Games', value: totalGames, color: 'purple' },
          { icon: Trophy, label: 'Overall WR', value: `${overallWinRate.toFixed(0)}%`, color: overallWinRate >= 50 ? 'green' : 'red' },
          { icon: TrendingUp, label: 'Best Map', value: sortedMaps[0] || 'N/A', color: 'amber', capitalize: true },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="rounded-xl bg-surface-300/80 backdrop-blur p-4 border border-white/5"
          >
            <stat.icon className={`w-5 h-5 text-${stat.color}-400 mb-2`} />
            <p className={`text-2xl font-bold text-${stat.color}-400 ${stat.capitalize ? 'capitalize' : ''}`}>{stat.value}</p>
            <p className="text-xs text-valorant-gray">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Map Overview Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl bg-surface-300/80 backdrop-blur p-6 border border-white/5"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h3 className="font-bold text-valorant-cream">Map Win Rates</h3>
            <p className="text-xs text-valorant-gray">Performance across all maps</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {sortedMaps.map((mapName, idx) => {
            const data = siteTendencies[mapName];
            const winRate = (data.map_win_rate || 0) * 100;
            const isGood = winRate >= 50;
            const color = mapColors[mapName.toLowerCase()] || '#666';
            
            return (
              <motion.button
                key={mapName}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ 
                  opacity: 1, 
                  scale: selectedMap === mapName ? 1.02 : 1,
                  y: selectedMap === mapName ? -4 : 0,
                }}
                transition={{ delay: 0.3 + idx * 0.05 }}
                whileHover={{ scale: selectedMap === mapName ? 1.02 : 1.03, y: selectedMap === mapName ? -4 : -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleMapChange(mapName)}
                className={`relative p-4 rounded-xl text-left transition-all duration-300 cursor-pointer ${
                  selectedMap === mapName 
                    ? 'bg-gradient-to-br from-valorant-red/20 to-surface-100 ring-2 ring-valorant-red shadow-lg shadow-valorant-red/20' 
                    : 'bg-surface-200/50 hover:bg-surface-200 hover:ring-1 hover:ring-white/20'
                } border ${selectedMap === mapName ? 'border-valorant-red/50' : 'border-white/5'}`}
              >
                {/* Click ripple effect */}
                {clickedMap === mapName && (
                  <motion.div
                    className="absolute inset-0 rounded-xl"
                    initial={{ scale: 0.8, opacity: 0.6 }}
                    animate={{ scale: 1.2, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    style={{
                      background: 'radial-gradient(circle, rgba(255,70,85,0.4) 0%, transparent 70%)',
                    }}
                  />
                )}
                
                {/* Pulsing glow effect for selected map */}
                {selectedMap === mapName && (
                  <motion.div
                    className="absolute inset-0 rounded-xl"
                    style={{
                      background: `linear-gradient(135deg, rgba(255,70,85,0.1) 0%, transparent 50%)`,
                      boxShadow: '0 0 20px rgba(255,70,85,0.3)',
                    }}
                    animate={{
                      opacity: [0.5, 0.8, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                )}
                
                {/* Selected indicator badge */}
                {selectedMap === mapName && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-valorant-red flex items-center justify-center shadow-lg z-10"
                  >
                    <motion.div 
                      className="w-2 h-2 rounded-full bg-white"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  </motion.div>
                )}
                
                {/* Content wrapper with z-index */}
                <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-valorant-cream capitalize">{mapName}</span>
                  {idx === 0 && <Trophy className="w-4 h-4 text-amber-400" />}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-2xl font-bold font-mono ${isGood ? 'text-green-400' : 'text-red-400'}`}>
                    {winRate.toFixed(0)}%
                  </span>
                  {isGood ? (
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  )}
                </div>
                <div className="h-1.5 bg-surface-100 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full rounded-full"
                    style={{ backgroundColor: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${winRate}%` }}
                    transition={{ duration: 0.8, delay: 0.4 + idx * 0.05 }}
                  />
                </div>
                <p className="text-xs text-valorant-gray mt-2">{data.games_played || 0} games</p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Selected Map Details */}
      <AnimatePresence mode="wait">
        {currentMapData && (
          <motion.div
            key={selectedMap}
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ 
              duration: 0.4,
              ease: [0.4, 0, 0.2, 1]
            }}
            className="relative"
          >
            {/* Subtle map name badge - always visible, with brief highlight on change */}
            <motion.div
              key={`badge-${selectedMap}`}
              initial={{ opacity: 0, scale: 0.95, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.3, type: 'spring' }}
              className="mb-4 relative"
            >
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-300 ${
                isTransitioning 
                  ? 'bg-valorant-red/20 border-valorant-red/40 shadow-lg shadow-valorant-red/20' 
                  : 'bg-surface-200/50 border-white/10'
              }`}>
                {/* Brief flash on transition */}
                {isTransitioning && (
                  <motion.div
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    initial={{ x: '-100%' }}
                    animate={{ x: '200%' }}
                    transition={{ duration: 0.4 }}
                  />
                )}
                <Map className={`w-3.5 h-3.5 transition-colors ${isTransitioning ? 'text-valorant-red' : 'text-valorant-gray'}`} />
                <span className={`text-xs font-medium transition-colors ${isTransitioning ? 'text-valorant-red' : 'text-valorant-gray'}`}>
                  <span className="font-semibold text-valorant-cream capitalize">{selectedMap}</span> analysis
                </span>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Map Performance Card */}
            <motion.div 
              key={`performance-${selectedMap}`}
              initial={{ opacity: 0, x: -20, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="rounded-xl bg-surface-300/80 backdrop-blur p-6 border border-white/5 relative overflow-hidden"
            >
              {/* Flash effect on map change */}
              {isTransitioning && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-valorant-red/10 to-transparent z-0"
                  initial={{ x: '-100%', opacity: 0 }}
                  animate={{ x: '200%', opacity: [0, 0.5, 0] }}
                  transition={{ duration: 0.5 }}
                />
              )}
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl" 
              style={{ backgroundColor: `${mapColors[selectedMap.toLowerCase()] || '#666'}20` }} 
            />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${mapColors[selectedMap.toLowerCase()] || '#666'}30` }}
                >
                  <Map className="w-6 h-6" style={{ color: mapColors[selectedMap.toLowerCase()] || '#FF4655' }} />
                </div>
                <div>
                  <h3 className="font-bold text-valorant-cream capitalize text-xl">{selectedMap}</h3>
                  <p className="text-xs text-valorant-gray">{currentMapData.games_played || 0} games analyzed</p>
                </div>
              </div>
              
              <div className="text-center mb-6">
                <motion.div 
                  key={`${selectedMap}-${((currentMapData.map_win_rate || 0) * 100).toFixed(0)}`}
                  className="text-6xl font-black font-mono mb-2 relative"
                  style={{ color: mapColors[selectedMap.toLowerCase()] || '#FF4655' }}
                  initial={{ scale: 0.5, opacity: 0, y: 20, rotateX: -90 }}
                  animate={{ scale: 1, opacity: 1, y: 0, rotateX: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                >
                  {/* Flash effect on number change */}
                  {isTransitioning && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-b from-transparent via-white/30 to-transparent"
                      initial={{ y: '-100%' }}
                      animate={{ y: '200%' }}
                      transition={{ duration: 0.4 }}
                    />
                  )}
                  {((currentMapData.map_win_rate || 0) * 100).toFixed(0)}%
                </motion.div>
                <motion.p 
                  key={`${selectedMap}-label`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-valorant-gray text-sm"
                >
                  Win Rate
                </motion.p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-500/10 rounded-xl p-4 text-center border border-green-500/20">
                  <p className="text-3xl font-bold font-mono text-green-400">
                    {Math.round((currentMapData.map_win_rate || 0) * (currentMapData.games_played || 0))}
                  </p>
                  <p className="text-xs text-valorant-gray mt-1">Wins</p>
                </div>
                <div className="bg-red-500/10 rounded-xl p-4 text-center border border-red-500/20">
                  <p className="text-3xl font-bold font-mono text-red-400">
                    {(currentMapData.games_played || 0) - Math.round((currentMapData.map_win_rate || 0) * (currentMapData.games_played || 0))}
                  </p>
                  <p className="text-xs text-valorant-gray mt-1">Losses</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Side Performance */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-xl bg-surface-300/80 backdrop-blur p-6 border border-white/5"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Percent className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="font-bold text-valorant-cream">Side Performance</h3>
            </div>
            
            <div className="space-y-6">
              {/* Attack */}
              <div className="p-4 bg-orange-500/10 rounded-xl border border-orange-500/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Swords className="w-5 h-5 text-orange-400" />
                    <span className="font-medium text-valorant-cream">Attack Side</span>
                  </div>
                  <span className="text-2xl font-bold font-mono text-orange-400">
                    {((currentMapData.fast_execute_rate || 0) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 bg-surface-200 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentMapData.fast_execute_rate || 0) * 100}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
                <p className="text-xs text-valorant-gray mt-2">
                  {currentMapData.attack_rounds_won || 0} / {currentMapData.attack_rounds_played || 0} rounds won
                </p>
              </div>
              
              {/* Defense */}
              <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-400" />
                    <span className="font-medium text-valorant-cream">Defense Side</span>
                  </div>
                  <span className="text-2xl font-bold font-mono text-blue-400">
                    {((currentMapData.retake_success_rate || 0) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 bg-surface-200 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentMapData.retake_success_rate || 0) * 100}%` }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                  />
                </div>
                <p className="text-xs text-valorant-gray mt-2">
                  {currentMapData.defense_rounds_won || 0} / {currentMapData.defense_rounds_played || 0} rounds won
                </p>
              </div>
            </div>
          </motion.div>

          {/* Attack Analysis */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl bg-surface-300/80 backdrop-blur p-6 border border-white/5 border-l-2 border-l-orange-500/50"
          >
            <div className="flex items-center gap-2 mb-4">
              <Swords className="w-5 h-5 text-orange-400" />
              <h3 className="font-semibold text-valorant-cream">Attack Analysis</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-surface-200/50 rounded-lg">
                <span className="text-sm text-valorant-gray">Rounds Won</span>
                <span className="text-xl font-mono font-bold text-orange-400">
                  {currentMapData.attack_rounds_won || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-surface-200/50 rounded-lg">
                <span className="text-sm text-valorant-gray">Rounds Played</span>
                <span className="text-xl font-mono font-bold text-valorant-cream">
                  {currentMapData.attack_rounds_played || 0}
                </span>
              </div>
              <div className="pt-3 border-t border-white/5">
                <p className="text-xs text-valorant-gray mb-2">Attack Strength</p>
                {(() => {
                  const rate = currentMapData.fast_execute_rate || 0;
                  const label = rate >= 0.55 ? 'Strong' : rate >= 0.45 ? 'Average' : 'Weak';
                  const color = rate >= 0.55 ? 'text-green-400' : rate >= 0.45 ? 'text-amber-400' : 'text-red-400';
                  const bgColor = rate >= 0.55 ? 'bg-green-500/20' : rate >= 0.45 ? 'bg-amber-500/20' : 'bg-red-500/20';
                  return (
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${bgColor}`}>
                      <span className={`text-sm font-bold ${color}`}>{label}</span>
                      <span className="text-xs text-valorant-gray">({(rate * 100).toFixed(0)}%)</span>
                    </span>
                  );
                })()}
              </div>
            </div>
          </motion.div>

          {/* Defense Analysis */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="rounded-xl bg-surface-300/80 backdrop-blur p-6 border border-white/5 border-l-2 border-l-blue-500/50"
          >
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-blue-400" />
              <h3 className="font-semibold text-valorant-cream">Defense Analysis</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-surface-200/50 rounded-lg">
                <span className="text-sm text-valorant-gray">Rounds Won</span>
                <span className="text-xl font-mono font-bold text-blue-400">
                  {currentMapData.defense_rounds_won || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-surface-200/50 rounded-lg">
                <span className="text-sm text-valorant-gray">Rounds Played</span>
                <span className="text-xl font-mono font-bold text-valorant-cream">
                  {currentMapData.defense_rounds_played || 0}
                </span>
              </div>
              <div className="pt-3 border-t border-white/5">
                <p className="text-xs text-valorant-gray mb-2">Defense Strength</p>
                {(() => {
                  const rate = currentMapData.retake_success_rate || 0;
                  const label = rate >= 0.55 ? 'Strong' : rate >= 0.45 ? 'Average' : 'Weak';
                  const color = rate >= 0.55 ? 'text-green-400' : rate >= 0.45 ? 'text-amber-400' : 'text-red-400';
                  const bgColor = rate >= 0.55 ? 'bg-green-500/20' : rate >= 0.45 ? 'bg-amber-500/20' : 'bg-red-500/20';
                  return (
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${bgColor}`}>
                      <span className={`text-sm font-bold ${color}`}>{label}</span>
                      <span className="text-xs text-valorant-gray">({(rate * 100).toFixed(0)}%)</span>
                    </span>
                  );
                })()}
              </div>
            </div>
          </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
