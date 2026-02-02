"""GRID Esports API client for fetching VALORANT match data."""
from typing import Optional
from datetime import datetime

import httpx
from loguru import logger
from tenacity import retry, retry_if_exception, stop_after_attempt, wait_exponential

from app.config import get_settings


class GridRateLimitError(Exception):
    """Raised when GRID API returns rate limit (ENHANCE_YOUR_CALM). Retry with long backoff."""
from app.models.team import Team, TeamDetails, Player
from app.models.match import Match, GameState, Round, GamePlayerStats

settings = get_settings()


class GridClient:
    """
    Async client for GRID's GraphQL APIs.
    
    GRID provides official esports data for VALORANT including:
    - Team and player information (Central Data API)
    - Match results and round-by-round data (Series State API)
    
    API Documentation: https://grid.helpjuice.com/en_US/cloud9-x-jetbrains-hackathon
    """
    
    # Central Data API for teams, players, series schedule
    CENTRAL_DATA_URL = settings.grid_api_url
    # Series State API for live/completed match data
    SERIES_STATE_URL = settings.grid_series_state_url
    
    # VALORANT title ID in GRID API
    VALORANT_TITLE_ID = "6"
    
    def __init__(self):
        self.headers = {
            "x-api-key": settings.grid_api_key,
            "Content-Type": "application/json",
        }
        self._client: Optional[httpx.AsyncClient] = None
    
    async def __aenter__(self):
        self._client = httpx.AsyncClient(
            headers=self.headers,
            timeout=30.0
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self._client:
            await self._client.aclose()
    
    @retry(
        retry=retry_if_exception(lambda e: isinstance(e, GridRateLimitError)),
        stop=stop_after_attempt(5),
        wait=wait_exponential(multiplier=15, min=30, max=120),
        reraise=True,
    )
    @retry(
        retry=retry_if_exception(lambda e: not isinstance(e, GridRateLimitError)),
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
    )
    async def _execute_query(self, query: str, variables: dict = None, use_series_state: bool = False) -> dict:
        """Execute a GraphQL query against GRID API. Rate limit (ENHANCE_YOUR_CALM) is retried with long backoff."""
        if not self._client:
            raise RuntimeError("Client not initialized. Use async with GridClient() as client:")
        
        payload = {"query": query}
        if variables:
            payload["variables"] = variables
        
        url = self.SERIES_STATE_URL if use_series_state else self.CENTRAL_DATA_URL
        try:
            response = await self._client.post(url, json=payload)
            response.raise_for_status()
            
            data = response.json()
            if "errors" in data:
                err = data["errors"][0]
                error_msg = err.get("message", "Unknown GraphQL error")
                ext = err.get("extensions") or {}
                is_rate_limit = (
                    "rate limit" in error_msg.lower()
                    or ext.get("errorDetail") == "ENHANCE_YOUR_CALM"
                )
                logger.error(f"GraphQL errors: {data['errors']}")
                if is_rate_limit:
                    logger.warning("GRID API rate limit hit; will retry with backoff.")
                    raise GridRateLimitError(f"GraphQL error: {error_msg}")
                raise Exception(f"GraphQL error: {error_msg}")
            
            return data.get("data", {})
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:
                logger.warning("GRID API 429 rate limit; will retry with backoff.")
                raise GridRateLimitError(f"API rate limit: {e.response.text}")
            logger.error(f"HTTP error {e.response.status_code}: {e.response.text}")
            raise Exception(f"API request failed: {e.response.status_code} - {e.response.text}")
        except GridRateLimitError:
            raise
        except Exception as e:
            logger.error(f"Error executing GraphQL query: {e}")
            raise
    
    async def search_teams(self, name: str, limit: int = 10) -> list[Team]:
        """
        Search for teams by name.
        
        Uses GRID's team search functionality with fuzzy matching.
        """
        query = """
        query SearchTeams($name: String!, $first: Int, $titleId: ID!) {
            teams(
                filter: { 
                    name: { contains: $name }
                    titleId: $titleId
                }
                first: $first
            ) {
                edges {
                    node {
                        id
                        name
                        nameShortened
                        logoUrl
                        colorPrimary
                        organization {
                            id
                            name
                        }
                    }
                }
            }
        }
        """
        
        variables = {"name": name, "first": limit, "titleId": self.VALORANT_TITLE_ID}
        
        data = await self._execute_query(query, variables)
        teams_data = data.get("teams", {}).get("edges", [])
        
        teams = []
        for edge in teams_data:
            node = edge["node"]
            # Get players for this team
            players = await self._get_team_roster(node["id"])
            
            teams.append(Team(
                id=node["id"],
                name=node["name"],
                short_name=node.get("nameShortened"),
                region=None,
                logo_url=node.get("logoUrl"),
                players=players
            ))
        
        return teams
    
    async def get_team_details(self, team_id: str) -> Optional[TeamDetails]:
        """Get detailed information about a specific team."""
        query = """
        query GetTeam($teamId: ID!) {
            team(id: $teamId) {
                id
                name
                nameShortened
                logoUrl
                colorPrimary
                organization {
                    id
                    name
                }
            }
        }
        """
        
        data = await self._execute_query(query, {"teamId": team_id})
        team_data = data.get("team")
        
        if not team_data:
            return None
        
        # Get players from API using teamIdFilter
        players = await self._get_team_roster(team_id)
        
        return TeamDetails(
            id=team_data["id"],
            name=team_data["name"],
            short_name=team_data.get("nameShortened"),
            region=None,
            logo_url=team_data.get("logoUrl"),
            players=players
        )
    
    async def _get_team_roster(self, team_id: str) -> list[Player]:
        """
        Get players for a specific team using the teamIdFilter.
        
        Based on GRID Hackathon docs:
        https://grid.helpjuice.com/en_US/cloud9-x-jetbrains-hackathon
        
        Note: imageUrl, fullName, nationality fields exist in schema but are
        restricted by API key permissions. Only id and nickname are accessible.
        """
        query = """
        query GetTeamRoster($teamId: ID!) {
            players(filter: {teamIdFilter: {id: $teamId}}) {
                edges {
                    node {
                        id
                        nickname
                        title {
                            name
                        }
                    }
                }
            }
        }
        """
        
        try:
            data = await self._execute_query(query, {"teamId": team_id})
            players_data = data.get("players", {}).get("edges", [])
            
            return [
                Player(
                    id=edge["node"]["id"],
                    nickname=edge["node"]["nickname"],
                )
                for edge in players_data
            ]
        except Exception as e:
            logger.warning(f"Failed to get team roster: {e}")
            return []
    
    # Available VCT Americas tournaments with data
    # Using name patterns for filtering since sub-tournament IDs vary
    VCT_TOURNAMENTS = [
        {"id": "kickoff-2024", "name": "VCT Americas - Kickoff 2024", "pattern": "Kickoff 2024"},
        {"id": "stage1-2024", "name": "VCT Americas - Stage 1 2024", "pattern": "Stage 1 2024"},
        {"id": "stage2-2024", "name": "VCT Americas - Stage 2 2024", "pattern": "Stage 2 2024"},
        {"id": "masters-madrid", "name": "Masters Madrid 2024", "pattern": "Masters Madrid"},
        {"id": "kickoff-2025", "name": "VCT Americas - Kickoff 2025", "pattern": "Kickoff 2025"},
        {"id": "stage1-2025", "name": "VCT Americas - Stage 1 2025", "pattern": "Stage 1 2025"},
        {"id": "stage2-2025", "name": "VCT Americas - Stage 2 2025", "pattern": "Stage 2 2025"},
    ]
    
    async def get_available_tournaments(self) -> list[dict]:
        """Get list of tournaments with available data."""
        # Return simplified list (without pattern for frontend)
        return [{"id": t["id"], "name": t["name"]} for t in self.VCT_TOURNAMENTS]
    
    def _get_tournament_pattern(self, tournament_id: str) -> Optional[str]:
        """Get the name pattern for a tournament ID."""
        for t in self.VCT_TOURNAMENTS:
            if t["id"] == tournament_id:
                return t["pattern"]
        return None
    
    async def get_team_matches(
        self, 
        team_id: str, 
        limit: int = 10,
        tournament_id: Optional[str] = None
    ) -> list[Match]:
        """
        Fetch VALORANT matches for a team with full results.
        
        Args:
            team_id: The team's ID
            limit: Maximum number of matches to return
            tournament_id: Optional tournament ID to filter matches
        
        Uses two APIs:
        1. Central Data API - Get series list and tournament info
        2. Series State API - Get actual scores and game details
        """
        # Step 1: Get series list from Central Data API
        # Always fetch without tournament filter - we'll filter by name pattern after
        query = """
        query GetTeamMatches($teamId: ID!, $first: Int) {
            allSeries(
                filter: {
                    teamId: $teamId
                    titleId: "6"
                }
                first: $first
            ) {
                edges {
                    node {
                        id
                        startTimeScheduled
                        format {
                            nameShortened
                        }
                        tournament {
                            id
                            name
                        }
                        teams {
                            baseInfo {
                                id
                                name
                            }
                        }
                    }
                }
            }
        }
        """
        # Always fetch max allowed (50) when filtering by tournament to ensure we find enough matches
        fetch_limit = 50 if tournament_id else min(50, limit * 2)
        variables = {"teamId": team_id, "first": fetch_limit}
        
        data = await self._execute_query(query, variables)
        series_data = data.get("allSeries", {}).get("edges", [])
        
        # If tournament_id is specified, get the pattern for filtering
        tournament_pattern = self._get_tournament_pattern(tournament_id) if tournament_id else None
        if tournament_pattern:
            logger.info(f"Filtering matches by tournament pattern: {tournament_pattern}")
        
        matches = []
        for edge in series_data:
            node = edge["node"]
            series_id = node.get("id")
            tournament_name = node.get("tournament", {}).get("name", "")
            
            # Filter by tournament pattern if specified
            if tournament_pattern and tournament_pattern not in tournament_name:
                continue
            
            # Step 2: Get actual match results from Series State API
            match = await self._get_series_state(series_id, node)
            if match:
                matches.append(match)
                # Stop if we have enough matches
                if len(matches) >= limit:
                    break
        
        logger.info(f"Found {len(matches)} matches for team {team_id}" + 
                   (f" in {tournament_pattern}" if tournament_pattern else ""))
        return matches
    
    async def _get_series_state(self, series_id: str, schedule_data: dict) -> Optional[Match]:
        """Get actual match results from Series State API with detailed data."""
        query = """
        query GetSeriesState($seriesId: ID!) {
            seriesState(id: $seriesId) {
                id
                started
                finished
                teams {
                    id
                    name
                    score
                    won
                    kills
                    deaths
                    players {
                        id
                        name
                        kills
                        deaths
                    }
                }
                games {
                    id
                    started
                    finished
                    map {
                        name
                    }
                    teams {
                        id
                        name
                        score
                        won
                        kills
                        deaths
                        players {
                            id
                            name
                            kills
                            deaths
                            character {
                                id
                                name
                            }
                        }
                    }
                    segments {
                        id
                        type
                        teams {
                            id
                            side
                            won
                        }
                    }
                }
            }
        }
        """
        
        try:
            data = await self._execute_query(query, {"seriesId": series_id}, use_series_state=True)
            state = data.get("seriesState")
            
            if not state:
                return self._parse_schedule_only(schedule_data)
            
            teams = state.get("teams", [])
            if len(teams) < 2:
                return self._parse_schedule_only(schedule_data)
            
            team1 = teams[0]
            team2 = teams[1]
            
            # Parse games with agents and rounds
            games = []
            for game in state.get("games", []):
                game_teams = game.get("teams", [])
                if len(game_teams) >= 2:
                    gt1 = game_teams[0]
                    gt2 = game_teams[1]
                    
                    # Extract agent compositions and player stats
                    team1_agents = []
                    team2_agents = []
                    game_player_stats = []
                    
                    for player in gt1.get("players", []):
                        char = player.get("character", {})
                        agent_name = "Unknown"
                        if char.get("name"):
                            agent_name = char["name"].capitalize()
                            if agent_name == "Kay/o":
                                agent_name = "KAY/O"
                            team1_agents.append(agent_name)
                        
                        game_player_stats.append(GamePlayerStats(
                            player_id=player.get("id", ""),
                            player_name=player.get("name", ""),
                            team_id=gt1.get("id", ""),
                            agent=agent_name,
                            kills=player.get("kills", 0),
                            deaths=player.get("deaths", 0)
                        ))
                    
                    for player in gt2.get("players", []):
                        char = player.get("character", {})
                        agent_name = "Unknown"
                        if char.get("name"):
                            agent_name = char["name"].capitalize()
                            if agent_name == "Kay/o":
                                agent_name = "KAY/O"
                            team2_agents.append(agent_name)
                        
                        game_player_stats.append(GamePlayerStats(
                            player_id=player.get("id", ""),
                            player_name=player.get("name", ""),
                            team_id=gt2.get("id", ""),
                            agent=agent_name,
                            kills=player.get("kills", 0),
                            deaths=player.get("deaths", 0)
                        ))
                    
                    # Parse rounds from segments
                    rounds = []
                    first_side = "attack"  # Default
                    for segment in game.get("segments", []):
                        if segment.get("type") == "round":
                            seg_teams = segment.get("teams", [])
                            if len(seg_teams) >= 2:
                                # Determine winning team and sides
                                winner_id = None
                                for st in seg_teams:
                                    if st.get("won"):
                                        winner_id = st.get("id")
                                    # Track first side for team1
                                    if st.get("id") == gt1.get("id") and segment.get("id") == "round-1":
                                        first_side = "attack" if st.get("side") == "attacker" else "defense"
                                
                                # Get round number from segment ID (e.g., "round-1" -> 1)
                                round_num = 1
                                try:
                                    round_num = int(segment.get("id", "round-1").split("-")[1])
                                except:
                                    pass
                                
                                winning_side = "attack"
                                for st in seg_teams:
                                    if st.get("won"):
                                        winning_side = "attack" if st.get("side") == "attacker" else "defense"
                                
                                rounds.append(Round(
                                    number=round_num,
                                    winning_team_id=winner_id or "",
                                    winning_side=winning_side,
                                    outcome="elimination"  # Default, actual outcome not in API
                                ))
                    
                    games.append(GameState(
                        id=game.get("id", ""),
                        map_name=game.get("map", {}).get("name", "Unknown").capitalize(),
                        team1_id=gt1.get("id", ""),
                        team2_id=gt2.get("id", ""),
                        team1_score=gt1.get("score", 0),
                        team2_score=gt2.get("score", 0),
                        winner_id=gt1.get("id") if gt1.get("won") else gt2.get("id") if gt2.get("won") else None,
                        team1_first_side=first_side,
                        rounds=rounds,
                        team1_agents=team1_agents,
                        team2_agents=team2_agents,
                        player_stats=game_player_stats
                    ))
            
            # Parse start time from schedule data
            started_at = None
            if schedule_data.get("startTimeScheduled"):
                try:
                    started_at = datetime.fromisoformat(schedule_data["startTimeScheduled"].replace("Z", "+00:00"))
                except:
                    pass
            
            # Format parsing
            format_name = schedule_data.get("format", {}).get("nameShortened", "BO3")
            format_map = {"BO1": "bo1", "BO3": "bo3", "BO5": "bo5"}
            match_format = format_map.get(format_name, "bo3")
            
            # Determine winner
            winner_id = None
            if team1.get("won"):
                winner_id = team1.get("id")
            elif team2.get("won"):
                winner_id = team2.get("id")
            
            return Match(
                id=series_id,
                tournament_name=schedule_data.get("tournament", {}).get("name"),
                tournament_id=schedule_data.get("tournament", {}).get("id"),
                team1_id=team1.get("id", ""),
                team1_name=team1.get("name", ""),
                team2_id=team2.get("id", ""),
                team2_name=team2.get("name", ""),
                team1_score=team1.get("score", 0),
                team2_score=team2.get("score", 0),
                winner_id=winner_id,
                games=games,
                started_at=started_at,
                ended_at=None,
                format=match_format
            )
        except Exception as e:
            logger.warning(f"Failed to get series state for {series_id}: {e}")
            return self._parse_schedule_only(schedule_data)
    
    def _parse_schedule_only(self, node: dict) -> Optional[Match]:
        """Parse match from schedule data only (no scores)."""
        teams = node.get("teams", [])
        if len(teams) < 2:
            return None
        
        team1 = teams[0].get("baseInfo", {})
        team2 = teams[1].get("baseInfo", {})
        
        format_name = node.get("format", {}).get("nameShortened", "BO3")
        format_map = {"BO1": "bo1", "BO3": "bo3", "BO5": "bo5"}
        match_format = format_map.get(format_name, "bo3")
        
        started_at = None
        if node.get("startTimeScheduled"):
            try:
                started_at = datetime.fromisoformat(node["startTimeScheduled"].replace("Z", "+00:00"))
            except:
                pass
        
        return Match(
            id=node.get("id", ""),
            tournament_name=node.get("tournament", {}).get("name"),
            tournament_id=node.get("tournament", {}).get("id"),
            team1_id=team1.get("id", ""),
            team1_name=team1.get("name", ""),
            team2_id=team2.get("id", ""),
            team2_name=team2.get("name", ""),
            team1_score=0,
            team2_score=0,
            winner_id=None,
            games=[],
            started_at=started_at,
            ended_at=None,
            format=match_format
        )
    
    # ==================== FILE DOWNLOAD API ====================
    # Different base URL: https://api.grid.gg
    # Provides detailed event data including plant sites, execute timings, etc.
    
    async def get_series_events(self, series_id: str) -> Optional[list[dict]]:
        """
        Download and parse events data for a series using the File Download API.
        
        Returns a list of event dictionaries with detailed round-by-round data
        including plant events, kill events, ability usage, etc.
        
        File Download API uses different base URL: https://api.grid.gg
        """
        import io
        import zipfile
        import json
        
        if not self._client:
            raise RuntimeError("Client not initialized. Use async with.")
        
        file_download_url = settings.grid_file_download_url
        
        try:
            # Step 1: List available files for the series
            list_url = f"{file_download_url}/file-download/list/{series_id}"
            response = await self._client.get(list_url)
            
            if response.status_code != 200:
                if response.status_code == 403:
                    logger.debug(f"File download not available for series {series_id} (403 Forbidden - files may not exist for this series)")
                else:
                    logger.warning(f"File download list failed for {series_id}: {response.status_code}")
                return None
            
            files_data = response.json()
            files = files_data.get("files", [])
            
            # Find the events file (can be "events-grid" or "events-grid-compressed")
            events_file = None
            for f in files:
                file_id = f.get("id", "")
                if file_id.startswith("events-grid") and f.get("status") == "ready":
                    events_file = f
                    break
            
            if not events_file:
                logger.info(f"No events file available for series {series_id}")
                return None
            
            # Step 2: Download the events file (it's a .jsonl.zip)
            # Need to create a new client with follow_redirects=True for the download
            download_url = events_file.get("fullURL")
            if not download_url:
                return None
            
            logger.info(f"Downloading events for series {series_id}")
            
            async with httpx.AsyncClient(
                headers=self.headers, 
                timeout=60.0, 
                follow_redirects=True
            ) as download_client:
                response = await download_client.get(download_url)
                
                if response.status_code != 200 or len(response.content) < 100:
                    logger.warning(f"Events download failed: {response.status_code}")
                    return None
                
                # Step 3: Unzip and parse JSONL
                events = []
                zip_data = io.BytesIO(response.content)
                
                with zipfile.ZipFile(zip_data, 'r') as zf:
                    for filename in zf.namelist():
                        if filename.endswith('.jsonl'):
                            with zf.open(filename) as jsonl_file:
                                for line in jsonl_file:
                                    try:
                                        event = json.loads(line.decode('utf-8'))
                                        events.append(event)
                                    except json.JSONDecodeError:
                                        continue
                
                logger.info(f"Parsed {len(events)} event batches for series {series_id}")
                return events
            
        except Exception as e:
            logger.error(f"Failed to get series events for {series_id}: {e}")
            return None
    
    def parse_site_tendencies_from_events(
        self, 
        events: list[dict], 
        team_id: str
    ) -> dict:
        """
        Parse events data to extract tactical tendencies.
        
        GRID events structure: Each item in `events` is a batch containing
        an `events` array with individual events.
        
        Event types we care about:
        - game-started-round: Contains map name AND team sides
        - player-completed-plantBomb: Bomb plant events
        - team-won-round: Round outcome with winType
        - player-killed-player: Kill events
        - player-used-ability: Ability usage
        
        Returns dict with:
        - round_outcomes: {map_name: {attack_wins, defense_wins, plants, defuses}}
        - kill_events: count per map
        - ability_usage: count per map
        """
        from collections import defaultdict
        
        result = {
            "round_outcomes": defaultdict(lambda: {
                "attack_wins": 0, 
                "defense_wins": 0,
                "plants": 0,
                "defuses": 0,
                "eliminations": 0
            }),
            "kill_count": defaultdict(int),
            "ability_count": defaultdict(int),
            # Economy tracking per round
            "economy_rounds": [],
            # Tactical data for heatmaps
            "kill_positions": [],  # {map, x, y, killer, victim, is_first_blood}
            "first_bloods": defaultdict(int),  # player -> count
            "first_deaths": defaultdict(int),  # player -> count
            # Map bounds from GRID - for accurate heatmap calibration
            "map_bounds": {},  # {map_name: {minX, maxX, minY, maxY}}
            # Weapon data
            "weapon_kills": defaultdict(lambda: defaultdict(int)),  # {player: {weapon: count}}
            "weapon_deaths": defaultdict(lambda: defaultdict(int)),  # {player: {weapon: count}}
            "team_weapon_kills": defaultdict(int),  # {weapon: count} for the team
        }
        round_has_kill = set()  # Track rounds that already have a kill
        
        current_map = "Unknown"
        current_round = 1
        team_id_str = str(team_id)
        # Track team sides - updated each round from game-started-round
        team_sides = {}  # {team_id: "attacker" or "defender"}
        # Track team loadouts at round start
        team_loadouts = {}  # {team_id: loadout_value}
        for event_batch in events:
            for inner_event in event_batch.get("events", []):
                event_type = inner_event.get("type", "")
                
                # Track map, team sides, and economy from game-started-round
                if event_type == "game-started-round":
                    actor_state = inner_event.get("actor", {}).get("state", {})
                    map_info = actor_state.get("map", {})
                    map_name = map_info.get("name", "Unknown")
                    if map_name:
                        current_map = map_name.capitalize()
                    
                    # Get round number from segments (e.g., "round-1")
                    segments = actor_state.get("segments", [])
                    round_id = None
                    numeric_round_id = None
                    if segments:
                        last_segment_id = segments[-1].get("id", "")
                        if last_segment_id.startswith("round-"):
                            try:
                                current_round = int(last_segment_id.split("-")[1])
                                round_id = last_segment_id
                            except (ValueError, IndexError):
                                pass
                    
                    # Also try to get numeric round ID from round object (for matching with kill events)
                    round_obj = actor_state.get("round")
                    if round_obj and round_obj.get("id"):
                        numeric_round_id = round_obj.get("id")
                        # Use numeric ID as primary if available (matches kill events)
                        if numeric_round_id:
                            round_id = str(numeric_round_id)
                    
                    # Extract team sides and economy from teams array
                    teams = actor_state.get("teams", [])
                    team_loadouts = {}
                    
                    for team in teams:
                        tid = str(team.get("id"))
                        side = team.get("side", "").lower()
                        if tid and side:
                            team_sides[tid] = side
                        
                        # Get team loadout value
                        loadout = team.get("loadoutValue", 0)
                        if not loadout:
                            # Try to sum from players if not at team level
                            players = team.get("players", [])
                            loadout = sum(p.get("loadoutValue", 0) for p in players)
                        team_loadouts[tid] = loadout
                        
                
                # Track series-started-game for map name AND bounds
                elif event_type == "series-started-game":
                    # Get from target.state or seriesState.games
                    target = inner_event.get("target", {}).get("state", {})
                    map_info = target.get("map", {})
                    
                    # Also check seriesState for more complete map data
                    series_state = inner_event.get("seriesState", {})
                    games = series_state.get("games", [])
                    if games:
                        game = games[-1]
                        map_info = game.get("map", {}) or map_info
                    
                    map_name = map_info.get("name")
                    if map_name:
                        current_map = map_name.capitalize()
                        
                        # Extract map bounds for heatmap calibration
                        bounds = map_info.get("bounds", {})
                        if bounds:
                            min_bounds = bounds.get("min", {})
                            max_bounds = bounds.get("max", {})
                            result["map_bounds"][current_map.lower()] = {
                                "minX": min_bounds.get("x", 0),
                                "maxX": max_bounds.get("x", 0),
                                "minY": min_bounds.get("y", 0),
                                "maxY": max_bounds.get("y", 0),
                            }
                
                # Track bomb plants by our team
                elif event_type == "player-completed-plantBomb":
                    actor = inner_event.get("actor", {}).get("state", {})
                    planter_team = actor.get("teamId")
                    if str(planter_team) == team_id_str:
                        result["round_outcomes"][current_map]["plants"] += 1
                
                # Track round wins - use team_sides to determine our side
                elif event_type == "team-won-round":
                    actor = inner_event.get("actor", {})
                    winning_team_id = str(actor.get("id"))
                    actor_state = actor.get("state", {})
                    round_info = actor_state.get("round", {})
                    win_type = round_info.get("winType", "")
                    
                    # Record economy data for this round
                    our_loadout = team_loadouts.get(team_id_str, 0)
                    opponent_ids = [t for t in team_loadouts.keys() if t != team_id_str]
                    opponent_loadout = team_loadouts.get(opponent_ids[0], 0) if opponent_ids else 0
                    team_won = winning_team_id == team_id_str
                    
                    # Classify buy type based on loadout value
                    # VALORANT economy thresholds (team total):
                    # - Pistol: rounds 1, 13 (start of each half)
                    # - Eco/Save: < 10000 (pistols/SMGs only)
                    # - Force/Half-buy: 10000-22000 (some rifles but not full)
                    # - Full buy: > 22000 (rifles + full shields + abilities for 5 players)
                    if current_round in [1, 13]:
                        buy_type = "pistol"
                    elif our_loadout < 10000:
                        buy_type = "eco"
                    elif our_loadout < 22000:
                        buy_type = "force"
                    else:
                        buy_type = "full"
                    
                    result["economy_rounds"].append({
                        "round_num": current_round,
                        "map": current_map,
                        "team_loadout": our_loadout,
                        "opponent_loadout": opponent_loadout,
                        "won": team_won,
                        "buy_type": buy_type,
                    })
                    
                    if winning_team_id == team_id_str:
                        # We won - use tracked team_sides to know our side
                        our_side = team_sides.get(team_id_str, "").lower()
                        
                        if our_side in ["attacker", "attack"]:
                            result["round_outcomes"][current_map]["attack_wins"] += 1
                        elif our_side in ["defender", "defense"]:
                            result["round_outcomes"][current_map]["defense_wins"] += 1
                        
                        # Track win type
                        if win_type == "bombDefused":
                            result["round_outcomes"][current_map]["defuses"] += 1
                        elif win_type == "elimination":
                            result["round_outcomes"][current_map]["eliminations"] += 1
                
                # Track kills for aggression metrics and heatmaps
                elif event_type == "player-killed-player":
                    result["kill_count"][current_map] += 1
                    
                    # Extract killer/victim info
                    actor_state = inner_event.get("actor", {}).get("state", {})
                    target_state = inner_event.get("target", {}).get("state", {})
                    state_delta = inner_event.get("actor", {}).get("stateDelta", {})
                    killer = actor_state.get("name", "Unknown")
                    victim = target_state.get("name", "Unknown")
                    killer_team = str(actor_state.get("teamId", ""))
                    # Try multiple paths for round ID
                    round_id = None
                    if "round" in actor_state:
                        round_id = actor_state.get("round", {}).get("id")
                    elif "game" in actor_state:
                        round_id = actor_state.get("game", {}).get("round", {}).get("id")
                    
                    # Convert to string for matching (numeric IDs from kill events)
                    if round_id:
                        round_id = str(round_id)
                    else:
                        round_id = f"{current_map}-{current_round}"  # Fallback
                    
                    # Extract weapon from stateDelta.round.weaponKills
                    round_delta = state_delta.get("round", {})
                    weapon_kills_delta = round_delta.get("weaponKills", {})
                    weapon_used = None
                    if weapon_kills_delta:
                        # Get the weapon that was used for this kill
                        weapon_used = list(weapon_kills_delta.keys())[0]
                    
                    # Track weapon kills for the team
                    if killer_team == team_id_str and weapon_used:
                        result["weapon_kills"][killer][weapon_used] += 1
                        result["team_weapon_kills"][weapon_used] += 1
                    
                    # Track weapon deaths for players on our team
                    victim_team = str(target_state.get("teamId", ""))
                    if victim_team == team_id_str and weapon_used:
                        result["weapon_deaths"][victim][weapon_used] += 1
                    
                    # Check if first blood of round
                    is_first_blood = round_id not in round_has_kill
                    if is_first_blood:
                        round_has_kill.add(round_id)
                        result["first_bloods"][killer] += 1
                        result["first_deaths"][victim] += 1
                    
                    # Try multiple sources for killer position
                    pos = None
                    
                    # Method 1: Direct from actor state
                    pos = actor_state.get("position")
                    
                    # Method 2: From seriesState.games if Method 1 failed
                    if not pos:
                        series_state = inner_event.get("seriesState", {})
                        games = series_state.get("games", [])
                        if games:
                            for team in games[-1].get("teams", []):
                                for player in team.get("players", []):
                                    if player.get("name") == killer:
                                        pos = player.get("position")
                                        break
                                if pos:
                                    break
                    
                    # Method 3: From target state (victim position as fallback)
                    if not pos:
                        pos = target_state.get("position")
                    
                    # Add kill position if we found coordinates
                    if pos and (pos.get("x") is not None or pos.get("y") is not None):
                        result["kill_positions"].append({
                            "map": current_map,
                            "x": pos.get("x", 0),
                            "y": pos.get("y", 0),
                            "killer": killer,
                            "victim": victim,
                            "is_first_blood": is_first_blood,
                            "weapon": weapon_used
                        })
                    
                
                # Track ability usage and aggregate positions
                if event_type == "player-used-ability":
                    result["ability_count"][current_map] += 1
                    
                    # Aggregate positions from seriesState
                    actor = inner_event.get("actor", {})
                    if actor:
                        actor_state = actor.get("state", {})
                        actor_team_id = str(actor_state.get("teamId", ""))
                        actor_game = actor_state.get("game", {})
                        round_id = actor_game.get("round", {}).get("id") if actor_game else None
                        
                
        
        # Log kill position stats per map for debugging
        kills_per_map = {}
        for kp in result["kill_positions"]:
            map_name = kp.get("map", "Unknown")
            kills_per_map[map_name] = kills_per_map.get(map_name, 0) + 1
        logger.info(f"Kill positions per map: {kills_per_map}")
        logger.info(f"Total kill positions: {len(result['kill_positions'])}")
        logger.info(f"Maps with bounds: {list(result['map_bounds'].keys())}")
        
        
        # Convert defaultdicts to regular dicts
        return {
            "round_outcomes": {k: dict(v) for k, v in result["round_outcomes"].items()},
            "kill_count": dict(result["kill_count"]),
            "ability_count": dict(result["ability_count"]),
            "economy_rounds": result["economy_rounds"],
            # Tactical data
            "kill_positions": result["kill_positions"],
            "first_bloods": dict(result["first_bloods"]),
            "first_deaths": dict(result["first_deaths"]),
            "map_bounds": result["map_bounds"],
            # Weapon data
            "weapon_kills": {k: dict(v) for k, v in result["weapon_kills"].items()},
            "weapon_deaths": {k: dict(v) for k, v in result["weapon_deaths"].items()},
            "team_weapon_kills": dict(result["team_weapon_kills"]),
        }
    
    async def get_detailed_match_data(self, series_id: str, team_id: str) -> Optional[dict]:
        """
        Get detailed match data including site tendencies from File Download API.
        
        This provides the granular data needed for:
        - Site attack distribution (A/B/C)
        - Execute timing patterns
        - Round-by-round analysis
        """
        events = await self.get_series_events(series_id)
        if not events:
            return None
        
        return self.parse_site_tendencies_from_events(events, team_id)
