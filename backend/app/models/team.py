"""Team data models."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class Player(BaseModel):
    """Basic player information."""
    id: str
    nickname: str
    full_name: Optional[str] = None
    country: Optional[str] = None
    profile_image_url: Optional[str] = None


class Team(BaseModel):
    """Basic team information for search results."""
    id: str
    name: str
    short_name: Optional[str] = None
    region: Optional[str] = None
    logo_url: Optional[str] = None
    players: list[Player] = Field(default_factory=list)


class TeamDetails(Team):
    """Extended team information with statistics."""
    founded: Optional[datetime] = None
    game: str = "valorant"
    recent_results: list[dict] = Field(default_factory=list)
    win_rate: Optional[float] = None
    maps_played: list[str] = Field(default_factory=list)


class TeamSearchResponse(BaseModel):
    """Response model for team search."""
    teams: list[Team]
    query: str
    count: int = 0
    
    def __init__(self, **data):
        super().__init__(**data)
        self.count = len(self.teams)
