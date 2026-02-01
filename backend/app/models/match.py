"""Match and game data models."""
from datetime import datetime
from typing import Optional, Literal

from pydantic import BaseModel, Field


class PlayerRoundStats(BaseModel):
    """Player statistics for a single round."""
    player_id: str
    nickname: str
    agent: str
    
    kills: int = 0
    deaths: int = 0
    assists: int = 0
    damage: int = 0
    
    loadout_value: int = 0
    remaining_credits: int = 0
    spent_credits: int = 0
    
    ability_casts: dict[str, int] = Field(default_factory=dict)
    weapon: Optional[str] = None


class Round(BaseModel):
    """Single round data."""
    number: int
    winning_team_id: str
    winning_side: Literal["attack", "defense"]
    
    # How the round ended
    outcome: Literal["elimination", "spike_detonated", "spike_defused", "time_expired"]
    
    # Site information (for attack rounds)
    plant_site: Optional[Literal["A", "B", "C"]] = None
    
    # Economy
    team_economy: dict[str, int] = Field(default_factory=dict)  # team_id -> total loadout
    buy_type: dict[str, Literal["full", "half", "eco", "force", "pistol"]] = Field(default_factory=dict)
    
    # Player stats
    player_stats: list[PlayerRoundStats] = Field(default_factory=list)
    
    # First blood info
    first_blood_killer_id: Optional[str] = None
    first_blood_victim_id: Optional[str] = None
    
    # Round duration in seconds
    duration_seconds: Optional[float] = None


class GamePlayerStats(BaseModel):
    """Player statistics for a single game/map."""
    player_id: str
    player_name: str
    team_id: str
    agent: str
    kills: int = 0
    deaths: int = 0
    assists: int = 0


class GameState(BaseModel):
    """A single game/map within a match."""
    id: str
    map_name: str
    
    # Teams for this game
    team1_id: str
    team2_id: str
    
    # Score
    team1_score: int = 0
    team2_score: int = 0
    winner_id: Optional[str] = None
    
    # Side tracking
    team1_first_side: Literal["attack", "defense"]
    
    # All rounds
    rounds: list[Round] = Field(default_factory=list)
    
    # Duration
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    
    # Agent compositions
    team1_agents: list[str] = Field(default_factory=list)
    team2_agents: list[str] = Field(default_factory=list)
    
    # Per-game player stats
    player_stats: list[GamePlayerStats] = Field(default_factory=list)


class Match(BaseModel):
    """Complete match/series data."""
    id: str
    tournament_name: Optional[str] = None
    tournament_id: Optional[str] = None
    
    # Teams
    team1_id: str
    team1_name: str
    team2_id: str
    team2_name: str
    
    # Result
    team1_score: int = 0  # Maps won
    team2_score: int = 0
    winner_id: Optional[str] = None
    
    # Games/maps
    games: list[GameState] = Field(default_factory=list)
    
    # Timing
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    
    # Match format
    format: Literal["bo1", "bo3", "bo5"] = "bo3"


class MatchSummary(BaseModel):
    """Condensed match info for lists."""
    id: str
    opponent_name: str
    opponent_id: str
    result: Literal["win", "loss"]
    score: str  # e.g., "2-1"
    maps: list[str]
    date: datetime
    tournament: Optional[str] = None
