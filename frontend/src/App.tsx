import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, FileText, TrendingUp } from 'lucide-react';
import { TeamSearch } from './components/TeamSearch';
import { TournamentSelector } from './components/TournamentSelector';
import { ReportView } from './components/ReportView';
import { LoadingState } from './components/LoadingState';
import type { Team, ScoutingReport } from './types';
import { generateReport, pollReportStatus } from './services/api';

type AppState = 'search' | 'tournament' | 'loading' | 'report';

function App() {
  const [state, setState] = useState<AppState>('search');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedTournament, setSelectedTournament] = useState<{ id: string | null; name: string | null }>({ id: null, name: null });
  const [report, setReport] = useState<ScoutingReport | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Step 1: Team selected - go to tournament selection
  const handleTeamSelect = useCallback((team: Team) => {
    setSelectedTeam(team);
    setState('tournament');
    setError(null);
  }, []);

  // Step 2: Tournament selected - start report generation
  const handleTournamentSelect = useCallback(async (tournamentId: string | null, tournamentName: string | null) => {
    if (!selectedTeam) return;
    
    setSelectedTournament({ id: tournamentId, name: tournamentName });
    setState('loading');
    setProgress(0);
    setStage('Initializing...');

    try {
      // Start report generation with tournament filter
      const { report_id } = await generateReport({
        team_id: selectedTeam.id,
        n_matches: 15,  // Get more matches when filtering by tournament
        tournament_id: tournamentId || undefined,
      });

      // Store the report ID for later use (refresh insights, etc.)
      setReportId(report_id);

      // Poll for completion with progress and stage updates
      const generatedReport = await pollReportStatus(report_id, (prog, stg) => {
        setProgress(prog);
        if (stg) setStage(stg);
      });
      setReport(generatedReport);
      setState('report');
    } catch (err) {
      console.error('Report generation failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate report');
      setState('tournament');
    }
  }, [selectedTeam]);

  const handleBackToSearch = useCallback(() => {
    setState('search');
    setReport(null);
    setReportId(null);
    setSelectedTeam(null);
    setSelectedTournament({ id: null, name: null });
    setProgress(0);
  }, []);

  const handleBackToTournament = useCallback(() => {
    setState('tournament');
    setReport(null);
    setProgress(0);
  }, []);

  return (
    <div className="min-h-screen bg-surface-400 relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-30" />
      <div className="fixed inset-0 bg-gradient-radial from-valorant-red/5 via-transparent to-transparent" />
      
      {/* Decorative elements */}
      <div className="fixed top-0 left-0 w-96 h-96 bg-valorant-red/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-valorant-red/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      {/* Main content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-white/5">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden bg-surface-100 border border-white/10 flex-shrink-0">
                <img src="/logo.svg" alt="VALORANT Scout" className="w-full h-full object-contain p-1" />
              </div>
              <div>
                <h1 className="val-header text-xl text-valorant-cream">VALORANT SCOUT</h1>
                <p className="text-xs text-valorant-gray">Tactical Intelligence System</p>
              </div>
            </div>
            
            <nav className="flex items-center gap-6">
              <NavItem icon={Target} label="Scout" active />
              <NavItem icon={FileText} label="Reports" />
              <NavItem icon={TrendingUp} label="Trends" />
            </nav>
          </div>
        </header>

        {/* Page content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          <AnimatePresence mode="wait">
            {state === 'search' && (
              <motion.div
                key="search"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <TeamSearch onSelect={handleTeamSelect} error={error} />
              </motion.div>
            )}

            {state === 'tournament' && selectedTeam && (
              <motion.div
                key="tournament"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <TournamentSelector
                  team={selectedTeam}
                  onSelect={handleTournamentSelect}
                  onBack={handleBackToSearch}
                />
              </motion.div>
            )}

            {state === 'loading' && selectedTeam && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <LoadingState 
                  team={selectedTeam} 
                  progress={progress}
                  stage={stage}
                  tournamentName={selectedTournament.name}
                />
              </motion.div>
            )}

            {state === 'report' && report && reportId && (
              <motion.div
                key="report"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <ReportView 
                  report={report}
                  reportId={reportId}
                  onBack={handleBackToSearch}
                  team={selectedTeam}
                  tournamentName={selectedTournament.name}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function NavItem({ icon: Icon, label, active = false }: { icon: typeof Target; label: string; active?: boolean }) {
  return (
    <button 
      className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
        active 
          ? 'bg-valorant-red/20 text-valorant-red' 
          : 'text-valorant-gray hover:text-valorant-cream'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

export default App;
