"""Scouting report data models."""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class ReportStatus(str, Enum):
    """Report generation status."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class MapComposition(BaseModel):
    """Agent composition for a specific map."""
    agents: list[str] = Field(default_factory=list)
    games_played: int = 0
    wins: int = 0
    win_rate: float = 0.0


class MapAgentData(BaseModel):
    """Agent data for a specific map."""
    map_name: str
    games_played: int = 0
    agent_pick_rates: dict[str, float] = Field(default_factory=dict)
    top_compositions: list[MapComposition] = Field(default_factory=list)
    most_successful_comp: Optional[MapComposition] = None


class AgentTendencies(BaseModel):
    """Team's agent selection patterns."""
    # Overall pick rates
    agent_pick_rates: dict[str, float] = Field(default_factory=dict)
    
    # Common compositions (tuple of agents -> frequency)
    top_compositions: list[dict] = Field(default_factory=list)
    
    # Map-specific agent data
    map_compositions: dict[str, MapAgentData] = Field(default_factory=dict)
    
    # Player -> agents mapping
    player_agent_pools: dict[str, list[str]] = Field(default_factory=dict)
    
    # Flex picks (agents played by multiple players)
    flex_picks: list[str] = Field(default_factory=list)
    
    # Recent changes
    recent_comp_changes: list[str] = Field(default_factory=list)


class SiteTendencies(BaseModel):
    """Attack/defense patterns for a specific map."""
    map_name: str
    
    # Attack patterns
    a_site_attack_rate: float = 0.0
    b_site_attack_rate: float = 0.0
    c_site_attack_rate: Optional[float] = None  # Haven/Lotus/Pearl
    
    # Default setups
    common_attack_executes: list[str] = Field(default_factory=list)
    common_defense_setups: list[str] = Field(default_factory=list)
    
    # Timing (repurposed: attack round win rate when no timing data)
    average_execute_time: float = 0.0  # Seconds into round
    fast_execute_rate: float = 0.0  # Attack round win rate
    
    # Post-plant (repurposed: defense round win rate when no retake data)
    common_post_plant_positions: list[str] = Field(default_factory=list)
    retake_success_rate: float = 0.0  # Defense round win rate
    
    # Map statistics
    map_win_rate: float = 0.0
    games_played: int = 0
    attack_rounds_won: int = 0
    attack_rounds_played: int = 0
    defense_rounds_won: int = 0
    defense_rounds_played: int = 0


class EconomyPatterns(BaseModel):
    """Team's economic behavior patterns."""
    # Pistol rounds
    pistol_attack_strategy: str = ""
    pistol_defense_strategy: str = ""
    pistol_win_rate: float = 0.0
    
    # Post-pistol
    round2_after_pistol_win_strategy: str = ""
    round2_after_pistol_loss_strategy: str = ""
    round2_conversion_rate: float = 0.0
    
    # Eco behavior
    force_buy_rate: float = 0.0  # How often they force vs full save
    eco_round_win_rate: float = 0.0
    
    # Anti-eco
    anti_eco_loss_rate: float = 0.0  # How often they lose anti-ecos
    
    # Thriftiness
    average_save_amount: float = 0.0


class KillPosition(BaseModel):
    """Position data for a kill event."""
    map_name: str
    x: float
    y: float
    killer: str
    victim: str
    is_first_blood: bool = False


class PlayerTactics(BaseModel):
    """Tactical tendencies for a player."""
    player_name: str
    first_bloods: int = 0
    first_deaths: int = 0
    first_blood_rate: float = 0.0
    opening_duel_win_rate: float = 0.0  # FB / (FB + FD)


class MapBounds(BaseModel):
    """Map coordinate bounds from GRID API."""
    minX: float
    maxX: float
    minY: float
    maxY: float


class WeaponStats(BaseModel):
    """Statistics for a specific weapon."""
    weapon_name: str
    kills: int = 0
    kill_percentage: float = 0.0  # % of total kills with this weapon
    headshot_kills: int = 0  # If available
    
    
class PlayerWeaponStats(BaseModel):
    """Weapon stats for a specific player."""
    player_name: str
    favorite_weapon: str = ""
    weapon_kills: dict[str, int] = Field(default_factory=dict)  # weapon -> kills
    weapon_deaths: dict[str, int] = Field(default_factory=dict)  # weapon -> deaths (killed by)


class WeaponPatterns(BaseModel):
    """Team's weapon usage patterns and preferences."""
    # Overall team weapon usage
    total_kills: int = 0
    weapon_kill_distribution: dict[str, int] = Field(default_factory=dict)  # weapon -> total kills
    weapon_kill_percentages: dict[str, float] = Field(default_factory=dict)  # weapon -> % of kills
    
    # Top weapons
    top_weapons: list[WeaponStats] = Field(default_factory=list)
    
    # Player weapon preferences
    player_weapon_stats: list[PlayerWeaponStats] = Field(default_factory=list)
    
    # Rifle preference (Vandal vs Phantom)
    vandal_kills: int = 0
    phantom_kills: int = 0
    rifle_preference: str = "balanced"  # "vandal", "phantom", or "balanced"
    
    # Economy weapons
    eco_weapon_kills: int = 0  # Sheriff, Marshal, etc.
    smg_kills: int = 0  # Spectre, Stinger
    shotgun_kills: int = 0  # Judge, Bucky
    sniper_kills: int = 0  # Operator, Marshal, Outlaw




class ExploitablePatterns(BaseModel):
    """Identified weaknesses and predictable behaviors."""
    # Predictable behaviors
    timing_tells: list[str] = Field(default_factory=list)
    rotation_patterns: list[str] = Field(default_factory=list)
    
    # Weaknesses
    weak_sites: dict[str, str] = Field(default_factory=dict)  # map -> site
    weak_against_agents: list[str] = Field(default_factory=list)
    
    # Tilt indicators
    after_losing_streak: str = ""
    under_pressure: str = ""
    
    # Recommendations
    counter_strategies: list[str] = Field(default_factory=list)
    
    # Tactical data for heatmaps
    player_tactics: list[PlayerTactics] = Field(default_factory=list)
    kill_heatmap: list[KillPosition] = Field(default_factory=list)
    map_bounds: dict[str, dict] = Field(default_factory=dict)  # map_name -> bounds


class ReportSection(BaseModel):
    """A section of the scouting report."""
    title: str
    content: str  # Markdown content
    data: Optional[dict] = None  # Structured data for visualizations
    priority: int = 0  # Higher = more important


class ScoutingReport(BaseModel):
    """Complete scouting report for a team."""
    id: str
    team_id: str
    team_name: str
    
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    matches_analyzed: int = 0  # Number of series/matches
    total_maps_played: int = 0  # Total individual maps/games
    tournament_name: Optional[str] = None  # Tournament filter if applied
    date_range: str = ""  # e.g., "Last 9 matches (20 maps)"
    
    # Executive summary (LLM-generated)
    executive_summary: str = ""
    
    # Detailed sections
    sections: list[ReportSection] = Field(default_factory=list)
    
    # Structured data for visualizations
    agent_tendencies: Optional[AgentTendencies] = None
    site_tendencies: dict[str, SiteTendencies] = Field(default_factory=dict)
    economy_patterns: Optional[EconomyPatterns] = None
    player_tendencies: dict[str, dict] = Field(default_factory=dict)
    exploitable_patterns: Optional[ExploitablePatterns] = None
    weapon_patterns: Optional[WeaponPatterns] = None

    # Key insights (bullet points)
    key_insights: list[str] = Field(default_factory=list)

    # Counter recommendations
    recommended_comps: list[dict] = Field(default_factory=list)
    ban_recommendations: list[str] = Field(default_factory=list)
    
    # AI-Powered Tactical Briefing
    tactical_briefing: Optional["TacticalBriefing"] = None


class MapStrategy(BaseModel):
    """Map-specific winning strategy."""
    map_name: str
    narrative: str  # Story-driven description of their playstyle on this map
    key_tendencies: list[str] = Field(default_factory=list)  # What they do on this map
    counter_strategies: list[str] = Field(default_factory=list)  # How to beat them
    agent_bans: list[str] = Field(default_factory=list)  # Agents to ban
    agent_picks: list[str] = Field(default_factory=list)  # Agents to pick
    site_priorities: dict[str, str] = Field(default_factory=dict)  # Which sites to focus/avoid
    timing_notes: str = ""  # When they execute, rotate, etc.
    win_condition: str = ""  # The key to winning on this map


class TacticalBriefing(BaseModel):
    """AI-generated comprehensive tactical briefing for match preparation."""
    team_name: str
    matches_analyzed: int
    tournament_context: str = ""
    
    # Overall narrative - tells the story of this team
    team_identity: str = ""  # What kind of team are they? Aggressive? Methodical? etc.
    playstyle_summary: str = ""  # Narrative description of their approach
    
    # Map-specific strategies (one per map they play)
    map_strategies: list[MapStrategy] = Field(default_factory=list)
    
    # Key players to watch
    star_players: list[dict] = Field(default_factory=list)  # {name, role, threat_level, counter}
    
    # Economic warfare
    economy_weakness: str = ""  # When/where to exploit their economy
    economy_strength: str = ""  # When they're strongest economically
    
    # The winning formula
    primary_win_condition: str = ""  # The #1 thing to do to win
    critical_actions: list[str] = Field(default_factory=list)  # Must-do actions
    
    # Quick reference
    quick_wins: list[str] = Field(default_factory=list)  # Easy wins/exploits


class ReportRequest(BaseModel):
    """Request model for generating a report."""
    team_id: str
    n_matches: int = 10
    maps: Optional[list[str]] = None
    include_player_analysis: bool = True
    include_economy_analysis: bool = True
