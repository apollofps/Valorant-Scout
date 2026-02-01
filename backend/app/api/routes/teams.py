"""Team search and lookup endpoints."""
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from loguru import logger

from app.models.team import Team, TeamSearchResponse, TeamDetails
from app.services.grid_client import GridClient

router = APIRouter()


@router.get("/tournaments")
async def get_tournaments():
    """
    Get list of available VCT tournaments with data.
    
    Returns tournaments that have match data available for analysis.
    """
    async with GridClient() as client:
        tournaments = await client.get_available_tournaments()
    
    return {"tournaments": tournaments}


@router.get("/search", response_model=TeamSearchResponse)
async def search_teams(
    q: str = Query(..., min_length=2, description="Team name to search for")
):
    """
    Search for VALORANT teams by name.
    
    Returns matching teams with basic info and current roster.
    """
    logger.info(f"Searching for teams matching: {q}")
    
    try:
        async with GridClient() as client:
            teams = await client.search_teams(q)
        
        logger.info(f"Found {len(teams)} teams matching '{q}'")
        return TeamSearchResponse(teams=teams, query=q)
    except Exception as e:
        logger.error(f"Error searching for teams: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to search teams: {str(e)}")


@router.get("/{team_id}", response_model=TeamDetails)
async def get_team(team_id: str):
    """
    Get detailed information about a specific team.
    
    Includes full roster, recent results, and statistics.
    """
    logger.info(f"Fetching team details for: {team_id}")
    
    async with GridClient() as client:
        team = await client.get_team_details(team_id)
    
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    return team


@router.get("/{team_id}/matches")
async def get_team_matches(
    team_id: str,
    limit: int = Query(default=10, ge=1, le=50, description="Number of matches to fetch"),
    tournament_id: Optional[str] = Query(default=None, description="Filter by tournament ID")
):
    """
    Get matches for a team, optionally filtered by tournament.
    
    Used to preview data before generating a full report.
    """
    tournament_info = f" in tournament {tournament_id}" if tournament_id else ""
    logger.info(f"Fetching {limit} matches for team: {team_id}{tournament_info}")
    
    async with GridClient() as client:
        matches = await client.get_team_matches(team_id, limit, tournament_id)
    
    return {"team_id": team_id, "matches": matches, "count": len(matches), "tournament_id": tournament_id}
