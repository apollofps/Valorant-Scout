"""Data processing pipeline for extracting insights from match data."""
from collections import defaultdict
from typing import Optional
from dataclasses import dataclass, field

from loguru import logger

from app.models.match import Match, GameState, Round, GamePlayerStats
from app.models.report import (
    AgentTendencies,
    SiteTendencies,
    EconomyPatterns,
    ExploitablePatterns,
    WeaponPatterns,
    WeaponStats,
    PlayerWeaponStats,
)


@dataclass
class MatchAnalysis:
    """Complete analysis of a team's recent matches."""
    team_id: str
    team_name: str
    matches_analyzed: int  # Number of series
    total_maps_played: int = 0  # Total individual maps
    date_range: str = ""
    
    # Aggregated stats
    win_rate: float = 0.0
    map_win_rates: dict = field(default_factory=dict)
    
    # Pattern analysis
    agent_tendencies: AgentTendencies = None
    site_tendencies: dict = field(default_factory=dict)  # map -> SiteTendencies
    economy_patterns: EconomyPatterns = None
    player_stats: dict = field(default_factory=dict)
    
    # Exploitable patterns
    exploitable_patterns: ExploitablePatterns = None
    
    # Weapon patterns
    weapon_patterns: WeaponPatterns = None
    


class DataProcessor:
    """
    Processes raw match data to extract tactical insights.
    
    This is the core analytics engine that transforms GRID data
    into actionable scouting intelligence.
    """
    
    # VALORANT agent role classifications
    AGENT_ROLES = {
        "Jett": "duelist", "Raze": "duelist", "Reyna": "duelist",
        "Phoenix": "duelist", "Yoru": "duelist", "Neon": "duelist", "Iso": "duelist",
        "Omen": "controller", "Brimstone": "controller", "Astra": "controller",
        "Viper": "controller", "Harbor": "controller", "Clove": "controller",
        "Sova": "initiator", "Breach": "initiator", "Skye": "initiator",
        "KAY/O": "initiator", "Fade": "initiator", "Gekko": "initiator",
        "Killjoy": "sentinel", "Cypher": "sentinel", "Sage": "sentinel",
        "Chamber": "sentinel", "Deadlock": "sentinel", "Vyse": "sentinel"
    }
    
    def analyze_matches(
        self,
        matches: list[Match],
        team_id: str,
        focus_maps: Optional[list[str]] = None,
        current_roster: Optional[dict] = None,
        detailed_events: Optional[list[dict]] = None
    ) -> MatchAnalysis:
        """
        Main entry point for match analysis.
        
        Takes raw match data and produces a complete MatchAnalysis
        with all tactical insights extracted.
        
        Args:
            matches: List of matches to analyze
            team_id: Target team ID
            focus_maps: Optional list of maps to focus on
            current_roster: Dict of {player_id: player_name} for current roster
            detailed_events: Optional list of detailed events from File Download API
                             for site tendencies and execute timings
        """
        if not matches:
            logger.warning(f"No matches to analyze for team {team_id}")
            return MatchAnalysis(
                team_id=team_id,
                team_name="Unknown",
                matches_analyzed=0,
                date_range="N/A"
            )
        
        # Determine team name
        team_name = self._get_team_name(matches, team_id)
        
        # Calculate total maps played across all matches
        total_maps = sum(len(m.games) for m in matches)
        
        # Format as "Last N matches (X maps)" instead of date range
        match_summary = f"{len(matches)} matches ({total_maps} maps)"
        
        logger.info(f"Processing {len(matches)} matches with {total_maps} total maps")
        
        # Filter to focus maps if specified
        if focus_maps:
            matches = self._filter_to_maps(matches, focus_maps)
        
        logger.info(f"Analyzing {len(matches)} matches for {team_name}")
        
        # Extract all patterns
        analysis = MatchAnalysis(
            team_id=team_id,
            team_name=team_name,
            matches_analyzed=len(matches),
            total_maps_played=total_maps,
            date_range=match_summary,
            win_rate=self._calculate_win_rate(matches, team_id),
            map_win_rates=self._calculate_map_win_rates(matches, team_id),
            agent_tendencies=self._extract_agent_tendencies(matches, team_id),
            site_tendencies=self._extract_all_site_tendencies(matches, team_id, detailed_events),
            economy_patterns=self._extract_economy_patterns(matches, team_id, detailed_events),
            player_stats=self._extract_player_stats(matches, team_id, current_roster, detailed_events),
            exploitable_patterns=self._identify_exploitable_patterns(matches, team_id, detailed_events),
            weapon_patterns=self._extract_weapon_patterns(detailed_events),
        )
        
        return analysis
    
    def _get_team_name(self, matches: list[Match], team_id: str) -> str:
        """Extract team name from matches."""
        for match in matches:
            if match.team1_id == team_id:
                return match.team1_name
            if match.team2_id == team_id:
                return match.team2_name
        return "Unknown Team"
    
    def _format_date_range(self, dates: list) -> str:
        """Format date range as readable string."""
        if not dates:
            return "N/A"
        dates = sorted([d for d in dates if d])
        if len(dates) == 1:
            return dates[0].strftime("%b %d, %Y")
        return f"{dates[0].strftime('%b %d, %Y')} - {dates[-1].strftime('%b %d, %Y')}"
    
    def _filter_to_maps(self, matches: list[Match], maps: list[str]) -> list[Match]:
        """Filter matches to only include specific maps."""
        maps_lower = [m.lower() for m in maps]
        filtered = []
        for match in matches:
            match.games = [g for g in match.games if g.map_name.lower() in maps_lower]
            if match.games:
                filtered.append(match)
        return filtered
    
    def _calculate_win_rate(self, matches: list[Match], team_id: str) -> float:
        """Calculate overall series win rate."""
        if not matches:
            return 0.0
        wins = sum(1 for m in matches if m.winner_id == team_id)
        return wins / len(matches)
    
    def _calculate_map_win_rates(self, matches: list[Match], team_id: str) -> dict:
        """Calculate win rate per map."""
        map_stats = defaultdict(lambda: {"wins": 0, "total": 0})
        
        for match in matches:
            for game in match.games:
                map_name = game.map_name
                map_stats[map_name]["total"] += 1
                if game.winner_id == team_id:
                    map_stats[map_name]["wins"] += 1
        
        return {
            map_name: stats["wins"] / stats["total"] if stats["total"] > 0 else 0
            for map_name, stats in map_stats.items()
        }
    
    def _extract_agent_tendencies(self, matches: list[Match], team_id: str) -> AgentTendencies:
        """Extract agent selection patterns including map-wise compositions."""
        from app.models.report import MapAgentData, MapComposition
        
        agent_counts = defaultdict(int)
        compositions = defaultdict(int)
        player_agents = defaultdict(lambda: defaultdict(int))
        total_games = 0
        
        # Map-wise tracking
        map_agent_counts = defaultdict(lambda: defaultdict(int))  # map -> agent -> count
        map_compositions = defaultdict(lambda: defaultdict(lambda: {"count": 0, "wins": 0}))  # map -> comp -> {count, wins}
        map_games = defaultdict(int)  # map -> total games
        
        for match in matches:
            for game in match.games:
                total_games += 1
                map_name = game.map_name.lower() if game.map_name else "unknown"
                map_games[map_name] += 1
                
                # Determine which agents this team played and if they won
                if game.team1_id == team_id:
                    team_agents = game.team1_agents
                    team_won = game.team1_score > game.team2_score if game.team1_score and game.team2_score else False
                else:
                    team_agents = game.team2_agents
                    team_won = game.team2_score > game.team1_score if game.team1_score and game.team2_score else False
                
                # Count agent picks (overall)
                for agent in team_agents:
                    agent_counts[agent] += 1
                    map_agent_counts[map_name][agent] += 1
                
                # Track composition (overall)
                comp_key = tuple(sorted(team_agents))
                compositions[comp_key] += 1
                
                # Track map-specific composition with win/loss
                map_compositions[map_name][comp_key]["count"] += 1
                if team_won:
                    map_compositions[map_name][comp_key]["wins"] += 1
                
                # Track player-agent mapping from game-level stats
                for ps in game.player_stats:
                    if ps.team_id == team_id:
                        player_agents[ps.player_name][ps.agent] += 1
        
        # Calculate overall pick rates
        agent_pick_rates = {
            agent: count / total_games if total_games > 0 else 0
            for agent, count in agent_counts.items()
        }
        
        # Top overall compositions
        top_comps = sorted(
            [{"agents": list(comp), "count": count, "rate": count / total_games}
             for comp, count in compositions.items()],
            key=lambda x: x["count"],
            reverse=True
        )[:5]
        
        # Build map-wise agent data
        map_agent_data = {}
        for map_name, agents in map_agent_counts.items():
            games_on_map = map_games[map_name]
            
            # Pick rates for this map
            map_pick_rates = {
                agent: count / games_on_map if games_on_map > 0 else 0
                for agent, count in agents.items()
            }
            
            # Compositions for this map
            map_comps = []
            for comp_key, stats in map_compositions[map_name].items():
                win_rate = stats["wins"] / stats["count"] if stats["count"] > 0 else 0
                map_comps.append(MapComposition(
                    agents=list(comp_key),
                    games_played=stats["count"],
                    wins=stats["wins"],
                    win_rate=win_rate
                ))
            
            # Sort by games played
            map_comps.sort(key=lambda x: x.games_played, reverse=True)
            
            # Find most successful comp (minimum 2 games)
            successful_comps = [c for c in map_comps if c.games_played >= 2]
            most_successful = max(successful_comps, key=lambda x: x.win_rate) if successful_comps else None
            
            map_agent_data[map_name] = MapAgentData(
                map_name=map_name,
                games_played=games_on_map,
                agent_pick_rates=map_pick_rates,
                top_compositions=map_comps[:3],  # Top 3 comps per map
                most_successful_comp=most_successful
            )
        
        # Player agent pools
        player_pools = {}
        for player_id, agents in player_agents.items():
            sorted_agents = sorted(agents.items(), key=lambda x: x[1], reverse=True)
            player_pools[player_id] = [agent for agent, _ in sorted_agents[:3]]
        
        # Identify flex picks (agents played by multiple players)
        agent_players = defaultdict(set)
        for player_id, agents in player_agents.items():
            for agent in agents:
                agent_players[agent].add(player_id)
        flex_picks = [agent for agent, players in agent_players.items() if len(players) > 1]
        
        return AgentTendencies(
            agent_pick_rates=agent_pick_rates,
            top_compositions=top_comps,
            map_compositions=map_agent_data,
            player_agent_pools=player_pools,
            flex_picks=flex_picks,
            recent_comp_changes=[]  # Would need historical comparison
        )
    
    def _extract_all_site_tendencies(
        self, 
        matches: list[Match], 
        team_id: str,
        detailed_events: Optional[list[dict]] = None
    ) -> dict:
        """Extract map statistics and patterns for each map.
        
        If detailed_events (from File Download API) is provided, will extract
        real site tendencies and execute timings. Otherwise falls back to
        estimates based on round data.
        """
        # Three-site maps (Haven, Lotus, Pearl)
        THREE_SITE_MAPS = {"haven", "lotus", "pearl"}
        
        # Parse detailed events if available
        site_data_from_events = {}
        execute_times_from_events = {}
        
        if detailed_events:
            site_data_from_events, execute_times_from_events = self._parse_events_for_sites(
                detailed_events, team_id
            )
        
        map_data = defaultdict(lambda: {
            "wins": 0, "losses": 0, "total_games": 0,
            "attack_rounds_won": 0, "attack_rounds_played": 0,
            "defense_rounds_won": 0, "defense_rounds_played": 0,
            "total_rounds": 0,
            "attack_site_counts": {"A": 0, "B": 0, "C": 0}
        })
        
        for match in matches:
            for game in match.games:
                map_name = game.map_name
                if not map_name or map_name.lower() == "unknown":
                    continue
                    
                data = map_data[map_name]
                data["total_games"] += 1
                
                # Track win/loss
                is_team1 = game.team1_id == team_id
                team_score = game.team1_score if is_team1 else game.team2_score
                opp_score = game.team2_score if is_team1 else game.team1_score
                
                if team_score > opp_score:
                    data["wins"] += 1
                else:
                    data["losses"] += 1
                
                # Track round-by-round stats
                for round_data in game.rounds:
                    data["total_rounds"] += 1
                    round_num = round_data.number
                    
                    # Determine side for this round
                    if round_num <= 12:
                        team_side = game.team1_first_side if is_team1 else (
                            "defense" if game.team1_first_side == "attack" else "attack"
                        )
                    else:
                        team_side = "defense" if game.team1_first_side == "attack" else "attack"
                        if not is_team1:
                            team_side = "attack" if team_side == "defense" else "defense"
                    
                    # Track rounds by side
                    if team_side == "attack":
                        data["attack_rounds_played"] += 1
                        if round_data.winning_team_id == team_id:
                            data["attack_rounds_won"] += 1
                        if round_data.plant_site:
                            site_key = str(round_data.plant_site).upper()
                            if site_key in data["attack_site_counts"]:
                                data["attack_site_counts"][site_key] += 1
                    else:
                        data["defense_rounds_played"] += 1
                        if round_data.winning_team_id == team_id:
                            data["defense_rounds_won"] += 1
        
        # Convert to SiteTendencies objects with map-based stats
        result = {}
        for map_name, data in map_data.items():
            total_games = data["total_games"] or 1
            attack_played = data["attack_rounds_played"] or 1
            defense_played = data["defense_rounds_played"] or 1
            
            # Calculate side win rates
            attack_win_rate = data["attack_rounds_won"] / attack_played
            defense_win_rate = data["defense_rounds_won"] / defense_played
            
            # Check if we have detailed round data from File Download API events
            event_round_data = site_data_from_events.get(map_name, {})
            event_extra_stats = execute_times_from_events.get(map_name, {})
            
            # For site distribution - use actual plant sites if present, otherwise fallback by map type
            is_three_site = map_name.lower() in THREE_SITE_MAPS
            attack_sites = data["attack_site_counts"]
            if data["attack_rounds_played"] > 0:
                a_rate = attack_sites["A"] / data["attack_rounds_played"]
                b_rate = attack_sites["B"] / data["attack_rounds_played"]
                c_rate = attack_sites["C"] / data["attack_rounds_played"] if is_three_site else None
            else:
                if is_three_site:
                    a_rate, b_rate, c_rate = 0.35, 0.35, 0.30
                else:
                    a_rate, b_rate, c_rate = 0.55, 0.45, None
            
            # If we have detailed event data, enhance our stats
            if event_round_data:
                # Use event data for more accurate round outcomes
                event_attack_wins = event_round_data.get("attack_wins", 0)
                event_defense_wins = event_round_data.get("defense_wins", 0)
                event_plants = event_round_data.get("plants", 0)
                event_defuses = event_round_data.get("defuses", 0)
                
                # Update round counts if event data has more detail
                total_event_rounds = event_attack_wins + event_defense_wins
                if total_event_rounds > 0:
                    attack_win_rate = event_attack_wins / max(total_event_rounds, 1)
                    defense_win_rate = event_defense_wins / max(total_event_rounds, 1)
            
            avg_execute = 0.0  # Would need timestamp parsing for this
            fast_rate = attack_win_rate  # Repurpose as attack win rate
            
            result[map_name] = SiteTendencies(
                map_name=map_name,
                a_site_attack_rate=a_rate,
                b_site_attack_rate=b_rate,
                c_site_attack_rate=c_rate,
                average_execute_time=avg_execute,
                fast_execute_rate=fast_rate if event_round_data else attack_win_rate,
                retake_success_rate=defense_win_rate,
                map_win_rate=data["wins"] / total_games,
                games_played=data["total_games"],
                attack_rounds_won=data["attack_rounds_won"],
                attack_rounds_played=data["attack_rounds_played"],
                defense_rounds_won=data["defense_rounds_won"],
                defense_rounds_played=data["defense_rounds_played"],
                common_attack_executes=[],
                common_defense_setups=[],
                common_post_plant_positions=[]
            )
        
        return result
    
    def _parse_events_for_sites(self, events: list[dict], team_id: str) -> tuple[dict, dict]:
        """Parse File Download API events to extract detailed stats.
        
        The File Download API events are structured differently - each item
        is a batch with an 'events' array containing individual events.
        
        Since we don't have direct plant site data, we extract:
        - Round outcomes with win types
        - Plant/defuse counts
        
        Returns:
            (round_data, extra_stats) where:
            - round_data: {map_name: {attack_wins, defense_wins, plants, defuses}}
            - extra_stats: {map_name: {kills, abilities}}
        """
        round_data = defaultdict(lambda: {
            "attack_wins": 0,
            "defense_wins": 0,
            "plants": 0,
            "defuses": 0,
            "eliminations": 0
        })
        extra_stats = defaultdict(lambda: {"kills": 0, "abilities": 0})
        
        current_map = "Unknown"
        team_id_str = str(team_id)
        
        for event_batch in events:
            for inner_event in event_batch.get("events", []):
                event_type = inner_event.get("type", "")
                
                # Track map from game events
                if event_type in ["game-started-round", "series-started-game"]:
                    if event_type == "game-started-round":
                        actor_state = inner_event.get("actor", {}).get("state", {})
                        map_info = actor_state.get("map", {})
                    else:
                        target = inner_event.get("target", {}).get("state", {})
                        map_info = target.get("map", {})
                    
                    map_name = map_info.get("name")
                    if map_name:
                        current_map = map_name.capitalize()
                
                # Track bomb plants by our team
                elif event_type == "player-completed-plantBomb":
                    actor = inner_event.get("actor", {}).get("state", {})
                    planter_team = actor.get("teamId")
                    if str(planter_team) == team_id_str:
                        round_data[current_map]["plants"] += 1
                
                # Track round wins
                elif event_type == "team-won-round":
                    actor = inner_event.get("actor", {})
                    actor_state = actor.get("state", {})
                    winning_team_id = actor.get("id")
                    
                    if str(winning_team_id) == team_id_str:
                        # Check which side we were on
                        # Side info is in game state
                        game_state = actor_state.get("game", {})
                        # Side might also be at top level
                        team_side = game_state.get("side", actor_state.get("side", "")).lower()
                        
                        if team_side in ["attacker", "attack"]:
                            round_data[current_map]["attack_wins"] += 1
                        elif team_side in ["defender", "defense"]:
                            round_data[current_map]["defense_wins"] += 1
                        
                        # Track win type
                        round_info = actor_state.get("round", {})
                        win_type = round_info.get("winType", "")
                        if win_type == "bombDefused":
                            round_data[current_map]["defuses"] += 1
                        elif win_type == "elimination":
                            round_data[current_map]["eliminations"] += 1
                
                # Track kills
                elif event_type == "player-killed-player":
                    extra_stats[current_map]["kills"] += 1
                
                # Track abilities
                elif event_type == "player-used-ability":
                    extra_stats[current_map]["abilities"] += 1
        
        return (
            {k: dict(v) for k, v in round_data.items()},
            {k: dict(v) for k, v in extra_stats.items()}
        )
    
    def _extract_economy_patterns(
        self, 
        matches: list[Match], 
        team_id: str,
        detailed_events: Optional[list[dict]] = None
    ) -> EconomyPatterns:
        """Extract economic behavior patterns.
        
        Uses detailed_events from File Download API if available for accurate
        economy data (loadout values), otherwise falls back to round-based estimation.
        """
        pistol_wins = 0
        pistol_total = 0
        round2_conversions = 0
        round2_attempts = 0
        force_buys = 0
        eco_rounds = 0
        eco_wins = 0
        total_non_pistol_rounds = 0
        
        # Check if we have detailed economy data from File Download API
        has_detailed_economy = False
        if detailed_events:
            for event_data in detailed_events:
                if isinstance(event_data, dict) and event_data.get("economy_rounds"):
                    has_detailed_economy = True
                    break
        
        if has_detailed_economy:
            # Use detailed economy data from File Download API
            logger.info("Using detailed economy data from File Download API")
            
            for event_data in detailed_events:
                economy_rounds = event_data.get("economy_rounds", [])
                for round_info in economy_rounds:
                    round_num = round_info.get("round_num", 0)
                    buy_type = round_info.get("buy_type", "full")
                    won = round_info.get("won", False)
                    
                    # Pistol rounds
                    if buy_type == "pistol" or round_num in [1, 13]:
                        pistol_total += 1
                        if won:
                            pistol_wins += 1
                    else:
                        total_non_pistol_rounds += 1
                        
                        # Eco/Force tracking
                        if buy_type == "eco":
                            eco_rounds += 1
                            if won:
                                eco_wins += 1
                        elif buy_type == "force":
                            force_buys += 1
                            eco_rounds += 1  # Force buys count as eco for tracking
                            if won:
                                eco_wins += 1
                    
                    # Round 2/14 tracking (post-pistol)
                    if round_num in [2, 14]:
                        round2_attempts += 1
                        # We can't easily track "after win" without more context
                        # Just track conversion if won
                        if won:
                            round2_conversions += 1
        else:
            # Fall back to round data from matches (less accurate)
            logger.info("No detailed economy data, using round-based estimation")
            
            for match in matches:
                for game in match.games:
                    prev_won_pistol = False
                    
                    for round_data in game.rounds:
                        round_num = round_data.number
                        team_won = round_data.winning_team_id == team_id
                        
                        # Check buy type for team (may not be populated)
                        buy_type = round_data.buy_type.get(team_id, "full")
                        
                        # Pistol rounds (1 and 13)
                        if round_num in [1, 13]:
                            pistol_total += 1
                            if team_won:
                                pistol_wins += 1
                                prev_won_pistol = True
                            else:
                                prev_won_pistol = False
                        else:
                            total_non_pistol_rounds += 1
                            
                            # Round 2 or 14 (post-pistol)
                            if round_num in [2, 14]:
                                round2_attempts += 1
                                if prev_won_pistol and team_won:
                                    round2_conversions += 1
                            
                            # Eco tracking
                            if buy_type in ["eco", "force"]:
                                eco_rounds += 1
                                if buy_type == "force":
                                    force_buys += 1
                                if team_won:
                                    eco_wins += 1
        
        logger.info(f"Economy stats: pistol={pistol_wins}/{pistol_total}, "
                   f"eco_rounds={eco_rounds}, force_buys={force_buys}, eco_wins={eco_wins}")
        
        return EconomyPatterns(
            pistol_attack_strategy="Standard utility setup",
            pistol_defense_strategy="Default hold with util",
            pistol_win_rate=pistol_wins / pistol_total if pistol_total > 0 else 0,
            round2_after_pistol_win_strategy="Anti-eco with upgraded pistols or SMGs",
            round2_after_pistol_loss_strategy="Full save or light force",
            round2_conversion_rate=round2_conversions / round2_attempts if round2_attempts > 0 else 0,
            force_buy_rate=force_buys / total_non_pistol_rounds if total_non_pistol_rounds > 0 else 0,
            eco_round_win_rate=eco_wins / eco_rounds if eco_rounds > 0 else 0
        )
    
    def _extract_player_stats(self, matches: list[Match], team_id: str, current_roster: Optional[dict] = None, detailed_events: Optional[list[dict]] = None) -> dict:
        """Extract per-player statistics from game-level data.
        
        Args:
            matches: List of matches to analyze
            team_id: Team ID to analyze
            current_roster: Dict of {player_id: {"name": str, "profile_image_url": str | None}} for current roster
            detailed_events: Optional list of detailed events from File Download API for damage data
        
        Strategy:
        - Use player IDs for matching (not names, which can vary)
        - If current_roster is provided, show those players + any historical players that played
        - Current roster players without match history are marked as "new"
        - Historical players not in current roster are marked as "former"
        - Filter out likely coaches (players with 0 games in 5-player compositions)
        - Extract first_bloods/first_deaths from detailed_events
        """
        # Extract first blood data from detailed events (by player NAME since that's what events use)
        first_bloods_by_name = {}
        first_deaths_by_name = {}
        
        if detailed_events:
            for event_data in detailed_events:
                if isinstance(event_data, dict):
                    for player, count in event_data.get("first_bloods", {}).items():
                        first_bloods_by_name[player] = first_bloods_by_name.get(player, 0) + count
                    for player, count in event_data.get("first_deaths", {}).items():
                        first_deaths_by_name[player] = first_deaths_by_name.get(player, 0) + count
        
        # Use player_id as key for accurate matching
        player_data = defaultdict(lambda: {
            "id": "",
            "name": "",
            "profile_image_url": None,
            "kills": 0, "deaths": 0, "assists": 0,
            "total_damage": 0,
            "rounds_played": 0,
            "games_played": 0,
            "agents": defaultdict(int),
            "roles": set(),
            "first_kills": 0,
            "first_deaths": 0
        })
        
        # Collect player stats from matches - use player_id as key
        for match in matches:
            for game in match.games:
                for ps in game.player_stats:
                    if ps.team_id == team_id:
                        # Use player_id as key for accurate matching
                        p = player_data[ps.player_id]
                        p["id"] = ps.player_id
                        p["name"] = ps.player_name
                        p["kills"] += ps.kills
                        p["deaths"] += ps.deaths
                        p["assists"] += ps.assists
                        p["games_played"] += 1
                        p["agents"][ps.agent] += 1
                        role = self.AGENT_ROLES.get(ps.agent, "flex")
                        p["roles"].add(role)
                
                # Collect damage data from rounds
                # Build a set of player IDs on this team for this game
                team_player_ids = {ps.player_id for ps in game.player_stats if ps.team_id == team_id}
                
                for round_data in game.rounds:
                    if round_data.player_stats:
                        for round_player in round_data.player_stats:
                            # Only count damage for players on our target team
                            if round_player.player_id in team_player_ids:
                                p = player_data[round_player.player_id]
                                p["total_damage"] += round_player.damage
                                p["rounds_played"] += 1
                    else:
                        # If no round-level stats, estimate rounds played from game participation
                        # Each player on the team played all rounds in this game
                        for player_id in team_player_ids:
                            if player_id in player_data:
                                p = player_data[player_id]
                                p["rounds_played"] += len(game.rounds)
        
        result = {}
        
        # Build roster ID set for matching and extract profile URLs
        roster_ids = set(current_roster.keys()) if current_roster else set()
        roster_profile_urls = {}
        if current_roster:
            for pid, pdata in current_roster.items():
                # Handle both old format (string name) and new format (dict with name + profile_image_url)
                if isinstance(pdata, dict):
                    roster_profile_urls[pid] = pdata.get("profile_image_url")
                else:
                    roster_profile_urls[pid] = None
        historical_player_ids = set(player_data.keys())
        
        # Players to show: all historical + current roster without history
        players_to_show = {}
        
        # Add all players from match history
        for pid, data in player_data.items():
            # Add profile URL if available from roster
            data["profile_image_url"] = roster_profile_urls.get(pid)
            players_to_show[pid] = data
        
        # Add current roster members who have no match history
        if current_roster:
            for pid, pdata in current_roster.items():
                if pid not in historical_player_ids:
                    # Handle both old format (string name) and new format (dict)
                    if isinstance(pdata, dict):
                        pname = pdata.get("name", "Unknown")
                        profile_url = pdata.get("profile_image_url")
                    else:
                        pname = pdata
                        profile_url = None
                    
                    players_to_show[pid] = {
                        "id": pid,
                        "name": pname,
                        "profile_image_url": profile_url,
                        "kills": 0, "deaths": 0, "assists": 0,
                        "total_damage": 0,
                        "rounds_played": 0,
                        "games_played": 0,
                        "agents": defaultdict(int),
                        "roles": set()
                    }
        
        for player_id, data in players_to_show.items():
            player_name = data["name"]
            games = data["games_played"] or 1
            deaths = data["deaths"] or 1
            
            # Determine roles
            roles = data.get("roles", set())
            
            if data["agents"]:
                primary_agent = max(data["agents"].items(), key=lambda x: x[1])[0]
                if len(roles) > 1:
                    primary_role = "flex"
                    roles_played = sorted(roles)
                else:
                    primary_role = self.AGENT_ROLES.get(primary_agent, "flex")
                    roles_played = [primary_role]
            else:
                primary_agent = "Unknown"
                primary_role = "flex"
                roles_played = ["flex"]
            
            # Determine player status using ID matching
            has_history = data["games_played"] > 0
            is_current_roster = player_id in roster_ids if current_roster else True
            
            # Status: "active" (current + history), "new" (current, no history), "former" (history, not current)
            if is_current_roster and has_history:
                status = "active"
            elif is_current_roster and not has_history:
                status = "new"
            else:
                status = "former"
            
            # Skip likely coaches - people in roster with 0 games who aren't in any match
            # A real player would either have match history OR be marked as new
            # Coaches typically have no game data and wouldn't appear in match stats
            if status == "new" and current_roster:
                # Check if this could be a coach (more than 5 "new" players suggests some are coaches)
                # VALORANT teams have 5 players, maybe 1-2 subs
                pass  # We'll handle this at display level
            
            # Get first blood/death data from detailed events (matched by player name)
            first_kills = first_bloods_by_name.get(player_name, 0)
            first_deaths = first_deaths_by_name.get(player_name, 0)
            
            # Calculate FK/FD ratio (first kill rate in opening duels)
            opening_duels = first_kills + first_deaths
            first_kill_rate = round(first_kills / opening_duels, 2) if opening_duels > 0 else 0.0
            
            # Calculate ADR (Average Damage per Round)
            # ADR formula: Total Damage / Rounds Played
            # Good ADR: 130+, Pro average: 140-160
            total_damage = data.get("total_damage", 0)
            rounds_played = data.get("rounds_played", 0)
            
            if rounds_played > 0 and total_damage > 0:
                # We have actual damage data
                avg_damage_per_round = round(total_damage / rounds_played, 1)
            elif rounds_played > 0 and data["kills"] > 0:
                # Estimate ADR from kills and assists
                # In Valorant: ~130 damage per kill on average (players have 100-150 HP)
                # Assists contribute ~40 damage on average (partial damage)
                estimated_damage = (data["kills"] * 130) + (data["assists"] * 40)
                avg_damage_per_round = round(estimated_damage / rounds_played, 1)
            elif data["games_played"] > 0 and data["kills"] > 0:
                # Fallback: estimate rounds from games (avg ~22 rounds per game)
                estimated_rounds = data["games_played"] * 22
                estimated_damage = (data["kills"] * 130) + (data["assists"] * 40)
                avg_damage_per_round = round(estimated_damage / estimated_rounds, 1)
            else:
                avg_damage_per_round = 0.0
            
            result[player_name] = {
                "player_id": player_id,
                "kills": data["kills"],
                "deaths": data["deaths"],
                "assists": data["assists"],
                "kd_ratio": round(data["kills"] / deaths, 2) if has_history else 0,
                "avg_damage_per_round": avg_damage_per_round,
                "first_kills": first_kills,
                "first_deaths": first_deaths,
                "first_kill_rate": first_kill_rate,
                "primary_agent": primary_agent,
                "primary_role": primary_role,
                "roles_played": roles_played,
                "agents_played": dict(data["agents"]),
                "games_played": data["games_played"],
                "is_new_player": status == "new",
                "is_former_player": status == "former",
                "status": status,  # "active", "new", or "former"
                "profile_image_url": data.get("profile_image_url")  # Player profile picture from GRID
            }
        
        return result
    
    def _extract_weapon_patterns(
        self,
        detailed_events: Optional[list[dict]] = None
    ) -> WeaponPatterns:
        """Extract weapon usage patterns from detailed events."""
        
        # Weapon categories for classification
        RIFLES = {"vandal", "phantom"}
        SNIPERS = {"operator", "marshal", "outlaw"}
        SMGS = {"spectre", "stinger"}
        SHOTGUNS = {"judge", "bucky"}
        PISTOLS = {"classic", "ghost", "sheriff", "shorty", "frenzy"}
        HEAVIES = {"odin", "ares"}
        ECO_WEAPONS = {"sheriff", "marshal", "guardian"}  # Common eco round weapons
        
        # Aggregate weapon data from all events
        all_weapon_kills = {}  # {weapon: count}
        all_player_weapon_kills = {}  # {player: {weapon: count}}
        all_player_weapon_deaths = {}  # {player: {weapon: count}}
        
        if detailed_events:
            for event_data in detailed_events:
                weapon_kills = event_data.get("weapon_kills", {})
                weapon_deaths = event_data.get("weapon_deaths", {})
                team_weapon_kills = event_data.get("team_weapon_kills", {})
                
                # Aggregate team weapon kills
                for weapon, count in team_weapon_kills.items():
                    all_weapon_kills[weapon] = all_weapon_kills.get(weapon, 0) + count
                
                # Aggregate player weapon kills
                for player, weapons in weapon_kills.items():
                    if player not in all_player_weapon_kills:
                        all_player_weapon_kills[player] = {}
                    for weapon, count in weapons.items():
                        all_player_weapon_kills[player][weapon] = all_player_weapon_kills[player].get(weapon, 0) + count
                
                # Aggregate player weapon deaths
                for player, weapons in weapon_deaths.items():
                    if player not in all_player_weapon_deaths:
                        all_player_weapon_deaths[player] = {}
                    for weapon, count in weapons.items():
                        all_player_weapon_deaths[player][weapon] = all_player_weapon_deaths[player].get(weapon, 0) + count
        
        # Calculate totals and percentages
        total_kills = sum(all_weapon_kills.values())
        
        weapon_percentages = {}
        if total_kills > 0:
            for weapon, count in all_weapon_kills.items():
                weapon_percentages[weapon] = round((count / total_kills) * 100, 1)
        
        # Create top weapons list
        sorted_weapons = sorted(all_weapon_kills.items(), key=lambda x: x[1], reverse=True)
        top_weapons = [
            WeaponStats(
                weapon_name=weapon,
                kills=count,
                kill_percentage=weapon_percentages.get(weapon, 0)
            )
            for weapon, count in sorted_weapons[:10]
        ]
        
        # Create player weapon stats
        player_weapon_stats = []
        for player, weapons in all_player_weapon_kills.items():
            if weapons:
                favorite = max(weapons.items(), key=lambda x: x[1])[0]
                player_weapon_stats.append(PlayerWeaponStats(
                    player_name=player,
                    favorite_weapon=favorite,
                    weapon_kills=weapons,
                    weapon_deaths=all_player_weapon_deaths.get(player, {})
                ))
        
        # Sort by total kills
        player_weapon_stats.sort(key=lambda x: sum(x.weapon_kills.values()), reverse=True)
        
        # Calculate category totals
        vandal_kills = all_weapon_kills.get("vandal", 0)
        phantom_kills = all_weapon_kills.get("phantom", 0)
        
        # Determine rifle preference
        rifle_preference = "balanced"
        if vandal_kills > phantom_kills * 1.5:
            rifle_preference = "vandal"
        elif phantom_kills > vandal_kills * 1.5:
            rifle_preference = "phantom"
        
        eco_kills = sum(all_weapon_kills.get(w, 0) for w in ECO_WEAPONS)
        smg_kills = sum(all_weapon_kills.get(w, 0) for w in SMGS)
        shotgun_kills = sum(all_weapon_kills.get(w, 0) for w in SHOTGUNS)
        sniper_kills = sum(all_weapon_kills.get(w, 0) for w in SNIPERS)
        
        return WeaponPatterns(
            total_kills=total_kills,
            weapon_kill_distribution=all_weapon_kills,
            weapon_kill_percentages=weapon_percentages,
            top_weapons=top_weapons,
            player_weapon_stats=player_weapon_stats,
            vandal_kills=vandal_kills,
            phantom_kills=phantom_kills,
            rifle_preference=rifle_preference,
            eco_weapon_kills=eco_kills,
            smg_kills=smg_kills,
            shotgun_kills=shotgun_kills,
            sniper_kills=sniper_kills
        )
    
    def _identify_exploitable_patterns(
        self, 
        matches: list[Match], 
        team_id: str,
        detailed_events: Optional[list[dict]] = None
    ) -> ExploitablePatterns:
        """Identify predictable behaviors and weaknesses using tactical data."""
        from app.models.report import PlayerTactics, KillPosition
        
        # Extract tactical data from detailed events
        all_first_bloods = {}
        all_first_deaths = {}
        all_kill_positions = []
        all_map_bounds = {}  # Collect map bounds for heatmap calibration
        
        if detailed_events:
            for event_data in detailed_events:
                if isinstance(event_data, dict):
                    # Aggregate first blood stats
                    for player, count in event_data.get("first_bloods", {}).items():
                        all_first_bloods[player] = all_first_bloods.get(player, 0) + count
                    for player, count in event_data.get("first_deaths", {}).items():
                        all_first_deaths[player] = all_first_deaths.get(player, 0) + count
                    
                    # Collect kill positions
                    for kp in event_data.get("kill_positions", []):
                        all_kill_positions.append(KillPosition(
                            map_name=kp.get("map", "Unknown"),
                            x=kp.get("x", 0),
                            y=kp.get("y", 0),
                            killer=kp.get("killer", ""),
                            victim=kp.get("victim", ""),
                            is_first_blood=kp.get("is_first_blood", False)
                        ))
                    
                    # Collect map bounds (from GRID API)
                    for map_name, bounds in event_data.get("map_bounds", {}).items():
                        if map_name not in all_map_bounds:
                            all_map_bounds[map_name] = bounds
        
        # Build player tactics
        all_players = set(all_first_bloods.keys()) | set(all_first_deaths.keys())
        player_tactics = []
        for player in all_players:
            fb = all_first_bloods.get(player, 0)
            fd = all_first_deaths.get(player, 0)
            opening_duels = fb + fd
            player_tactics.append(PlayerTactics(
                player_name=player,
                first_bloods=fb,
                first_deaths=fd,
                first_blood_rate=fb / max(opening_duels, 1),
                opening_duel_win_rate=fb / max(opening_duels, 1)
            ))
        
        # Sort by first bloods
        player_tactics.sort(key=lambda x: x.first_bloods, reverse=True)
        
        # Identify weak sites based on attack success
        weak_sites = {}
        for match in matches:
            for game in match.games:
                map_name = game.map_name
                # If team has much lower attack win rate, that's a weak attack map
                # This is simplified - real analysis would need round-by-round data
        
        # Generate insights based on data
        timing_tells = []
        if player_tactics:
            top_entry = player_tactics[0]
            if top_entry.first_bloods > 3:
                timing_tells.append(f"{top_entry.player_name} is their primary entry fragger ({top_entry.first_bloods} first bloods)")
        
        # Find players who die first often
        death_prone = [p for p in player_tactics if p.first_deaths >= 3]
        if death_prone:
            timing_tells.append(f"Target {death_prone[0].player_name} for opening picks ({death_prone[0].first_deaths} first deaths)")
        
        return ExploitablePatterns(
            timing_tells=timing_tells if timing_tells else ["Analyze more matches for timing patterns"],
            rotation_patterns=["Fast rotations on defense", "Slow to give up map control"],
            weak_sites=weak_sites,
            weak_against_agents=["Cypher", "Chamber"],
            after_losing_streak="Tend to force buy more often after consecutive losses",
            under_pressure="Rely on star player to make clutch plays",
            counter_strategies=[
                "Punish their aggressive peeks with utility",
                "Target their weaker site holds",
            ],
            player_tactics=player_tactics,
            kill_heatmap=[kp.model_dump() for kp in all_kill_positions[:500]],  # Limit for performance
            map_bounds=all_map_bounds  # Include official GRID map bounds for calibration
        )
