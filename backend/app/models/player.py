"""Player data models."""
from typing import Optional, Literal

from pydantic import BaseModel, Field


class PlayerStats(BaseModel):
    """Aggregated player statistics."""
    player_id: str
    nickname: str
    
    # Combat stats
    kills: int = 0
    deaths: int = 0
    assists: int = 0
    kd_ratio: float = 0.0
    
    # Performance metrics
    average_combat_score: float = 0.0
    average_damage_per_round: float = 0.0
    headshot_percentage: float = 0.0
    
    # Entry stats
    first_kills: int = 0
    first_deaths: int = 0
    first_kill_rate: float = 0.0
    
    # Clutch stats
    clutches_won: int = 0
    clutches_attempted: int = 0
    clutch_rate: float = 0.0
    
    # Economic
    average_loadout_value: float = 0.0
    
    # Agent pool
    agents_played: dict[str, int] = Field(default_factory=dict)
    primary_agent: Optional[str] = None


class PlayerTendencies(BaseModel):
    """Analyzed player behavioral patterns."""
    player_id: str
    nickname: str
    
    # Role classification
    primary_role: Literal["duelist", "controller", "initiator", "sentinel", "flex"]
    role_confidence: float = 0.0
    
    # Playstyle indicators
    aggression_score: float = 0.0  # 0-100, higher = more aggressive
    consistency_score: float = 0.0  # 0-100, higher = more consistent
    impact_rating: float = 0.0  # Custom impact metric
    
    # Specific tendencies
    prefers_entry: bool = False
    lurk_tendency: float = 0.0  # 0-100
    op_usage_rate: float = 0.0  # How often they use Operator
    
    # Patterns
    hot_maps: list[str] = Field(default_factory=list)  # Maps they perform well on
    cold_maps: list[str] = Field(default_factory=list)  # Maps they struggle on
    
    # Recent form
    recent_form: Literal["rising", "stable", "declining"] = "stable"
    form_trend: list[float] = Field(default_factory=list)  # Last N match ratings


class PlayerMatchPerformance(BaseModel):
    """Single match performance for a player."""
    match_id: str
    map_name: str
    agent: str
    
    kills: int
    deaths: int
    assists: int
    combat_score: int
    
    first_kills: int
    first_deaths: int
    clutches: int
    
    won: bool
