import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Calendar, ChevronRight, ArrowLeft, Loader2 } from 'lucide-react';
import type { Team } from '../types';
import { getTournaments, type Tournament } from '../services/api';

interface TournamentSelectorProps {
  team: Team;
  onSelect: (tournamentId: string | null, tournamentName: string | null) => void;
  onBack: () => void;
}

export function TournamentSelector({ team, onSelect, onBack }: TournamentSelectorProps) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    getTournaments()
      .then(data => {
        setTournaments(data.tournaments);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load tournaments:', err);
        setLoading(false);
      });
  }, []);

  const handleSelect = (id: string | null) => {
    setSelectedId(id);
    const tournament = tournaments.find(t => t.id === id);
    onSelect(id, tournament?.name || null);
  };

  return (
    <div className="max-w-3xl mx-auto pt-8">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-valorant-gray hover:text-valorant-cream transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to search</span>
      </button>

      {/* Team header */}
      <motion.div
        className="glass rounded-xl p-6 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-lg bg-surface-200 flex items-center justify-center">
            <span className="val-header text-2xl text-valorant-red">
              {team.short_name || team.name.slice(0, 2)}
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-valorant-cream">{team.name}</h2>
            <p className="text-valorant-gray">Select a tournament to analyze</p>
          </div>
        </div>
      </motion.div>

      {/* Tournament selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h3 className="text-sm font-medium text-valorant-gray uppercase tracking-wider mb-4 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-valorant-red" />
          Available Tournaments
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-valorant-red animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {/* All matches option */}
            <TournamentCard
              name="All Recent Matches"
              description="Analyze across all available tournaments"
              isSelected={selectedId === null}
              onClick={() => handleSelect(null)}
              icon="all"
            />

            {/* Individual tournaments - newest first */}
            {[...tournaments].reverse().map((tournament, index) => (
              <TournamentCard
                key={tournament.id}
                name={tournament.name}
                description={getTournamentDescription(tournament.name)}
                isSelected={selectedId === tournament.id}
                onClick={() => handleSelect(tournament.id)}
                index={index + 1}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* Generate button */}
      <motion.div
        className="mt-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <p className="text-xs text-valorant-gray/60 mb-4">
          Data available for VCT Americas 2024-2025 & Masters Madrid
        </p>
      </motion.div>
    </div>
  );
}

function TournamentCard({
  name,
  description,
  isSelected,
  onClick,
  icon,
  index,
}: {
  name: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
  icon?: string;
  index?: number;
}) {
  return (
    <motion.button
      onClick={onClick}
      className={`w-full glass rounded-xl p-4 text-left card-hover group transition-all ${
        isSelected ? 'ring-2 ring-valorant-red bg-valorant-red/10' : ''
      }`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: (index || 0) * 0.05 }}
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
          isSelected ? 'bg-valorant-red' : 'bg-surface-200'
        }`}>
          {icon === 'all' ? (
            <Calendar className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-valorant-gray'}`} />
          ) : (
            <Trophy className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-valorant-red'}`} />
          )}
        </div>

        <div className="flex-1">
          <h4 className={`font-semibold ${isSelected ? 'text-valorant-red' : 'text-valorant-cream'}`}>
            {name}
          </h4>
          <p className="text-sm text-valorant-gray">{description}</p>
        </div>

        <ChevronRight className={`w-5 h-5 transition-transform ${
          isSelected ? 'text-valorant-red translate-x-1' : 'text-valorant-gray'
        }`} />
      </div>
    </motion.button>
  );
}

function getTournamentDescription(name: string): string {
  if (name.includes('Kickoff 2025')) return 'Most recent • Jan-Feb 2025';
  if (name.includes('Stage 2 2025')) return 'Upcoming • Mid 2025';
  if (name.includes('Stage 1 2025')) return 'Upcoming • Early 2025';
  if (name.includes('Stage 2 2024')) return 'Aug-Sep 2024';
  if (name.includes('Stage 1 2024')) return 'Mar-May 2024';
  if (name.includes('Kickoff 2024')) return 'Feb-Mar 2024';
  if (name.includes('Masters Madrid')) return 'International • Mar 2024';
  return 'VCT Americas';
}
