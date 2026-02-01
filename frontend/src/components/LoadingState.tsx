import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Database, BarChart3, FileText, Sparkles, Target, Shield, Swords, Zap } from 'lucide-react';
import type { Team } from '../types';

interface LoadingStateProps {
  team: Team;
  progress: number;
  stage?: string;
  tournamentName?: string | null;
}

const stages = [
  { icon: Database, label: 'Connecting to GRID API', subLabel: 'Establishing secure connection', threshold: 0 },
  { icon: Target, label: 'Fetching match history', subLabel: 'Retrieving tournament data', threshold: 15 },
  { icon: Brain, label: 'Analyzing agent compositions', subLabel: 'Processing team strategies', threshold: 30 },
  { icon: Swords, label: 'Evaluating map performance', subLabel: 'Calculating win rates', threshold: 45 },
  { icon: Shield, label: 'Processing player stats', subLabel: 'Aggregating combat data', threshold: 60 },
  { icon: BarChart3, label: 'Computing economy patterns', subLabel: 'Analyzing buy rounds', threshold: 75 },
  { icon: FileText, label: 'Generating AI insights', subLabel: 'Creating tactical report', threshold: 85 },
  { icon: Sparkles, label: 'Finalizing report', subLabel: 'Preparing visualizations', threshold: 95 },
];

const funFacts = [
  "Professional teams spend hours reviewing opponent tendencies before matches.",
  "The best entry fraggers have opening duel win rates above 55%.",
  "Economy management can swing a match - pistol rounds are crucial.",
  "Map pool diversity often determines championship potential.",
  "Controller players set the pace for every round's execution.",
  "First blood percentage is one of the most impactful statistics.",
  "Top teams adapt their compositions based on opponent analysis.",
  "Scouting reports can reveal predictable rotation patterns.",
];

// Helper to generate sub-labels based on backend stage message
function getSubLabelForStage(stage: string): string {
  const lower = stage.toLowerCase();
  if (lower.includes('connecting') || lower.includes('api')) return 'Establishing secure connection';
  if (lower.includes('team details')) return 'Loading roster information';
  if (lower.includes('match history') || lower.includes('loading')) return 'Retrieving tournament data';
  if (lower.includes('downloading') || lower.includes('match data')) return 'Processing round-by-round data';
  if (lower.includes('roster')) return 'Identifying active players';
  if (lower.includes('player stat')) return 'Aggregating combat data';
  if (lower.includes('map win')) return 'Analyzing map performance';
  if (lower.includes('agent')) return 'Processing team strategies';
  if (lower.includes('economy')) return 'Analyzing buy patterns';
  if (lower.includes('ai') || lower.includes('tactical')) return 'This may take 30-60 seconds...';
  if (lower.includes('validat')) return 'Quality checking AI output';
  if (lower.includes('regenerat') || lower.includes('enhanc')) return 'Improving analysis quality';
  if (lower.includes('visual')) return 'Building charts and graphs';
  if (lower.includes('complete')) return 'Ready to view!';
  return 'Processing...';
}

export function LoadingState({ team, progress, stage, tournamentName }: LoadingStateProps) {
  const [currentFact, setCurrentFact] = useState(0);
  const [displayProgress, setDisplayProgress] = useState(0);

  // Smooth progress animation with time-based interpolation
  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayProgress(prev => {
        if (prev < progress) {
          // Smooth catchup - faster when far behind, slower when close
          const diff = progress - prev;
          const increment = Math.max(1, Math.ceil(diff / 10));
          return Math.min(prev + increment, progress);
        }
        return prev;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [progress]);

  // Rotate fun facts
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFact(prev => (prev + 1) % funFacts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Find the current stage based on progress
  const currentStageIndex = stages.findIndex((stg, i) => {
    const nextThreshold = stages[i + 1]?.threshold ?? 100;
    return displayProgress >= stg.threshold && displayProgress < nextThreshold;
  });

  const currentStageData = stages[currentStageIndex] || stages[0];
  const CurrentIcon = currentStageData.icon;
  
  // Use backend stage message if available, otherwise use local stage label
  const displayStage = stage || currentStageData.label;
  const displaySubLabel = stage ? getSubLabelForStage(stage) : currentStageData.subLabel;

  return (
    <div className="max-w-3xl mx-auto pt-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        {/* Animated Logo Container */}
        <div className="relative w-32 h-32 mx-auto mb-6">
          {/* Rotating ring */}
          <motion.div 
            className="absolute inset-0 rounded-full border-2 border-valorant-red/30"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
          <motion.div 
            className="absolute inset-2 rounded-full border-2 border-dashed border-valorant-red/20"
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Scanning effect */}
          <motion.div 
            className="absolute inset-0 rounded-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div 
              className="absolute inset-0 bg-gradient-to-b from-valorant-red/20 to-transparent"
              animate={{ y: ['0%', '100%', '0%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>

          {/* Team logo */}
          <div className="absolute inset-4 rounded-full bg-surface-200 flex items-center justify-center overflow-hidden shadow-xl">
            {team.logo_url ? (
              <img src={team.logo_url} alt={team.name} className="w-full h-full object-contain p-2" />
            ) : (
              <span className="val-header text-3xl text-valorant-red">
                {team.short_name || team.name.slice(0, 2)}
              </span>
            )}
          </div>

          {/* Pulsing glow */}
          <motion.div 
            className="absolute inset-0 rounded-full bg-valorant-red/20 blur-xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>

        <h2 className="val-header text-2xl md:text-3xl text-valorant-cream mb-2">
          ANALYZING <span className="text-valorant-red">{team.name.toUpperCase()}</span>
        </h2>
        <p className="text-valorant-gray text-sm">
          {tournamentName 
            ? <span>Analyzing <span className="text-amber-400">{tournamentName}</span> performance</span>
            : 'Generating tactical intelligence report'
          }
        </p>
      </motion.div>

      {/* Circular Progress */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="relative w-48 h-48 mx-auto mb-8"
      >
        {/* Background circle */}
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="96" cy="96" r="88"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="8"
          />
          <motion.circle
            cx="96" cy="96" r="88"
            fill="none"
            stroke="url(#progressGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            initial={{ strokeDasharray: '0 553' }}
            animate={{ strokeDasharray: `${(displayProgress / 100) * 553} 553` }}
            transition={{ duration: 0.3 }}
            style={{ filter: 'drop-shadow(0 0 8px rgba(255,70,85,0.5))' }}
          />
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF4655" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            key={currentStageIndex}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className="w-12 h-12 rounded-xl bg-valorant-red/20 flex items-center justify-center mb-2"
          >
            <CurrentIcon className="w-6 h-6 text-valorant-red" />
          </motion.div>
          <span className="text-4xl font-black font-mono text-valorant-cream">{displayProgress}%</span>
        </div>
      </motion.div>

      {/* Current Stage Display */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center mb-8"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={displayStage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-lg text-valorant-cream font-semibold flex items-center justify-center gap-2">
              <motion.span
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {displayStage}
              </motion.span>
              {!displayStage.includes('...') && (
                <motion.span
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="text-valorant-red"
                >
                  ...
                </motion.span>
              )}
            </p>
            <p className="text-sm text-valorant-gray mt-1">{displaySubLabel}</p>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Stage Progress Pills */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex justify-center gap-1.5 mb-8"
      >
        {stages.map((_, index) => {
          const isActive = index === currentStageIndex;
          const isComplete = index < currentStageIndex;
          return (
            <motion.div
              key={index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                isComplete ? 'w-8 bg-green-500' :
                isActive ? 'w-12 bg-valorant-red' :
                'w-4 bg-surface-200'
              }`}
              animate={isActive ? { opacity: [1, 0.5, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            />
          );
        })}
      </motion.div>

      {/* Detailed Stages - Compact */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-8"
      >
        {stages.slice(0, 8).map((stage, index) => {
          const isActive = index === currentStageIndex;
          const isComplete = index < currentStageIndex;
          const Icon = stage.icon;

          return (
            <motion.div
              key={stage.label}
              className={`p-3 rounded-lg transition-all ${
                isActive 
                  ? 'bg-valorant-red/20 border border-valorant-red/40 scale-105' 
                  : isComplete
                  ? 'bg-green-500/10 border border-green-500/20'
                  : 'bg-surface-200/30 border border-white/5'
              }`}
              animate={isActive ? { scale: [1, 1.02, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded flex items-center justify-center ${
                  isActive ? 'bg-valorant-red' :
                  isComplete ? 'bg-green-500/30' :
                  'bg-surface-100'
                }`}>
                  {isComplete ? (
                    <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <Icon className={`w-3 h-3 ${isActive ? 'text-white' : 'text-valorant-gray/50'}`} />
                  )}
                </div>
                <span className={`text-[10px] font-medium truncate ${
                  isActive ? 'text-valorant-cream' :
                  isComplete ? 'text-green-400/80' :
                  'text-valorant-gray/40'
                }`}>
                  {stage.label.split(' ').slice(-1)[0]}
                </span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Fun Facts Carousel */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="rounded-xl bg-surface-300/80 backdrop-blur p-4 border border-white/5 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-valorant-red via-purple-500 to-amber-500" />
        
        <div className="flex items-start gap-3 pl-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex-1 min-h-[40px]">
            <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider mb-1">Pro Tip</p>
            <AnimatePresence mode="wait">
              <motion.p
                key={currentFact}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="text-sm text-valorant-gray"
              >
                {funFacts[currentFact]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Floating particles effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-valorant-red/30 rounded-full"
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: window.innerHeight + 10 
            }}
            animate={{ 
              y: -10,
              x: Math.random() * window.innerWidth
            }}
            transition={{ 
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              delay: i * 1.5,
              ease: "linear"
            }}
          />
        ))}
      </div>
    </div>
  );
}
