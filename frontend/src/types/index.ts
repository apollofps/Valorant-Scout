// Team types
export interface Player {
  id: string;
  nickname: string;
  full_name?: string;
  country?: string;
  profile_image_url?: string;
}

export interface Team {
  id: string;
  name: string;
  short_name?: string;
  region?: string;
  logo_url?: string;
  players: Player[];
}

export interface TeamSearchResponse {
  teams: Team[];
  query: string;
  count: number;
}

// Report types
export type ReportStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface MapComposition {
  agents: string[];
  games_played: number;
  wins: number;
  win_rate: number;
}

export interface MapAgentData {
  map_name: string;
  games_played: number;
  agent_pick_rates: Record<string, number>;
  top_compositions: MapComposition[];
  most_successful_comp?: MapComposition;
}

export interface AgentTendencies {
  agent_pick_rates: Record<string, number>;
  top_compositions: Array<{
    agents: string[];
    count: number;
    rate: number;
  }>;
  map_compositions?: Record<string, MapAgentData>;
  player_agent_pools: Record<string, string[]>;
  flex_picks: string[];
  recent_comp_changes: string[];
}

export interface SiteTendencies {
  map_name: string;
  a_site_attack_rate: number;
  b_site_attack_rate: number;
  c_site_attack_rate?: number;
  common_attack_executes: string[];
  common_defense_setups: string[];
  average_execute_time: number;
  fast_execute_rate: number;  // Repurposed: attack round win rate
  common_post_plant_positions: string[];
  retake_success_rate: number;  // Repurposed: defense round win rate
  // Map statistics
  map_win_rate?: number;
  games_played?: number;
  attack_rounds_won?: number;
  attack_rounds_played?: number;
  defense_rounds_won?: number;
  defense_rounds_played?: number;
}

export interface EconomyPatterns {
  pistol_attack_strategy: string;
  pistol_defense_strategy: string;
  pistol_win_rate: number;
  round2_after_pistol_win_strategy: string;
  round2_after_pistol_loss_strategy: string;
  round2_conversion_rate: number;
  force_buy_rate: number;
  eco_round_win_rate: number;
}

export interface KillPosition {
  map_name: string;
  x: number;
  y: number;
  killer: string;
  victim: string;
  is_first_blood: boolean;
}

export interface MapBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface PlayerTactics {
  player_name: string;
  first_bloods: number;
  first_deaths: number;
  first_blood_rate: number;
  opening_duel_win_rate: number;
}

export interface ExploitablePatterns {
  timing_tells: string[];
  rotation_patterns: string[];
  weak_sites: Record<string, string>;
  weak_against_agents: string[];
  after_losing_streak: string;
  under_pressure: string;
  counter_strategies: string[];
  player_tactics?: PlayerTactics[];
  kill_heatmap?: KillPosition[];
  map_bounds?: Record<string, MapBounds>;
}

export interface ReportSection {
  title: string;
  content: string;
  data?: Record<string, unknown>;
  priority: number;
}

// Weapon types
export interface WeaponStats {
  weapon_name: string;
  kills: number;
  kill_percentage: number;
  headshot_kills?: number;
}

export interface PlayerWeaponStats {
  player_name: string;
  favorite_weapon: string;
  weapon_kills: Record<string, number>;
  weapon_deaths: Record<string, number>;
}

export interface WeaponPatterns {
  total_kills: number;
  weapon_kill_distribution: Record<string, number>;
  weapon_kill_percentages: Record<string, number>;
  top_weapons: WeaponStats[];
  player_weapon_stats: PlayerWeaponStats[];
  vandal_kills: number;
  phantom_kills: number;
  rifle_preference: 'vandal' | 'phantom' | 'balanced';
  eco_weapon_kills: number;
  smg_kills: number;
  shotgun_kills: number;
  sniper_kills: number;
}


export interface ScoutingReport {
  id: string;
  team_id: string;
  team_name: string;
  generated_at: string;
  matches_analyzed: number;  // Number of series
  total_maps_played: number;  // Total individual maps
  tournament_name?: string;
  date_range: string;
  executive_summary: string;
  sections: ReportSection[];
  agent_tendencies?: AgentTendencies;
  site_tendencies: Record<string, SiteTendencies>;
  economy_patterns?: EconomyPatterns;
  player_tendencies: Record<string, PlayerTendency>;
  exploitable_patterns?: ExploitablePatterns;
  weapon_patterns?: WeaponPatterns;
  key_insights: string[];
  recommended_comps: Array<Record<string, unknown>>;
  ban_recommendations: string[];
  tactical_briefing?: TacticalBriefing;
}

export interface MapStrategy {
  map_name: string;
  narrative: string;
  key_tendencies: string[];
  counter_strategies: string[];
  agent_bans: string[];
  agent_picks: string[];
  site_priorities: Record<string, string>;
  timing_notes: string;
  win_condition: string;
}

export interface TacticalBriefing {
  team_name: string;
  matches_analyzed: number;
  tournament_context: string;
  team_identity: string;
  playstyle_summary: string;
  map_strategies: MapStrategy[];
  star_players: Array<{
    name: string;
    role: string;
    agent: string;
    kd: number;
    threat_level: string;
    counter: string;
  }>;
  economy_weakness: string;
  economy_strength: string;
  primary_win_condition: string;
  critical_actions: string[];
  quick_wins: string[];
}

export interface PlayerTendency {
  player_id?: string;
  kills: number;
  deaths: number;
  assists: number;
  kd_ratio: number;
  avg_damage_per_round: number;
  first_kills: number;
  first_deaths: number;
  first_kill_rate: number;
  primary_agent: string;
  primary_role: string;
  roles_played?: string[];  // For flex players
  agents_played: Record<string, number>;
  games_played?: number;
  is_new_player?: boolean;  // New player with no history on team
  is_former_player?: boolean;  // Former player no longer on roster
  status?: 'active' | 'new' | 'former';  // Player status
  profile_image_url?: string;  // Player profile picture from GRID
}

export interface ReportStatusResponse {
  report_id: string;
  status: ReportStatus;
  progress: number;
  stage?: string;  // Current stage description
  report?: ScoutingReport;
  error?: string;
}

// Match types
export interface MatchSummary {
  id: string;
  opponent_name: string;
  opponent_id: string;
  result: 'win' | 'loss';
  score: string;
  maps: string[];
  date: string;
  tournament?: string;
}
