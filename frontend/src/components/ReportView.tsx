import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import {
  ArrowLeft, Download, Target,
  Users, TrendingUp, DollarSign, AlertTriangle, Lightbulb,
  Trophy, Crosshair, Shield, Swords, Map, Flame,
  ChevronDown, RefreshCw, Sparkles, GripVertical, RotateCcw, Loader2
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ScoutingReport, Team } from '../types';
import { AgentComps } from './AgentComps';
import { MapBreakdown } from './MapBreakdown';
import { PlayerCards } from './PlayerCards';
import { EconomyChart } from './EconomyChart';
import { TacticalInsights } from './TacticalInsights';
import { HeatmapSlider } from './HeatmapSlider';
import { WeaponInsights } from './WeaponInsights';
import { TacticalBriefing } from './TacticalBriefing';
import { refreshInsights } from '../services/api';
import { exportVisibleReport } from '../utils/exportPdf';

// Widget IDs for drag and drop
type WidgetId = 'signature-agents' | 'map-performance' | 'economy-quick' |
  'executive-summary' | 'key-insights' | 'team-composition' | 'map-strategies' |
  'economic-patterns' | 'player-tendencies' | 'exploitable-patterns' |
  'top-performers' | 'map-bans' | 'side-strength';

// Default layout optimized for visual hierarchy:
// Row 1: Executive Summary (wide) + Key Insights (wide) - most important content
// Row 2: Quick stats row - Signature Agents, Map Performance, Top Performers, Economy Quick
// Row 3: Analysis widgets - Team Composition, Map Strategies, Economic Patterns, Side Strength
// Row 4: Exploitable Patterns (wide) + Player Tendencies + Map Bans
const DEFAULT_WIDGET_ORDER: WidgetId[] = [
  // Row 1: Hero widgets (both wide, side by side)
  'executive-summary',      // 2 cols - top left
  'key-insights',           // 2 cols - top right
  
  // Row 2: Quick stats (4 narrow widgets)
  'signature-agents',       // 1 col
  'map-performance',        // 1 col
  'top-performers',         // 1 col
  'economy-quick',          // 1 col
  
  // Row 3: Analysis widgets (4 narrow widgets)
  'team-composition',       // 1 col
  'map-strategies',         // 1 col
  'economic-patterns',      // 1 col
  'side-strength',          // 1 col
  
  // Row 4: Bottom section
  'exploitable-patterns',   // 2 cols - wide
  'player-tendencies',      // 1 col
  'map-bans',               // 1 col
];

const WIDGET_STORAGE_KEY = 'overview-widget-order';

// Widget size configuration (column spans)
// On lg screens (4 columns), widgets can span 1-2 columns
// On md screens (2 columns), widgets with cols: 2 will span full width
const WIDGET_SIZES: Record<WidgetId, { cols: number; rows?: number }> = {
  'signature-agents': { cols: 1 },
  'map-performance': { cols: 1 },
  'economy-quick': { cols: 1 },
  'executive-summary': { cols: 2 }, // Wider - spans 2 columns
  'key-insights': { cols: 2 }, // Wider - spans 2 columns
  'team-composition': { cols: 1 },
  'map-strategies': { cols: 1 },
  'economic-patterns': { cols: 1 },
  'player-tendencies': { cols: 1 },
  'exploitable-patterns': { cols: 2 }, // Wider - spans 2 columns
  'top-performers': { cols: 1 },
  'map-bans': { cols: 1 },
  'side-strength': { cols: 1 },
};

// Sortable Widget Wrapper Component
interface SortableWidgetProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  size?: { cols: number; rows?: number };
}

function SortableWidget({ id, children, className = '', size = { cols: 1 } }: SortableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    gridColumn: `span ${size.cols}`,
    gridRow: size.rows ? `span ${size.rows}` : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${className} ${isDragging ? 'opacity-40 scale-95' : 'opacity-100'} transition-all duration-200`}
    >
      {/* Drag Handle - Always visible, more prominent on hover */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 z-20 cursor-grab active:cursor-grabbing"
        title="Drag to rearrange"
      >
        <motion.div 
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-surface-200/90 backdrop-blur-sm border border-white/40 shadow-lg transition-all"
          whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,70,85,0.2)', borderColor: 'rgba(255,70,85,0.5)' }}
          whileTap={{ scale: 0.95 }}
        >
          <GripVertical className="w-4 h-4 text-valorant-gray group-hover:text-valorant-red transition-colors" />
        </motion.div>
      </div>

      {/* Highlight border on hover and drag */}
      <div className={`absolute inset-0 rounded-xl pointer-events-none transition-all duration-200 ${
        isDragging
          ? 'ring-2 ring-valorant-red ring-offset-2 ring-offset-surface-400 shadow-2xl'
          : 'ring-0 group-hover:ring-1 group-hover:ring-white/20'
      }`} />

      {children}
    </div>
  );
}

// Agent UUIDs for images
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
};

const getAgentIcon = (agent: string): string => {
  const uuid = agentUUIDs[agent];
  return uuid ? `https://media.valorant-api.com/agents/${uuid}/displayicon.png` : '';
};

interface ReportViewProps {
  report: ScoutingReport;
  reportId: string;
  onBack: () => void;
  team?: Team | null;
  tournamentName?: string | null;
}

type TabId = 'briefing' | 'overview' | 'agents' | 'maps' | 'economy' | 'players' | 'weapons' | 'exploits' | 'heatmaps';

const tabs: { id: TabId; label: string; icon: typeof Target }[] = [
  { id: 'overview', label: 'Overview', icon: Target },
  { id: 'briefing', label: 'Tactical Briefing', icon: Target },
  { id: 'agents', label: 'Agents', icon: Users },
  { id: 'maps', label: 'Maps', icon: TrendingUp },
  { id: 'economy', label: 'Economy', icon: DollarSign },
  { id: 'players', label: 'Players', icon: Users },
  { id: 'weapons', label: 'Weapons', icon: Crosshair },
  { id: 'exploits', label: 'Exploits', icon: AlertTriangle },
  { id: 'heatmaps', label: 'Heatmaps', icon: Flame },
];

function ReportView({ report, reportId, onBack, team, tournamentName }: ReportViewProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [insightsExpanded, setInsightsExpanded] = useState(true);
  const [insights, setInsights] = useState<string[]>(report.key_insights || []);
  const [isRefreshingInsights, setIsRefreshingInsights] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  
  // Determine data source label
  const dataSourceLabel = tournamentName || report.tournament_name || 'Recent Matches';
  
  // Handle insights refresh
  const handleRefreshInsights = async () => {
    if (isRefreshingInsights) return;
    
    setIsRefreshingInsights(true);
    try {
      const response = await refreshInsights(reportId);
      setInsights(response.insights);
    } catch (error) {
      console.error('Failed to refresh insights:', error);
    } finally {
      setIsRefreshingInsights(false);
    }
  };
  
  // Handle PDF export - captures the actual UI
  const handleExportPdf = async () => {
    if (isExportingPdf) return;
    
    setIsExportingPdf(true);
    try {
      await exportVisibleReport({
        report,
        teamName: report.team_name ?? 'Unknown team',
        tournamentName: tournamentName || report.tournament_name,
      });
    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-lg bg-surface-100 flex items-center justify-center hover:bg-surface-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-valorant-gray" />
          </button>
          
          {/* Team Logo */}
          {team?.logo_url ? (
            <div className="w-14 h-14 rounded-lg bg-surface-100 p-1.5 flex items-center justify-center overflow-hidden">
              <img 
                src={team.logo_url} 
                alt={`${report.team_name ?? 'Team'} logo`}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-lg bg-valorant-red/20 flex items-center justify-center">
              <span className="text-xl font-bold text-valorant-red">
                {(report.team_name ?? '??').slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}
          
          <div>
            <h1 className="val-header text-3xl text-valorant-cream">
              SCOUTING REPORT: <span className="text-valorant-red">{(report.team_name ?? 'Unknown team').toUpperCase()}</span>
            </h1>
            <div className="flex items-center gap-4 mt-1 text-sm text-valorant-gray">
              <span className="flex items-center gap-1">
                <Target className="w-4 h-4" />
                {report.matches_analyzed} matches ({report.total_maps_played || 0} maps)
              </span>
              <span className="text-valorant-gray/30">•</span>
              <span className="flex items-center gap-1 text-valorant-red/80">
                <Trophy className="w-4 h-4" />
                {dataSourceLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="px-4 py-2 rounded-lg bg-valorant-red text-sm text-white hover:bg-valorant-darkred transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExportingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export PDF
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex gap-2 p-1 bg-surface-200 rounded-xl overflow-x-auto"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isBriefing = tab.id === 'briefing';
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-valorant-red text-white'
                  : 'text-valorant-gray hover:text-valorant-cream hover:bg-surface-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {isBriefing && (
                <span className="ml-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/25 text-amber-400 border border-amber-500/40">
                  AI
                </span>
              )}
            </button>
          );
        })}
      </motion.div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'briefing' && report.tactical_briefing && (
          <TacticalBriefing briefing={report.tactical_briefing} />
        )}
        {activeTab === 'overview' && (
          <OverviewTab
            report={report}
            team={team}
            tournamentName={tournamentName || report.tournament_name}
            insights={insights}
            insightsExpanded={insightsExpanded}
            setInsightsExpanded={setInsightsExpanded}
            isRefreshingInsights={isRefreshingInsights}
            handleRefreshInsights={handleRefreshInsights}
          />
        )}
        {activeTab === 'agents' && <AgentComps tendencies={report.agent_tendencies} />}
        {activeTab === 'maps' && <MapBreakdown siteTendencies={report.site_tendencies} />}
        {activeTab === 'economy' && <EconomyChart patterns={report.economy_patterns} />}
        {activeTab === 'players' && <PlayerCards players={report.player_tendencies} />}
        {activeTab === 'weapons' && <WeaponInsights patterns={report.weapon_patterns} />}
        {activeTab === 'exploits' && <TacticalInsights patterns={report.exploitable_patterns} />}
        {activeTab === 'heatmaps' && <HeatmapSlider patterns={report.exploitable_patterns} />}
      </motion.div>
    </div>
  );
}

function OverviewTab({
  report,
  team,
  tournamentName,
  insights,
  insightsExpanded,
  setInsightsExpanded,
  isRefreshingInsights,
  handleRefreshInsights
}: {
  report: ScoutingReport;
  team?: Team | null;
  tournamentName?: string | null;
  insights: string[];
  insightsExpanded: boolean;
  setInsightsExpanded: (value: boolean) => void;
  isRefreshingInsights: boolean;
  handleRefreshInsights: () => void;
}) {
  // Widget order state with localStorage persistence
  const [widgetOrder, setWidgetOrder] = useState<WidgetId[]>(() => {
    try {
      const stored = localStorage.getItem(WIDGET_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate and ensure all widgets are present
        const validOrder = parsed.filter((id: string) => DEFAULT_WIDGET_ORDER.includes(id as WidgetId));
        const missingWidgets = DEFAULT_WIDGET_ORDER.filter(id => !validOrder.includes(id));
        return [...validOrder, ...missingWidgets] as WidgetId[];
      }
    } catch (e) {
      console.error('Failed to load widget order:', e);
    }
    return DEFAULT_WIDGET_ORDER;
  });

  const [activeId, setActiveId] = useState<string | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      setWidgetOrder((items) => {
        const oldIndex = items.indexOf(active.id as WidgetId);
        const newIndex = items.indexOf(over.id as WidgetId);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        // Persist to localStorage
        localStorage.setItem(WIDGET_STORAGE_KEY, JSON.stringify(newOrder));
        return newOrder;
      });
    }
  };

  // Reset to default order
  const resetWidgetOrder = () => {
    setWidgetOrder(DEFAULT_WIDGET_ORDER);
    localStorage.removeItem(WIDGET_STORAGE_KEY);
  };

  // Check if order is customized
  const isCustomOrder = JSON.stringify(widgetOrder) !== JSON.stringify(DEFAULT_WIDGET_ORDER);

  // Calculate some stats
  const topAgents = Object.entries(report.agent_tendencies?.agent_pick_rates || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const mapStats = Object.entries(report.site_tendencies || {});
  const sortedMaps = [...mapStats].sort(([, a], [, b]) => (b.map_win_rate || 0) - (a.map_win_rate || 0));
  const bestMap = sortedMaps[0];

  const playerStats = Object.entries(report.player_tendencies || {})
    .filter(([, p]) => !p.is_new_player)
    .sort(([, a], [, b]) => b.kd_ratio - a.kd_ratio);
  const topPlayer = playerStats[0];

  // Calculate overall win rate
  const totalWins = mapStats.reduce((sum, [, s]) => sum + (s.games_played || 0) * (s.map_win_rate || 0), 0);
  const totalGames = mapStats.reduce((sum, [, s]) => sum + (s.games_played || 0), 0);
  const overallWinRate = totalGames > 0 ? (totalWins / totalGames) * 100 : 0;

  // Data source label
  const dataSource = tournamentName || 'Recent Matches';

  // Widget render map
  const renderWidget = (widgetId: WidgetId) => {
    switch (widgetId) {
      case 'signature-agents':
        return (
          <SignatureAgentsWidget
            key={widgetId}
            topAgents={topAgents}
            getAgentIcon={getAgentIcon}
          />
        );
      case 'map-performance':
        return (
          <MapPerformanceWidget
            key={widgetId}
            sortedMaps={sortedMaps}
          />
        );
      case 'economy-quick':
        return (
          <EconomyQuickWidget
            key={widgetId}
            economyPatterns={report.economy_patterns}
          />
        );
      case 'executive-summary':
        return (
          <ExecutiveSummaryWidget
            key={widgetId}
            executiveSummary={report.executive_summary}
          />
        );
      case 'key-insights':
        return (
          <KeyInsightsWidget
            key={widgetId}
            insights={insights}
            insightsExpanded={insightsExpanded}
            setInsightsExpanded={setInsightsExpanded}
            isRefreshingInsights={isRefreshingInsights}
            handleRefreshInsights={handleRefreshInsights}
          />
        );
      case 'team-composition':
        return (
          <TeamCompositionWidget
            key={widgetId}
            topAgents={topAgents}
            getAgentIcon={getAgentIcon}
            topComposition={report.agent_tendencies?.top_compositions?.[0]}
          />
        );
      case 'map-strategies':
        return (
          <MapStrategiesWidget
            key={widgetId}
            sortedMaps={sortedMaps}
          />
        );
      case 'economic-patterns':
        return (
          <EconomicPatternsWidget
            key={widgetId}
            economyPatterns={report.economy_patterns}
          />
        );
      case 'player-tendencies':
        return (
          <PlayerTendenciesWidget
            key={widgetId}
            playerStats={playerStats}
          />
        );
      case 'exploitable-patterns':
        return (
          <ExploitablePatternsWidget
            key={widgetId}
            exploitablePatterns={report.exploitable_patterns}
          />
        );
      case 'top-performers':
        return (
          <TopPerformersWidget
            key={widgetId}
            playerStats={playerStats}
          />
        );
      case 'map-bans':
        return report.ban_recommendations && report.ban_recommendations.length > 0 ? (
          <MapBansWidget
            key={widgetId}
            banRecommendations={report.ban_recommendations}
          />
        ) : null;
      case 'side-strength':
        return (
          <SideStrengthWidget
            key={widgetId}
            mapStats={mapStats}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-2xl p-8"
        style={{
          background: 'linear-gradient(135deg, rgba(30,30,35,1) 0%, rgba(20,20,25,1) 50%, rgba(30,30,35,1) 100%)'
        }}
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(255,70,85,0.15) 0%, transparent 70%)' }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)' }}
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />
        </div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(255,70,85,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,70,85,1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} />
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Team Logo */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="flex-shrink-0"
              >
                {team?.logo_url ? (
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl bg-surface-100/80 backdrop-blur p-2 flex items-center justify-center shadow-xl ring-2 ring-white/10">
                    <img 
                      src={team.logo_url} 
                      alt={`${report.team_name ?? 'Team'} logo`}
                      className="w-full h-full object-contain drop-shadow-lg"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl bg-gradient-to-br from-valorant-red/30 to-valorant-red/10 flex items-center justify-center shadow-xl ring-2 ring-valorant-red/30">
                    <span className="text-3xl md:text-4xl font-black text-valorant-red">
                      {(report.team_name ?? '??').slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
              </motion.div>
              
              <div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-valorant-red/20 border border-valorant-red/30 mb-3"
                >
                  <span className="w-2 h-2 rounded-full bg-valorant-red animate-pulse" />
                  <span className="text-xs uppercase tracking-widest text-valorant-red font-semibold">Scouting Intel</span>
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-4xl md:text-5xl font-black text-valorant-cream tracking-tight"
                >
                  {report.team_name ?? 'Unknown team'}
                </motion.h2>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-valorant-gray mt-2 flex flex-wrap items-center gap-3"
                >
                  <span className="flex items-center gap-1">
                    <Target className="w-4 h-4 text-valorant-red" />
                    {report.total_maps_played || report.matches_analyzed} maps
                  </span>
                  <span className="text-valorant-gray/30">•</span>
                  <span>{report.matches_analyzed} series</span>
                  <span className="text-valorant-gray/30">•</span>
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-amber-400 text-sm font-medium">{dataSource}</span>
                  </span>
                </motion.div>
              </div>
            </div>
            
            {/* Win Rate Circular */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 100 }}
              className="relative"
            >
              <div className="w-36 h-36 rounded-full bg-surface-400/50 backdrop-blur flex items-center justify-center relative shadow-2xl">
                {/* Outer glow */}
                <div className={`absolute inset-0 rounded-full blur-xl ${overallWinRate >= 50 ? 'bg-green-500/20' : 'bg-red-500/20'}`} />
                
                {/* Animated ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle
                    cx="72" cy="72" r="64"
                    fill="none"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="6"
                  />
                  <motion.circle
                    cx="72" cy="72" r="64"
                    fill="none"
                    stroke={overallWinRate >= 50 ? '#22c55e' : '#ef4444'}
                    strokeWidth="6"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: '0 402' }}
                    animate={{ strokeDasharray: `${(overallWinRate / 100) * 402} 402` }}
                    transition={{ duration: 1.5, ease: 'easeOut', delay: 0.6 }}
                    style={{ filter: `drop-shadow(0 0 8px ${overallWinRate >= 50 ? '#22c55e' : '#ef4444'})` }}
                  />
                </svg>
                <div className="text-center relative z-10">
                  <motion.span 
                    className={`text-4xl font-black ${overallWinRate >= 50 ? 'text-green-400' : 'text-red-400'}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                  >
                    {overallWinRate.toFixed(0)}%
                  </motion.span>
                  <p className="text-[10px] text-valorant-gray uppercase tracking-widest mt-1">Win Rate</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Target, value: report.total_maps_played || report.matches_analyzed, label: 'Maps Played', gradient: 'from-valorant-red/20 to-transparent', iconColor: 'text-valorant-red', textColor: 'text-valorant-red' },
          { icon: Trophy, value: bestMap ? `${((bestMap[1].map_win_rate || 0) * 100).toFixed(0)}%` : 'N/A', label: `Best: ${bestMap?.[0] || 'N/A'}`, gradient: 'from-green-500/20 to-transparent', iconColor: 'text-green-400', textColor: 'text-green-400' },
          { icon: Crosshair, value: topPlayer ? topPlayer[1].kd_ratio.toFixed(2) : 'N/A', label: `MVP: ${topPlayer?.[0] || 'N/A'}`, gradient: 'from-amber-500/20 to-transparent', iconColor: 'text-amber-400', textColor: 'text-amber-400' },
          { icon: Shield, value: `${Object.keys(report.agent_tendencies?.agent_pick_rates || {}).length}`, label: 'Agent Pool', gradient: 'from-purple-500/20 to-transparent', iconColor: 'text-purple-400', textColor: 'text-purple-400' },
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * idx }}
            whileHover={{ scale: 1.03, y: -3 }}
            className="group relative overflow-hidden rounded-xl bg-surface-300/80 backdrop-blur p-5 cursor-default border border-white/5 hover:border-white/10 transition-all"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            <div className="relative z-10">
              <stat.icon className={`w-5 h-5 ${stat.iconColor} mb-3 group-hover:scale-110 transition-transform`} />
              <p className={`text-2xl md:text-3xl font-black ${stat.textColor}`}>{stat.value}</p>
              <p className="text-xs text-valorant-gray mt-1 truncate">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Draggable Widgets Section */}
      <div className="space-y-4">
        {/* Section Header with Reset Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-8 h-px bg-gradient-to-r from-valorant-red to-transparent" />
            <h3 className="text-sm font-medium text-valorant-gray uppercase tracking-widest">Dashboard Widgets</h3>
            <span className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-valorant-red/10 border border-valorant-red/20">
              <GripVertical className="w-3.5 h-3.5 text-valorant-red" />
              <span className="text-[10px] text-valorant-red font-medium">Drag widgets to rearrange</span>
            </div>
            {isCustomOrder && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={resetWidgetOrder}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-200/50 text-valorant-gray hover:text-valorant-cream hover:bg-surface-200 transition-colors text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Layout
              </motion.button>
            )}
          </div>
        </div>

        {/* Draggable Widget Grid */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={widgetOrder} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-min">
              {widgetOrder.map((widgetId) => {
                const widget = renderWidget(widgetId);
                if (!widget) return null;
                const size = WIDGET_SIZES[widgetId] || { cols: 1 };
                // Larger widgets get more height
                const minHeight = size.cols === 2 ? 'min-h-[300px]' : 'min-h-[240px]';
                return (
                  <SortableWidget 
                    key={widgetId} 
                    id={widgetId} 
                    size={size}
                    className={minHeight}
                  >
                    {widget}
                  </SortableWidget>
                );
              })}
            </div>
          </SortableContext>

          {/* Drag Overlay for visual feedback */}
          <DragOverlay>
            {activeId ? (
              <div className="opacity-90 rotate-2 scale-105 shadow-2xl ring-2 ring-valorant-red ring-offset-2 rounded-xl overflow-hidden">
                {renderWidget(activeId as WidgetId)}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}

// ============================================
// Widget Components
// ============================================

interface SignatureAgentsWidgetProps {
  topAgents: [string, number][];
  getAgentIcon: (agent: string) => string;
}

function SignatureAgentsWidget({ topAgents, getAgentIcon }: SignatureAgentsWidgetProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-surface-300/80 backdrop-blur p-5 overflow-hidden relative border border-white/5 h-full"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
      <h4 className="text-sm font-semibold text-valorant-cream mb-4 flex items-center gap-2">
        <Users className="w-4 h-4 text-purple-400" />
        Signature Agents
      </h4>
      <div className="space-y-3 relative">
        {topAgents.slice(0, 4).map(([agent, rate], index) => (
          <div key={agent} className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-lg overflow-hidden ring-2 ring-transparent group-hover:ring-valorant-red/50 transition-all shadow-lg">
                {getAgentIcon(agent) ? (
                  <img src={getAgentIcon(agent)} alt={agent} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-surface-200 flex items-center justify-center text-xs font-bold text-valorant-gray">
                    {agent.slice(0, 2)}
                  </div>
                )}
              </div>
              {index === 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center shadow-lg">
                  <Trophy className="w-2.5 h-2.5 text-black" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-valorant-cream text-sm font-medium truncate">{agent}</span>
                <span className="text-valorant-red font-mono text-xs font-bold">{(rate * 100).toFixed(0)}%</span>
              </div>
              <div className="h-1 bg-surface-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-valorant-red to-purple-500"
                  style={{ width: `${rate * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// Map Performance Widget
interface MapPerformanceWidgetProps {
  sortedMaps: [string, { map_win_rate?: number; games_played?: number }][];
}

function MapPerformanceWidget({ sortedMaps }: MapPerformanceWidgetProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-surface-300/80 backdrop-blur p-5 overflow-hidden relative border border-white/5 h-full"
    >
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl" />
      <h4 className="text-sm font-semibold text-valorant-cream mb-4 flex items-center gap-2">
        <Map className="w-4 h-4 text-green-400" />
        Map Performance
      </h4>
      <div className="space-y-2 relative">
        {sortedMaps.slice(0, 5).map(([mapName, stats]) => {
          const winRate = (stats.map_win_rate || 0) * 100;
          const isGood = winRate >= 50;
          return (
            <div
              key={mapName}
              className={`flex items-center justify-between p-2.5 rounded-lg transition-all hover:scale-[1.02] cursor-default ${
                isGood ? 'bg-green-500/10' : 'bg-red-500/10'
              }`}
            >
              <div className="flex items-center gap-2">
                <TrendingUp className={`w-3.5 h-3.5 ${isGood ? 'text-green-400' : 'text-red-400 rotate-180'}`} />
                <div>
                  <span className="text-xs text-valorant-cream font-medium capitalize">{mapName}</span>
                  <p className="text-[10px] text-valorant-gray">{stats.games_played || 0} games</p>
                </div>
              </div>
              <span className={`font-mono text-sm font-bold ${isGood ? 'text-green-400' : 'text-red-400'}`}>
                {winRate.toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// Economy Quick Widget
interface EconomyQuickWidgetProps {
  economyPatterns?: ScoutingReport['economy_patterns'];
}

function EconomyQuickWidget({ economyPatterns }: EconomyQuickWidgetProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-surface-300/80 backdrop-blur p-5 border border-white/5 h-full"
    >
      <h4 className="text-sm font-semibold text-valorant-cream mb-4 flex items-center gap-2">
        <DollarSign className="w-4 h-4 text-amber-400" />
        Economy
      </h4>
      <div className="grid grid-cols-2 gap-2">
        <div className="text-center p-3 bg-surface-200/50 rounded-lg border border-white/5">
          <p className="text-xl font-bold text-valorant-cream">
            {((economyPatterns?.pistol_win_rate || 0) * 100).toFixed(0)}%
          </p>
          <p className="text-[10px] text-valorant-gray mt-1">Pistol</p>
        </div>
        <div className="text-center p-3 bg-surface-200/50 rounded-lg border border-white/5">
          <p className="text-xl font-bold text-valorant-cream">
            {((economyPatterns?.eco_round_win_rate || 0) * 100).toFixed(0)}%
          </p>
          <p className="text-[10px] text-valorant-gray mt-1">Eco</p>
        </div>
      </div>
    </motion.div>
  );
}

// Executive Summary Widget
interface ExecutiveSummaryWidgetProps {
  executiveSummary: string;
}

function ExecutiveSummaryWidget({ executiveSummary }: ExecutiveSummaryWidgetProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-xl bg-surface-300/80 backdrop-blur p-6 border border-white/5 h-full col-span-1 md:col-span-2"
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-valorant-red via-purple-500 to-amber-500" />
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-valorant-red/20 flex items-center justify-center">
          <Lightbulb className="w-5 h-5 text-valorant-red" />
        </div>
        <div>
          <h3 className="font-bold text-valorant-cream">Executive Summary</h3>
          <p className="text-xs text-valorant-gray">AI-Generated Analysis</p>
        </div>
      </div>
      <div className="text-valorant-gray leading-relaxed text-sm">
        <ReactMarkdown
          components={{
            h1: () => null,
            h2: () => null,
            h3: ({ children }) => <h3 className="text-base font-semibold text-valorant-cream mt-4 mb-2 flex items-center gap-2"><span className="w-1 h-4 bg-valorant-red rounded-full" />{children}</h3>,
            p: ({ children }) => <p className="mb-3 text-valorant-gray/90">{children}</p>,
            strong: ({ children }) => <strong className="text-valorant-cream font-semibold">{children}</strong>,
            ul: ({ children }) => <ul className="space-y-2 my-3">{children}</ul>,
            li: ({ children }) => <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-valorant-red mt-2 flex-shrink-0" /><span>{children}</span></li>,
          }}
        >
          {executiveSummary}
        </ReactMarkdown>
      </div>
    </motion.div>
  );
}

// Key Insights Widget
interface KeyInsightsWidgetProps {
  insights: string[];
  insightsExpanded: boolean;
  setInsightsExpanded: (value: boolean) => void;
  isRefreshingInsights: boolean;
  handleRefreshInsights: () => void;
}

function KeyInsightsWidget({
  insights,
  insightsExpanded,
  setInsightsExpanded,
  isRefreshingInsights,
  handleRefreshInsights,
}: KeyInsightsWidgetProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden h-full col-span-1 md:col-span-2"
      style={{
        background: 'linear-gradient(135deg, rgba(255,70,85,0.1) 0%, rgba(30,30,35,0.95) 30%, rgba(30,30,35,0.95) 100%)',
        border: '1px solid rgba(255,70,85,0.2)'
      }}
    >
      <div className="p-4 flex items-center justify-between">
        <button
          onClick={() => setInsightsExpanded(!insightsExpanded)}
          className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity"
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-lg bg-valorant-red/20 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-valorant-red" />
            </div>
          </div>
          <div className="text-left">
            <h3 className="font-bold text-valorant-cream flex items-center gap-2 text-sm">
              Key Insights
              <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-valorant-red/20 text-valorant-red">
                AI Generated
              </span>
            </h3>
            <p className="text-[10px] text-valorant-gray mt-0.5">
              {insights.length} actionable insights
            </p>
          </div>
        </button>
        <div className="flex items-center gap-2">
          <motion.button
            onClick={handleRefreshInsights}
            disabled={isRefreshingInsights}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isRefreshingInsights
                ? 'bg-surface-200/50 text-valorant-gray cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500/20 to-valorant-red/20 text-valorant-cream hover:from-purple-500/30 hover:to-valorant-red/30 border border-purple-500/30'
            }`}
          >
            <motion.div
              animate={isRefreshingInsights ? { rotate: 360 } : {}}
              transition={{ duration: 1, repeat: isRefreshingInsights ? Infinity : 0, ease: "linear" }}
            >
              {isRefreshingInsights ? <RefreshCw className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5 text-purple-400" />}
            </motion.div>
            {isRefreshingInsights ? 'Generating...' : 'Regenerate'}
          </motion.button>
          <motion.button
            onClick={() => setInsightsExpanded(!insightsExpanded)}
            animate={{ rotate: insightsExpanded ? 180 : 0 }}
            className="w-7 h-7 rounded-lg bg-surface-200/50 flex items-center justify-center hover:bg-surface-200 transition-colors"
          >
            <ChevronDown className="w-4 h-4 text-valorant-gray" />
          </motion.button>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {insightsExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              <div className="border-t border-white/5 pt-3">
                {isRefreshingInsights ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        className="w-10 h-10 mx-auto mb-3 rounded-full border-2 border-valorant-red border-t-transparent"
                      />
                      <p className="text-valorant-gray text-xs">Generating insights...</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {insights.map((insight, index) => (
                      <div key={index} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-surface-200/30 hover:bg-surface-200/50 transition-all">
                        <span className="w-5 h-5 rounded-full bg-gradient-to-br from-valorant-red to-valorant-red/50 flex items-center justify-center flex-shrink-0 text-[9px] font-bold text-white">
                          {index + 1}
                        </span>
                        <p className="text-xs text-valorant-gray leading-relaxed">{insight}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Team Composition Widget
interface TeamCompositionWidgetProps {
  topAgents: [string, number][];
  getAgentIcon: (agent: string) => string;
  topComposition?: { agents: string[] };
}

function TeamCompositionWidget({ topAgents, getAgentIcon, topComposition }: TeamCompositionWidgetProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-surface-300/60 backdrop-blur overflow-hidden border border-white/5 hover:border-purple-500/30 transition-all h-full"
    >
      <div className="p-4 border-l-2 border-purple-500/50 h-full">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <h4 className="font-semibold text-valorant-cream text-sm">Team Composition</h4>
        </div>
        <div className="space-y-2">
          {topAgents.slice(0, 3).map(([agent, rate]) => (
            <div key={agent} className="flex items-center gap-2">
              <div className="w-6 h-6 rounded overflow-hidden flex-shrink-0">
                {getAgentIcon(agent) ? (
                  <img src={getAgentIcon(agent)} alt={agent} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-purple-500/30 flex items-center justify-center text-[8px] text-purple-300">{agent.slice(0,2)}</div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-xs text-valorant-cream">{agent}</span>
                  <span className="text-xs font-mono text-purple-400">{(rate * 100).toFixed(0)}%</span>
                </div>
                <div className="h-1 bg-surface-200 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${rate * 100}%` }} />
                </div>
              </div>
            </div>
          ))}
          {topComposition && (
            <div className="mt-3 pt-2 border-t border-white/5">
              <p className="text-[10px] text-valorant-gray mb-1">Top Comp:</p>
              <div className="flex gap-1">
                {topComposition.agents.slice(0, 5).map((agent: string) => (
                  <div key={agent} className="w-5 h-5 rounded overflow-hidden" title={agent}>
                    {getAgentIcon(agent) ? (
                      <img src={getAgentIcon(agent)} alt={agent} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-purple-500/30 text-[6px] flex items-center justify-center">{agent.slice(0,2)}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Map Strategies Widget
interface MapStrategiesWidgetProps {
  sortedMaps: [string, { map_win_rate?: number; games_played?: number }][];
}

function MapStrategiesWidget({ sortedMaps }: MapStrategiesWidgetProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-surface-300/60 backdrop-blur overflow-hidden border border-white/5 hover:border-green-500/30 transition-all h-full"
    >
      <div className="p-4 border-l-2 border-green-500/50 h-full">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
            <Map className="w-4 h-4 text-green-400" />
          </div>
          <h4 className="font-semibold text-valorant-cream text-sm">Map Strategies</h4>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {sortedMaps.slice(0, 4).map(([mapName, stats]) => {
            const wr = (stats.map_win_rate || 0) * 100;
            const isGood = wr >= 50;
            return (
              <div key={mapName} className={`p-2 rounded-lg ${isGood ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-valorant-cream capitalize truncate">{mapName}</span>
                  <span className={`text-xs font-mono font-bold ${isGood ? 'text-green-400' : 'text-red-400'}`}>
                    {wr.toFixed(0)}%
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[9px] text-valorant-gray">{stats.games_played || 0}g</span>
                  <div className="flex-1 h-1 bg-surface-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${isGood ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${wr}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

// Economic Patterns Widget
interface EconomicPatternsWidgetProps {
  economyPatterns?: ScoutingReport['economy_patterns'];
}

function EconomicPatternsWidget({ economyPatterns }: EconomicPatternsWidgetProps) {
  const stats = [
    { label: 'Pistol Win', value: (economyPatterns?.pistol_win_rate || 0) * 100, color: 'amber' },
    { label: 'R2 Convert', value: (economyPatterns?.round2_conversion_rate || 0) * 100, color: 'green' },
    { label: 'Force Buy', value: (economyPatterns?.force_buy_rate || 0) * 100, color: 'orange' },
    { label: 'Eco Win', value: (economyPatterns?.eco_round_win_rate || 0) * 100, color: 'cyan' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-surface-300/60 backdrop-blur overflow-hidden border border-white/5 hover:border-amber-500/30 transition-all h-full"
    >
      <div className="p-4 border-l-2 border-amber-500/50 h-full">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <h4 className="font-semibold text-valorant-cream text-sm">Economic Patterns</h4>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-surface-200/50 rounded-lg p-2 text-center">
              <p className={`text-lg font-bold text-${stat.color}-400`}>{stat.value.toFixed(0)}%</p>
              <p className="text-[9px] text-valorant-gray">{stat.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-2 pt-2 border-t border-white/5 text-[10px] text-valorant-gray">
          <span className="text-amber-400">Tip:</span> {(economyPatterns?.force_buy_rate || 0) > 0.3 ? 'High force buy rate - punish with anti-eco' : 'Conservative economy - expect full buys'}
        </div>
      </div>
    </motion.div>
  );
}

// Player Tendencies Widget
interface PlayerTendenciesWidgetProps {
  playerStats: [string, { kd_ratio: number; primary_agent: string; primary_role: string; kills: number; deaths: number }][];
}

function PlayerTendenciesWidget({ playerStats }: PlayerTendenciesWidgetProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-surface-300/60 backdrop-blur overflow-hidden border border-white/5 hover:border-cyan-500/30 transition-all h-full"
    >
      <div className="p-4 border-l-2 border-cyan-500/50 h-full">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
            <Crosshair className="w-4 h-4 text-cyan-400" />
          </div>
          <h4 className="font-semibold text-valorant-cream text-sm">Player Tendencies</h4>
        </div>
        <div className="space-y-2">
          {playerStats.slice(0, 3).map(([name, stats], i) => (
            <div key={name} className="flex items-center justify-between p-2 bg-surface-200/30 rounded-lg">
              <div className="flex items-center gap-2">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                  i === 0 ? 'bg-cyan-500 text-black' : 'bg-surface-100 text-valorant-gray'
                }`}>{i + 1}</span>
                <div>
                  <p className="text-xs text-valorant-cream font-medium">{name}</p>
                  <p className="text-[9px] text-valorant-gray">{stats.primary_agent} - {stats.primary_role}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono font-bold text-cyan-400">{stats.kd_ratio.toFixed(2)}</p>
                <p className="text-[8px] text-valorant-gray">{stats.kills}K/{stats.deaths}D</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Exploitable Patterns Widget
interface ExploitablePatternsWidgetProps {
  exploitablePatterns?: ScoutingReport['exploitable_patterns'];
}

function ExploitablePatternsWidget({ exploitablePatterns }: ExploitablePatternsWidgetProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-surface-300/60 backdrop-blur overflow-hidden border border-white/5 hover:border-red-500/30 transition-all h-full col-span-1 md:col-span-2"
    >
      <div className="p-4 border-l-2 border-red-500/50 h-full">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <h4 className="font-semibold text-valorant-cream text-sm">Exploitable Patterns</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-surface-200/30 rounded-lg p-3">
            <p className="text-[10px] text-red-400 font-semibold uppercase tracking-wider mb-2">Timing Tells</p>
            <div className="space-y-1.5">
              {(exploitablePatterns?.timing_tells || []).slice(0, 2).map((tell, i) => (
                <p key={i} className="text-[10px] text-valorant-gray flex items-start gap-1">
                  <span className="text-red-400 mt-0.5">-</span>
                  <span className="line-clamp-2">{tell}</span>
                </p>
              ))}
              {(!exploitablePatterns?.timing_tells?.length) && (
                <p className="text-[10px] text-valorant-gray/50 italic">No patterns identified</p>
              )}
            </div>
          </div>
          <div className="bg-surface-200/30 rounded-lg p-3">
            <p className="text-[10px] text-red-400 font-semibold uppercase tracking-wider mb-2">Weak Sites</p>
            <div className="space-y-1">
              {Object.entries(exploitablePatterns?.weak_sites || {}).slice(0, 3).map(([mapName, site]) => (
                <div key={mapName} className="flex items-center justify-between">
                  <span className="text-[10px] text-valorant-gray capitalize">{mapName}</span>
                  <span className="text-[10px] font-mono text-red-400 bg-red-500/20 px-1.5 py-0.5 rounded">{site as string}</span>
                </div>
              ))}
              {!Object.keys(exploitablePatterns?.weak_sites || {}).length && (
                <p className="text-[10px] text-valorant-gray/50 italic">No weak sites found</p>
              )}
            </div>
          </div>
          <div className="bg-surface-200/30 rounded-lg p-3">
            <p className="text-[10px] text-green-400 font-semibold uppercase tracking-wider mb-2">Counter Tips</p>
            <div className="space-y-1.5">
              {(exploitablePatterns?.counter_strategies || []).slice(0, 2).map((strat, i) => (
                <p key={i} className="text-[10px] text-valorant-gray flex items-start gap-1">
                  <span className="text-green-400 mt-0.5">+</span>
                  <span className="line-clamp-2">{strat}</span>
                </p>
              ))}
              {(!exploitablePatterns?.counter_strategies?.length) && (
                <p className="text-[10px] text-valorant-gray/50 italic">No counters identified</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Top Performers Widget
interface TopPerformersWidgetProps {
  playerStats: [string, { kd_ratio: number; primary_role: string }][];
}

function TopPerformersWidget({ playerStats }: TopPerformersWidgetProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-surface-300/80 backdrop-blur p-5 border border-white/5 h-full"
    >
      <h4 className="text-sm font-semibold text-valorant-cream mb-4 flex items-center gap-2">
        <Crosshair className="w-4 h-4 text-amber-400" />
        Top Performers
      </h4>
      <div className="space-y-2">
        {playerStats.slice(0, 4).map(([playerName, stats], index) => (
          <div
            key={playerName}
            className="flex items-center justify-between p-2 bg-surface-200/50 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                index === 0 ? 'bg-amber-400 text-black' :
                index === 1 ? 'bg-gray-400 text-black' :
                index === 2 ? 'bg-amber-700 text-white' :
                'bg-surface-100 text-valorant-gray'
              }`}>
                {index + 1}
              </span>
              <div>
                <p className="text-xs text-valorant-cream font-medium">{playerName}</p>
                <p className="text-[10px] text-valorant-gray">{stats.primary_role}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-mono font-bold text-green-400">{stats.kd_ratio.toFixed(2)}</p>
              <p className="text-[10px] text-valorant-gray">K/D</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// Map Bans Widget
interface MapBansWidgetProps {
  banRecommendations: string[];
}

function MapBansWidget({ banRecommendations }: MapBansWidgetProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-red-500/10 backdrop-blur p-5 border border-red-500/20 h-full"
    >
      <h4 className="text-sm font-semibold text-valorant-cream mb-3 flex items-center gap-2">
        <Swords className="w-4 h-4 text-red-400" />
        Map Bans
      </h4>
      <div className="flex flex-wrap gap-2">
        {banRecommendations.slice(0, 3).map((ban, index) => (
          <span
            key={index}
            className="px-2 py-1 bg-red-500/20 rounded text-xs text-red-400 font-medium capitalize"
          >
            {ban}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

// Side Strength Widget
interface SideStrengthWidgetProps {
  mapStats: [string, { attack_rounds_won?: number; attack_rounds_played?: number; defense_rounds_won?: number; defense_rounds_played?: number }][];
}

function SideStrengthWidget({ mapStats }: SideStrengthWidgetProps) {
  const totalAttackWon = mapStats.reduce((sum, [, s]) => sum + (s.attack_rounds_won || 0), 0);
  const totalAttackPlayed = mapStats.reduce((sum, [, s]) => sum + (s.attack_rounds_played || 0), 0);
  const totalDefenseWon = mapStats.reduce((sum, [, s]) => sum + (s.defense_rounds_won || 0), 0);
  const totalDefensePlayed = mapStats.reduce((sum, [, s]) => sum + (s.defense_rounds_played || 0), 0);
  const attackWr = totalAttackPlayed > 0 ? (totalAttackWon / totalAttackPlayed) * 100 : 0;
  const defenseWr = totalDefensePlayed > 0 ? (totalDefenseWon / totalDefensePlayed) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-surface-300/80 backdrop-blur p-5 border border-white/5 h-full"
    >
      <h4 className="text-sm font-semibold text-valorant-cream mb-3 flex items-center gap-2">
        <Shield className="w-4 h-4 text-blue-400" />
        Side Strength
      </h4>
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-orange-400">Attack</span>
            <span className="text-valorant-cream font-mono">{attackWr.toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-surface-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full"
              style={{ width: `${attackWr}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-blue-400">Defense</span>
            <span className="text-valorant-cream font-mono">{defenseWr.toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-surface-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
              style={{ width: `${defenseWr}%` }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export { ReportView };
export default ReportView;
