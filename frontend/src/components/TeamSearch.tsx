import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Users, MapPin, AlertCircle, Loader2 } from 'lucide-react';
import type { Team } from '../types';
import { searchTeams } from '../services/api';

interface TeamSearchProps {
  onSelect: (team: Team) => void;
  error?: string | null;
}

export function TeamSearch({ onSelect, error }: TeamSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Team[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const response = await searchTeams(searchQuery);
      setResults(response.teams);
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  return (
    <div className="max-w-3xl mx-auto pt-16">
      {/* Hero section */}
      <div className="text-center mb-12">
        <motion.h1 
          className="val-header text-5xl md:text-6xl text-valorant-cream mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          SCOUT YOUR <span className="text-valorant-red">OPPONENT</span>
        </motion.h1>
        <motion.p 
          className="text-valorant-gray text-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Generate comprehensive scouting reports powered by AI analysis
        </motion.p>
      </div>

      {/* Error message */}
      {error && (
        <motion.div 
          className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-300">{error}</p>
        </motion.div>
      )}

      {/* Search input */}
      <motion.div 
        className="relative mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="glass rounded-xl p-2 glow-border">
          <div className="flex items-center gap-4 px-4 py-3">
            {isSearching ? (
              <Loader2 className="w-6 h-6 text-valorant-red animate-spin" />
            ) : (
              <Search className="w-6 h-6 text-valorant-red" />
            )}
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for a team... (e.g., Sentinels, Cloud9, Fnatic)"
              className="flex-1 bg-transparent text-lg text-valorant-cream placeholder-valorant-gray/50 outline-none"
              autoFocus
            />
          </div>
        </div>
        
        {/* Search hint */}
        <p className="text-xs text-valorant-gray/60 mt-2 text-center">
          Enter at least 2 characters to search
        </p>
      </motion.div>

      {/* Results */}
      <motion.div 
        className="space-y-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {results.map((team, index) => (
          <TeamCard
            key={team.id}
            team={team}
            onClick={() => onSelect(team)}
            index={index}
          />
        ))}

        {/* Empty state */}
        {hasSearched && !isSearching && results.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-100 flex items-center justify-center">
              <Users className="w-8 h-8 text-valorant-gray" />
            </div>
            <p className="text-valorant-gray">No teams found matching "{query}"</p>
            <p className="text-sm text-valorant-gray/60 mt-1">Try a different search term</p>
          </div>
        )}
      </motion.div>

      {/* Quick picks */}
      {!hasSearched && (
        <motion.div 
          className="mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-sm font-medium text-valorant-gray mb-4 text-center">
            Popular Teams
          </h3>
          <div className="flex flex-wrap justify-center gap-2">
            {['Sentinels', 'Cloud9', 'LOUD', 'Fnatic', 'DRX', 'Paper Rex'].map((name) => (
              <button
                key={name}
                onClick={() => setQuery(name)}
                className="px-4 py-2 rounded-full bg-surface-100 text-sm text-valorant-cream hover:bg-valorant-red/20 hover:text-valorant-red transition-colors"
              >
                {name}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function TeamCard({ team, onClick, index }: { team: Team; onClick: () => void; index: number }) {
  return (
    <motion.button
      onClick={onClick}
      className="w-full glass rounded-xl p-4 text-left card-hover group"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <div className="flex items-center gap-4">
        {/* Team logo placeholder */}
        <div className="w-14 h-14 rounded-lg bg-surface-200 flex items-center justify-center overflow-hidden group-hover:ring-2 ring-valorant-red/50 transition-all">
          {team.logo_url ? (
            <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
          ) : (
            <span className="val-header text-2xl text-valorant-red">
              {team.short_name || team.name.slice(0, 2)}
            </span>
          )}
        </div>

        {/* Team info */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-valorant-cream group-hover:text-valorant-red transition-colors">
            {team.name}
          </h3>
          <div className="flex items-center gap-4 mt-1">
            {team.region && (
              <span className="flex items-center gap-1 text-sm text-valorant-gray">
                <MapPin className="w-3 h-3" />
                {team.region}
              </span>
            )}
            <span className="flex items-center gap-1 text-sm text-valorant-gray">
              <Users className="w-3 h-3" />
              {team.players.length} players
            </span>
          </div>
        </div>

        {/* Players preview */}
        <div className="hidden md:flex items-center -space-x-2">
          {team.players.slice(0, 4).map((player) => (
            <div
              key={player.id}
              className="w-8 h-8 rounded-full bg-surface-200 border-2 border-surface-100 flex items-center justify-center"
              title={player.nickname}
            >
              <span className="text-xs font-medium text-valorant-gray">
                {player.nickname.slice(0, 2).toUpperCase()}
              </span>
            </div>
          ))}
          {team.players.length > 4 && (
            <div className="w-8 h-8 rounded-full bg-surface-200 border-2 border-surface-100 flex items-center justify-center">
              <span className="text-xs font-medium text-valorant-gray">
                +{team.players.length - 4}
              </span>
            </div>
          )}
        </div>

        {/* Arrow */}
        <div className="w-8 h-8 rounded-full bg-surface-200 flex items-center justify-center group-hover:bg-valorant-red transition-colors">
          <svg className="w-4 h-4 text-valorant-gray group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </motion.button>
  );
}
