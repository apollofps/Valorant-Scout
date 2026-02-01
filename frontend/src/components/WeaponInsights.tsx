import { motion } from 'framer-motion';
import { Crosshair, Target, TrendingUp, Users, Zap, Shield, Circle } from 'lucide-react';
import type { WeaponPatterns } from '../types';

// Weapon UUIDs from valorant-api.com
const weaponUUIDs: Record<string, string> = {
  // Sidearms
  classic: '29a0cfab-485b-f5d5-779a-b59f85e204a8',
  shorty: '42da8ccc-40d5-affc-beec-15aa47b42eda',
  frenzy: '44d4e95c-4157-0037-81b2-17841bf2e8e3',
  ghost: '1baa85b4-4c70-1284-64bb-6481dfc3bb4e',
  sheriff: 'e336c6b8-418d-9340-d77f-7a9e4cfe0702',
  // SMGs
  stinger: 'f7e1b454-4ad4-1063-ec0a-159e56b58941',
  spectre: '462080d1-4035-2937-7c09-27aa2a5c27a7',
  // Shotguns
  bucky: '910be174-449b-c412-ab22-d0873436b21b',
  judge: 'ec845bf4-4f79-ddda-a3da-0db3774b2794',
  // Rifles
  bulldog: 'ae3de142-4d85-2547-dd26-4e90bed35cf7',
  guardian: '4ade7faa-4cf1-8376-95ef-39884480959b',
  phantom: 'ee8e8d15-496b-07ac-e5f6-8fae5d4c7b1a',
  vandal: '9c82e19d-4575-0200-1a81-3eacf00cf872',
  // Snipers
  marshal: 'c4883e50-4494-202c-3ec3-6b8a9284f00b',
  outlaw: '5f0aaf7a-4289-3998-d5ff-eb9a5cf7ef5c',
  operator: 'a03b24d3-4319-996d-0f8c-94bbfba1dfc7',
  // Machine Guns
  ares: '55d8a0f4-4274-ca67-fe2c-06ab45efdf58',
  odin: '63e6c2b6-4a8e-869c-3d4c-e38355226584',
  // Melee
  melee: '2f59173c-4bed-b6c3-2191-dea9b58be9c7',
  knife: '2f59173c-4bed-b6c3-2191-dea9b58be9c7',
};

// Weapon categories for styling
const weaponCategories: Record<string, { color: string; label: string }> = {
  classic: { color: '#9CA3AF', label: 'Sidearm' },
  shorty: { color: '#9CA3AF', label: 'Sidearm' },
  frenzy: { color: '#9CA3AF', label: 'Sidearm' },
  ghost: { color: '#9CA3AF', label: 'Sidearm' },
  sheriff: { color: '#F59E0B', label: 'Sidearm' },
  stinger: { color: '#10B981', label: 'SMG' },
  spectre: { color: '#10B981', label: 'SMG' },
  bucky: { color: '#EF4444', label: 'Shotgun' },
  judge: { color: '#EF4444', label: 'Shotgun' },
  bulldog: { color: '#3B82F6', label: 'Rifle' },
  guardian: { color: '#3B82F6', label: 'Rifle' },
  phantom: { color: '#8B5CF6', label: 'Rifle' },
  vandal: { color: '#EC4899', label: 'Rifle' },
  marshal: { color: '#06B6D4', label: 'Sniper' },
  outlaw: { color: '#06B6D4', label: 'Sniper' },
  operator: { color: '#F97316', label: 'Sniper' },
  ares: { color: '#6366F1', label: 'Heavy' },
  odin: { color: '#6366F1', label: 'Heavy' },
  melee: { color: '#71717A', label: 'Melee' },
  knife: { color: '#71717A', label: 'Melee' },
};

const getWeaponIcon = (weapon: string): string => {
  const uuid = weaponUUIDs[weapon.toLowerCase()];
  return uuid ? `https://media.valorant-api.com/weapons/${uuid}/displayicon.png` : '';
};

const getWeaponKillIcon = (weapon: string): string => {
  const uuid = weaponUUIDs[weapon.toLowerCase()];
  return uuid ? `https://media.valorant-api.com/weapons/${uuid}/killstreamicon.png` : '';
};

interface WeaponInsightsProps {
  patterns?: WeaponPatterns;
}

export function WeaponInsights({ patterns }: WeaponInsightsProps) {
  if (!patterns || patterns.total_kills === 0) {
    return (
      <div className="rounded-xl bg-surface-300/80 backdrop-blur p-12 text-center border border-white/5">
        <Crosshair className="w-12 h-12 mx-auto mb-4 text-valorant-gray" />
        <p className="text-valorant-gray">No weapon data available</p>
      </div>
    );
  }

  const topWeapons = patterns.top_weapons.slice(0, 8);
  const rifleTotal = patterns.vandal_kills + patterns.phantom_kills;
  const vandalPercent = rifleTotal > 0 ? (patterns.vandal_kills / rifleTotal) * 100 : 50;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { icon: Target, label: 'Total Kills', value: patterns.total_kills, color: 'red' },
          { icon: Crosshair, label: 'Rifle Kills', value: patterns.vandal_kills + patterns.phantom_kills, color: 'purple' },
          { icon: Zap, label: 'Sniper Kills', value: patterns.sniper_kills, color: 'cyan' },
          { icon: Shield, label: 'SMG Kills', value: patterns.smg_kills, color: 'green' },
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

      {/* Vandal vs Phantom */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl bg-surface-300/80 backdrop-blur p-6 border border-white/5"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-pink-400" />
          </div>
          <div>
            <h3 className="font-bold text-valorant-cream">Rifle Preference</h3>
            <p className="text-xs text-valorant-gray">Vandal vs Phantom usage analysis</p>
          </div>
          <div className="ml-auto">
            <span className={`px-3 py-1 rounded-lg text-sm font-bold ${
              patterns.rifle_preference === 'vandal' ? 'bg-pink-500/20 text-pink-400' :
              patterns.rifle_preference === 'phantom' ? 'bg-purple-500/20 text-purple-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              {patterns.rifle_preference === 'vandal' ? 'Vandal Heavy' :
               patterns.rifle_preference === 'phantom' ? 'Phantom Heavy' : 'Balanced'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Vandal */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-16 h-10 bg-surface-200/50 rounded-lg p-1 flex items-center justify-center">
                <img 
                  src={getWeaponIcon('vandal')} 
                  alt="Vandal" 
                  className="h-full w-auto object-contain filter brightness-0 invert"
                />
              </div>
              <div>
                <p className="text-valorant-cream font-semibold">Vandal</p>
                <p className="text-xs text-valorant-gray">{patterns.vandal_kills} kills</p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="flex-[2]">
            <div className="relative h-8 rounded-lg overflow-hidden bg-surface-200/50">
              <motion.div 
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-pink-500 to-pink-600"
                initial={{ width: 0 }}
                animate={{ width: `${vandalPercent}%` }}
                transition={{ duration: 1, delay: 0.3 }}
              />
              <motion.div 
                className="absolute right-0 top-0 h-full bg-gradient-to-l from-purple-500 to-purple-600"
                initial={{ width: 0 }}
                animate={{ width: `${100 - vandalPercent}%` }}
                transition={{ duration: 1, delay: 0.3 }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-white drop-shadow-lg">
                  {vandalPercent.toFixed(0)}% / {(100 - vandalPercent).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>

          {/* Phantom */}
          <div className="flex-1 text-right">
            <div className="flex items-center gap-3 justify-end mb-3">
              <div>
                <p className="text-valorant-cream font-semibold">Phantom</p>
                <p className="text-xs text-valorant-gray">{patterns.phantom_kills} kills</p>
              </div>
              <div className="w-16 h-10 bg-surface-200/50 rounded-lg p-1 flex items-center justify-center">
                <img 
                  src={getWeaponIcon('phantom')} 
                  alt="Phantom" 
                  className="h-full w-auto object-contain filter brightness-0 invert"
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Top Weapons Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <span className="w-8 h-px bg-gradient-to-r from-valorant-red to-transparent" />
          <h3 className="text-sm font-medium text-valorant-gray uppercase tracking-widest">Top Weapons</h3>
          <span className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {topWeapons.map((weapon, index) => {
            const category = weaponCategories[weapon.weapon_name.toLowerCase()] || { color: '#9CA3AF', label: 'Unknown' };
            const maxKills = topWeapons[0]?.kills || 1;
            const barWidth = (weapon.kills / maxKills) * 100;

            return (
              <motion.div
                key={weapon.weapon_name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.05 }}
                whileHover={{ scale: 1.02, y: -2 }}
                className="relative rounded-xl bg-surface-300/80 backdrop-blur p-4 border border-white/5 overflow-hidden group"
              >
                {/* Rank badge */}
                <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  index === 0 ? 'bg-amber-500 text-black' :
                  index === 1 ? 'bg-gray-400 text-black' :
                  index === 2 ? 'bg-amber-700 text-white' :
                  'bg-surface-200 text-valorant-gray'
                }`}>
                  {index + 1}
                </div>

                {/* Weapon Image */}
                <div className="w-full h-12 mb-3 flex items-center justify-center">
                  <img 
                    src={getWeaponIcon(weapon.weapon_name)} 
                    alt={weapon.weapon_name}
                    className="h-full w-auto object-contain filter brightness-0 invert opacity-80 group-hover:opacity-100 transition-opacity"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>

                {/* Weapon Info */}
                <div className="text-center">
                  <h4 className="text-valorant-cream font-semibold capitalize text-sm">{weapon.weapon_name}</h4>
                  <span 
                    className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block"
                    style={{ backgroundColor: `${category.color}20`, color: category.color }}
                  >
                    {category.label}
                  </span>
                </div>

                {/* Stats */}
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-valorant-gray">Kills</span>
                    <span className="text-valorant-cream font-mono font-bold">{weapon.kills}</span>
                  </div>
                  <div className="h-1.5 bg-surface-200 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full rounded-full"
                      style={{ backgroundColor: category.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${barWidth}%` }}
                      transition={{ duration: 0.8, delay: 0.5 + index * 0.05 }}
                    />
                  </div>
                  <p className="text-[10px] text-valorant-gray text-center">
                    {weapon.kill_percentage}% of total kills
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Player Weapon Stats */}
      {patterns.player_weapon_stats.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-xl bg-surface-300/80 backdrop-blur p-6 border border-white/5"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-cyan-400" />
            </div>
            <h3 className="font-bold text-valorant-cream">Player Weapon Preferences</h3>
          </div>

          <div className="space-y-4">
            {patterns.player_weapon_stats.slice(0, 5).map((player, index) => {
              const totalKills = Object.values(player.weapon_kills).reduce((a, b) => a + b, 0);
              const topWeapons = Object.entries(player.weapon_kills)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3);

              return (
                <motion.div
                  key={player.player_name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="flex items-center gap-4 p-3 bg-surface-200/30 rounded-lg"
                >
                  {/* Rank */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                    index === 0 ? 'bg-amber-500/20 text-amber-400' :
                    index === 1 ? 'bg-gray-400/20 text-gray-400' :
                    index === 2 ? 'bg-amber-700/20 text-amber-600' :
                    'bg-surface-200 text-valorant-gray'
                  }`}>
                    {index + 1}
                  </div>

                  {/* Player Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-valorant-cream font-semibold truncate">{player.player_name}</p>
                      <span className="text-xs text-valorant-gray">({totalKills} kills)</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-valorant-gray">Favorite:</span>
                      <div className="flex items-center gap-1">
                        <div className="w-6 h-4 flex items-center justify-center">
                          <img 
                            src={getWeaponKillIcon(player.favorite_weapon)}
                            alt={player.favorite_weapon}
                            className="h-full w-auto object-contain filter brightness-0 invert opacity-70"
                          />
                        </div>
                        <span className="text-xs text-valorant-cream capitalize">{player.favorite_weapon}</span>
                      </div>
                    </div>
                  </div>

                  {/* Top Weapons */}
                  <div className="flex items-center gap-3">
                    {topWeapons.map(([weapon, kills]) => (
                      <div key={weapon} className="flex items-center gap-1 px-2 py-1 bg-surface-200/50 rounded-lg">
                        <div className="w-8 h-5 flex items-center justify-center">
                          <img 
                            src={getWeaponKillIcon(weapon)}
                            alt={weapon}
                            className="h-full w-auto object-contain filter brightness-0 invert opacity-70"
                          />
                        </div>
                        <span className="text-xs text-valorant-cream font-mono">{kills}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Category Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: 'Eco Weapons', value: patterns.eco_weapon_kills, icon: Circle, color: 'amber', desc: 'Sheriff, Marshal, Guardian' },
          { label: 'SMG Kills', value: patterns.smg_kills, icon: Zap, color: 'green', desc: 'Spectre, Stinger' },
          { label: 'Shotgun Kills', value: patterns.shotgun_kills, icon: Shield, color: 'red', desc: 'Judge, Bucky' },
          { label: 'Sniper Kills', value: patterns.sniper_kills, icon: Target, color: 'cyan', desc: 'Operator, Marshal, Outlaw' },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 + idx * 0.1 }}
            className="rounded-xl bg-surface-300/80 backdrop-blur p-4 border border-white/5"
          >
            <stat.icon className={`w-5 h-5 text-${stat.color}-400 mb-2`} />
            <p className={`text-2xl font-bold text-${stat.color}-400`}>{stat.value}</p>
            <p className="text-sm text-valorant-cream">{stat.label}</p>
            <p className="text-[10px] text-valorant-gray mt-1">{stat.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
