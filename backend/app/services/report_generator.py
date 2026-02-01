"""LLM-powered report generation service."""
import json
from datetime import datetime
from typing import AsyncGenerator, Optional
import uuid

from loguru import logger

from app.config import get_settings, clear_settings_cache
from app.models.team import TeamDetails
from app.models.report import ScoutingReport, ReportSection, TacticalBriefing, MapStrategy
from app.services.data_processor import MatchAnalysis

settings = get_settings()


class ReportGenerator:
    """
    Generates natural language scouting reports using LLM.
    
    Takes structured match analysis data and produces
    coach-ready prose reports with actionable insights.
    """
    
    SYSTEM_PROMPT = """You are an elite VALORANT analyst and coach. Your job is to create detailed, actionable scouting reports for professional teams preparing for upcoming matches.

Your reports should be:
1. SPECIFIC - Reference exact tendencies, percentages, and patterns
2. ACTIONABLE - Include concrete counter-strategies
3. PRIORITIZED - Lead with the most important insights
4. PROFESSIONAL - Use proper VALORANT terminology

Format your responses in clean Markdown with clear sections."""

    def __init__(self):
        self.client = None
        # Clear settings cache and get fresh settings
        clear_settings_cache()
        self.settings = get_settings()
        logger.info(f"LLM Config - Provider: {self.settings.llm_provider}, Model: {self.settings.effective_llm_model}, Is Thinking: {self.settings.is_thinking_model}")
        self._init_client()
    
    def _init_client(self):
        """Initialize the LLM client based on configuration."""
        if self.settings.llm_provider == "anthropic" and self.settings.anthropic_api_key:
            try:
                import anthropic
                self.client = anthropic.Anthropic(api_key=self.settings.anthropic_api_key)
                self.provider = "anthropic"
                logger.info(f"Initialized Anthropic client with model: {self.settings.effective_llm_model}")
            except ImportError:
                logger.warning("Anthropic package not installed")
        
        elif self.settings.llm_provider == "openai" and self.settings.openai_api_key:
            try:
                from openai import OpenAI
                self.client = OpenAI(api_key=self.settings.openai_api_key)
                self.provider = "openai"
                logger.info(f"Initialized OpenAI client with model: {self.settings.effective_llm_model}")
            except ImportError:
                logger.warning("OpenAI package not installed")
        
        if not self.client:
            logger.warning("No LLM client configured, using template generation")
            self.provider = "template"
    
    async def generate(
        self,
        team: TeamDetails,
        analysis: MatchAnalysis,
        tournament_name: str = ""
    ) -> ScoutingReport:
        """
        Generate a complete scouting report.
        
        Args:
            team: Target team details
            analysis: Processed match analysis data
            
        Returns:
            Complete ScoutingReport with LLM-generated prose
        """
        logger.info(f"Generating report for {team.name}")
        
        # Prepare structured data for LLM
        data_context = self._prepare_context(team, analysis)
        
        # Generate each section
        sections = []
        
        # Executive Summary
        summary = await self._generate_section(
            "executive_summary",
            data_context,
            "Write a 2-3 paragraph executive summary of this team's playstyle, strengths, and key vulnerabilities."
        )
        
        # Team Composition Analysis
        comp_section = await self._generate_section(
            "agent_compositions",
            data_context,
            "Analyze their agent composition tendencies. Include pick rates, common comps, flex picks, and recent changes."
        )
        sections.append(ReportSection(
            title="Team Composition Tendencies",
            content=comp_section,
            data=analysis.agent_tendencies.model_dump() if analysis.agent_tendencies else None,
            priority=1
        ))
        
        # Map-by-Map Breakdown
        map_section = await self._generate_section(
            "map_strategies",
            data_context,
            "Break down their strategies for each map. Include site preferences, timing patterns, and defaults."
        )
        sections.append(ReportSection(
            title="Map-Specific Strategies",
            content=map_section,
            data={k: v.model_dump() for k, v in analysis.site_tendencies.items()},
            priority=2
        ))
        
        # Economy Patterns
        econ_section = await self._generate_section(
            "economy",
            data_context,
            "Analyze their economic patterns. Cover pistol rounds, force buys, and round 2 conversions."
        )
        sections.append(ReportSection(
            title="Economic Patterns",
            content=econ_section,
            data=analysis.economy_patterns.model_dump() if analysis.economy_patterns else None,
            priority=3
        ))
        
        # Player Analysis
        player_section = await self._generate_section(
            "players",
            data_context,
            "Profile each player. Include their role, playstyle, and specific tendencies to watch for."
        )
        sections.append(ReportSection(
            title="Player Tendencies",
            content=player_section,
            data=analysis.player_stats,
            priority=4
        ))
        
        # Exploitable Patterns
        exploit_section = await self._generate_section(
            "exploits",
            data_context,
            "List specific exploitable patterns and concrete counter-strategies to use against this team."
        )
        sections.append(ReportSection(
            title="Exploitable Patterns & Counter-Strategies",
            content=exploit_section,
            data=analysis.exploitable_patterns.model_dump() if analysis.exploitable_patterns else None,
            priority=5
        ))
        
        # Extract key insights as bullet points
        key_insights = await self._generate_key_insights(data_context)
        
        # Generate AI-powered tactical briefing
        tactical_briefing = await self.generate_tactical_briefing(team, analysis, data_context, tournament_name)
        
        return ScoutingReport(
            id=str(uuid.uuid4()),
            team_id=team.id,
            team_name=team.name,
            generated_at=datetime.utcnow(),
            matches_analyzed=analysis.matches_analyzed,
            total_maps_played=analysis.total_maps_played,
            date_range=analysis.date_range,
            executive_summary=summary,
            sections=sections,
            agent_tendencies=analysis.agent_tendencies,
            site_tendencies={k: v.model_dump() for k, v in analysis.site_tendencies.items()},
            economy_patterns=analysis.economy_patterns,
            player_tendencies=analysis.player_stats,
            exploitable_patterns=analysis.exploitable_patterns,
            weapon_patterns=analysis.weapon_patterns,
            key_insights=key_insights,
            recommended_comps=[],
            ban_recommendations=[],
            tactical_briefing=tactical_briefing
        )
    
    async def generate_tactical_briefing(
        self,
        team: TeamDetails,
        analysis: MatchAnalysis,
        context: dict,
        tournament_name: str = ""
    ) -> TacticalBriefing:
        """
        Generate a comprehensive AI-powered tactical briefing.
        
        This creates a story-driven, coach-ready briefing that tells the narrative
        of how this team plays and how to beat them on each map.
        """
        logger.info(f"Generating tactical briefing for {team.name}")
        
        try:
            # Generate overall team identity and playstyle narrative
            team_identity_prompt = f"""You are an elite VALORANT esports analyst. Based on the following data about {team.name}, write a compelling narrative that tells the story of their playstyle.

DATA:
{json.dumps({
    "agent_tendencies": context.get("agent_tendencies", {}),
    "economy_patterns": context.get("economy_patterns", {}),
    "map_win_rates": context.get("map_win_rates", {}),
    "player_stats": {k: {"kd": v.get("kd_ratio") if isinstance(v, dict) else getattr(v, "kd_ratio", 0), "role": v.get("primary_role") if isinstance(v, dict) else getattr(v, "primary_role", "Unknown"), "agent": v.get("primary_agent") if isinstance(v, dict) else getattr(v, "primary_agent", "Unknown")} for k, v in list(context.get("player_stats", {}).items())[:5]},
    "exploitable_patterns": context.get("exploitable_patterns", {})
}, indent=2, default=str)}

Write 2-3 paragraphs that:
1. Describe their team identity (aggressive, methodical, adaptive, etc.)
2. Tell the story of their playstyle using specific examples from the data
3. Paint a picture of how they approach VALORANT
4. Make it engaging and narrative-driven, not just numbers

Be specific - reference actual percentages, agents, and patterns. Write like you're telling a story to a coach."""
            
            team_identity = await self._generate_with_llm(team_identity_prompt)
            if not team_identity or team_identity == "Template generation not available for tactical briefing.":
                logger.warning("LLM not available for tactical briefing, using fallback")
                team_identity = self._generate_fallback_team_identity(team.name, context)
            playstyle_summary = team_identity  # Use same for now, can split later
            
            # Generate map-specific strategies
            map_strategies = []
            site_tendencies = context.get("site_tendencies", {})
            logger.info(f"Found {len(site_tendencies)} maps in site_tendencies")
            
            # If LLM is not available, generate fallbacks for all maps
            use_llm = self.provider != "template" and self.client is not None
            logger.info(f"LLM available for map strategies: {use_llm} (provider: {self.provider}, client: {self.client is not None})")
            
            for map_name, site_data in site_tendencies.items():
                # Handle both dict and model objects
                if isinstance(site_data, dict):
                    map_data = site_data
                elif hasattr(site_data, 'model_dump'):
                    map_data = site_data.model_dump()
                else:
                    map_data = {}
                
                # Skip if no meaningful data
                if not map_data or map_data.get('games_played', 0) == 0:
                    continue
                
                map_prompt = f"""You are an elite VALORANT coach preparing for a match against {team.name} on {map_name}.

MAP DATA:
- Attack A site: {map_data.get('a_site_attack_rate', 0) * 100:.0f}% of attacks
- Attack B site: {map_data.get('b_site_attack_rate', 0) * 100:.0f}% of attacks
- Map win rate: {map_data.get('map_win_rate', 0) * 100:.0f}%
- Games played: {map_data.get('games_played', 0)}
- Attack round win rate: {map_data.get('attack_rounds_won', 0)}/{map_data.get('attack_rounds_played', 1)} = {(map_data.get('attack_rounds_won', 0) / max(map_data.get('attack_rounds_played', 1), 1)) * 100:.0f}%
- Defense round win rate: {map_data.get('defense_rounds_won', 0)}/{map_data.get('defense_rounds_played', 1)} = {(map_data.get('defense_rounds_won', 0) / max(map_data.get('defense_rounds_played', 1), 1)) * 100:.0f}%

TEAM CONTEXT:
{json.dumps({
    "agent_tendencies": context.get("agent_tendencies", {}),
    "economy_patterns": context.get("economy_patterns", {}),
    "player_stats": context.get("player_stats", {})
}, indent=2, default=str)}

Generate a comprehensive map strategy in JSON format:
{{
    "narrative": "A 2-3 paragraph story describing how {team.name} plays on {map_name}. Be specific about their tendencies, paint a picture of their approach.",
    "key_tendencies": ["List 3-5 specific things they do on this map"],
    "counter_strategies": ["List 4-6 concrete actions to counter them"],
    "agent_bans": ["2-3 agents to ban against them on this map"],
    "agent_picks": ["2-3 agents to pick against them on this map"],
    "site_priorities": {{"A": "description", "B": "description"}},
    "timing_notes": "When they execute, rotate, etc. based on the data",
    "win_condition": "The single most important thing to do to win on this map"
}}

Return ONLY valid JSON, no markdown formatting."""
                
                if use_llm:
                    try:
                        map_strategy_json = await self._generate_with_llm(map_prompt, parse_json=True)
                        if map_strategy_json and map_strategy_json.get("narrative"):
                            map_strategies.append(MapStrategy(
                                map_name=map_name,
                                narrative=map_strategy_json.get("narrative", ""),
                                key_tendencies=map_strategy_json.get("key_tendencies", []),
                                counter_strategies=map_strategy_json.get("counter_strategies", []),
                                agent_bans=map_strategy_json.get("agent_bans", []),
                                agent_picks=map_strategy_json.get("agent_picks", []),
                                site_priorities=map_strategy_json.get("site_priorities", {}),
                                timing_notes=map_strategy_json.get("timing_notes", ""),
                                win_condition=map_strategy_json.get("win_condition", "")
                            ))
                            continue
                    except Exception as e:
                        logger.warning(f"LLM generation failed for {map_name}: {e}")
                
                # Fallback if LLM not available or failed
                logger.info(f"Generating fallback strategy for {map_name}")
                fallback_strategy = self._generate_fallback_map_strategy(map_name, map_data, team.name, context)
                if fallback_strategy:
                    map_strategies.append(fallback_strategy)
            
            # Generate star players analysis
            player_stats = context.get("player_stats", {})
            logger.info(f"Found {len(player_stats)} players for star player analysis")
            if not player_stats:
                logger.warning("No player stats available for star player analysis")
            top_players = sorted(
                player_stats.items(),
                key=lambda x: (x[1].get('kd_ratio', 0) if isinstance(x[1], dict) else getattr(x[1], 'kd_ratio', 0)),
                reverse=True
            )[:3]
            logger.info(f"Top {len(top_players)} players selected for analysis")
            
            star_players = []
            for name, stats in top_players:
                # Handle both dict and object stats
                if isinstance(stats, dict):
                    kd = stats.get('kd_ratio', 0)
                    role = stats.get('primary_role', 'Unknown')
                    agent = stats.get('primary_agent', 'Unknown')
                    first_kills = stats.get('first_kills', 0)
                    adr = stats.get('avg_damage_per_round', 0)
                else:
                    kd = getattr(stats, 'kd_ratio', 0)
                    role = getattr(stats, 'primary_role', 'Unknown')
                    agent = getattr(stats, 'primary_agent', 'Unknown')
                    first_kills = getattr(stats, 'first_kills', 0)
                    adr = getattr(stats, 'avg_damage_per_round', 0)
                
                if use_llm:
                    star_prompt = f"""Analyze this player from {team.name}:

{name}:
- K/D: {kd:.2f}
- Primary Agent: {agent}
- Role: {role}
- ADR: {adr:.0f}
- First Kills: {first_kills}

Return JSON:
{{
    "threat_level": "high/medium/low",
    "counter": "How to neutralize this player (1-2 sentences)"
}}"""
                    
                    try:
                        player_json = await self._generate_with_llm(star_prompt, parse_json=True)
                        if player_json:
                            star_players.append({
                                "name": name,
                                "role": role,
                                "agent": agent,
                                "kd": kd,
                                "threat_level": player_json.get("threat_level", "medium"),
                                "counter": player_json.get("counter", "")
                            })
                            continue
                    except Exception as e:
                        logger.warning(f"Failed to analyze player {name}: {e}")
                
                # Fallback
                threat_level = "high" if kd > 1.2 else "medium" if kd > 0.9 else "low"
                counter = f"Focus fire and trade effectively. {'Target in opening duels' if first_kills > 10 else 'Play utility to neutralize'}."
                star_players.append({
                    "name": name,
                    "role": role,
                    "agent": agent,
                    "kd": kd,
                    "threat_level": threat_level,
                    "counter": counter
                })
                logger.info(f"Added star player: {name} ({threat_level} threat, {kd:.2f} K/D)")
                logger.info(f"Added star player: {name} ({threat_level} threat, {kd:.2f} K/D)")
            
            # Generate economy analysis
            econ_prompt = f"""Based on this economy data for {team.name}:

{json.dumps(context.get("economy_patterns", {}), indent=2, default=str)}

Generate JSON:
{{
    "weakness": "When/where to exploit their economy (2-3 sentences)",
    "strength": "When they're strongest economically (1-2 sentences)"
}}"""
            
            econ_json = await self._generate_with_llm(econ_prompt, parse_json=True)
            if econ_json:
                economy_weakness = econ_json.get("weakness", "")
                economy_strength = econ_json.get("strength", "")
            else:
                # Fallback
                economy_patterns = context.get("economy_patterns", {})
                force_rate = economy_patterns.get("force_buy_rate", 0) * 100 if economy_patterns.get("force_buy_rate") else 0
                pistol_wr = economy_patterns.get("pistol_win_rate", 0) * 100 if economy_patterns.get("pistol_win_rate") else 0
                economy_weakness = f"Exploit their {'high force-buy tendency' if force_rate > 40 else 'weak pistol rounds' if pistol_wr < 45 else 'economic vulnerabilities'} by {'preparing anti-force setups' if force_rate > 40 else 'winning pistols consistently' if pistol_wr < 45 else 'controlling economy flow'}."
                economy_strength = f"They're strongest when {'they win pistols' if pistol_wr > 55 else 'they have full buys' if force_rate < 30 else 'they control the economy'}."
            
            # Generate winning formula
            win_prompt = f"""You are preparing a team to face {team.name} in VALORANT. Based on ALL the data provided, what is the #1 most important thing to do to win?

DATA SUMMARY:
- Agent pool: {len(context.get("agent_tendencies", {}).get("agent_pick_rates", {}))} agents
- Best map: {max(context.get("map_win_rates", {}).items(), key=lambda x: x[1])[0] if context.get("map_win_rates") else "Unknown"}
- Economy: {json.dumps(context.get("economy_patterns", {}), indent=2, default=str)}
- Star players: {', '.join([p["name"] for p in star_players[:2]])}

Return JSON:
{{
    "primary_win_condition": "The single most important thing to do (1 sentence)",
    "critical_actions": ["4-5 must-do actions, each starting with a verb"],
    "quick_wins": ["3-4 easy exploits/quick wins"]
}}"""
            
            win_json = await self._generate_with_llm(win_prompt, parse_json=True)
            
            # Fallbacks for win condition
            if win_json:
                primary_win_condition = win_json.get("primary_win_condition", "")
                critical_actions = win_json.get("critical_actions", [])
                quick_wins = win_json.get("quick_wins", [])
            else:
                # Generate fallback win conditions
                map_win_rates = context.get("map_win_rates", {})
                def get_win_rate_value(rate):
                    if isinstance(rate, str):
                        return float(rate.rstrip('%'))
                    return rate * 100 if isinstance(rate, float) else 0
                best_map = max(map_win_rates.items(), key=lambda x: get_win_rate_value(x[1]))[0] if map_win_rates else "Unknown"
                primary_win_condition = f"Force {team.name} off their comfort picks and control {best_map} through disciplined utility usage and site control."
                critical_actions = [
                    f"Ban their best map ({best_map}) to force them into weaker maps",
                    "Win pistol rounds consistently to gain early momentum",
                    "Control economy flow and prevent force-buy snowballs",
                    "Target their star players in opening duels"
                ]
                quick_wins = [
                    "Exploit their predictable agent pool",
                    "Counter their preferred attack sites",
                    "Win anti-eco rounds consistently"
                ]
            
            # Ensure we always have team_identity
            if not team_identity:
                logger.warning("team_identity is empty, using fallback")
                team_identity = self._generate_fallback_team_identity(team.name, context)
                playstyle_summary = team_identity
            
            logger.info(f"Generated tactical briefing: {len(map_strategies)} maps, {len(star_players)} star players")
            logger.info(f"Briefing fields - win_condition: {bool(primary_win_condition)}, critical_actions: {len(critical_actions)}, quick_wins: {len(quick_wins)}, economy: {bool(economy_weakness)}")
            
            # Ensure critical fields have content
            if not primary_win_condition:
                logger.warning("primary_win_condition is empty, using fallback")
                best_map = max(context.get("map_win_rates", {}).items(), key=lambda x: x[1])[0] if context.get("map_win_rates") else "their comfort maps"
                primary_win_condition = f"Force {team.name} off {best_map} and control the pace through disciplined utility usage and site control."
            
            if not critical_actions:
                logger.warning("critical_actions is empty, using fallback")
                critical_actions = [
                    "Win pistol rounds consistently to gain early momentum",
                    "Control economy flow and prevent force-buy snowballs",
                    "Target their star players in opening duels",
                    "Exploit their predictable patterns"
                ]
            
            if not quick_wins:
                logger.warning("quick_wins is empty, using fallback")
                quick_wins = [
                    "Exploit their predictable agent pool",
                    "Counter their preferred attack sites",
                    "Win anti-eco rounds consistently"
                ]
            
            if not economy_weakness:
                logger.warning("economy_weakness is empty, using fallback")
                economy_weakness = "Exploit their economic vulnerabilities through consistent pistol wins and anti-eco setups."
            
            if not economy_strength:
                logger.warning("economy_strength is empty, using fallback")
                economy_strength = "They're strongest when they have full buys and utility advantage."
            
            return TacticalBriefing(
                team_name=team.name,
                matches_analyzed=analysis.matches_analyzed,
                tournament_context=tournament_name,
                team_identity=team_identity,
                playstyle_summary=playstyle_summary,
                map_strategies=map_strategies,
                star_players=star_players,
                economy_weakness=economy_weakness,
                economy_strength=economy_strength,
                primary_win_condition=primary_win_condition,
                critical_actions=critical_actions,
                quick_wins=quick_wins
            )
            
        except Exception as e:
            logger.error(f"Failed to generate tactical briefing: {e}", exc_info=True)
            # Return a minimal briefing with fallback content
            try:
                fallback_identity = self._generate_fallback_team_identity(team.name, context)
                
                # Generate fallback map strategies
                fallback_maps = []
                site_tendencies = context.get("site_tendencies", {})
                for map_name, site_data in list(site_tendencies.items())[:3]:  # Limit to 3 maps
                    if isinstance(site_data, dict):
                        map_data = site_data
                    elif hasattr(site_data, 'model_dump'):
                        map_data = site_data.model_dump()
                    else:
                        continue
                    if map_data.get('games_played', 0) > 0:
                        fallback_strategy = self._generate_fallback_map_strategy(map_name, map_data, team.name, context)
                        if fallback_strategy:
                            fallback_maps.append(fallback_strategy)
                
                # Fallback win condition
                map_win_rates = context.get("map_win_rates", {})
                def get_win_rate_value(rate):
                    if isinstance(rate, str):
                        return float(rate.rstrip('%'))
                    return rate * 100 if isinstance(rate, float) else 0
                best_map = max(map_win_rates.items(), key=lambda x: get_win_rate_value(x[1]))[0] if map_win_rates else "Unknown"
                primary_win_condition = f"Force {team.name} off their comfort picks and control {best_map} through disciplined utility usage."
                
                return TacticalBriefing(
                    team_name=team.name,
                    matches_analyzed=analysis.matches_analyzed,
                    tournament_context=tournament_name,
                    team_identity=fallback_identity,
                    playstyle_summary=fallback_identity,
                    map_strategies=fallback_maps,
                    star_players=[],
                    economy_weakness="Exploit their economic vulnerabilities through consistent pistol wins and anti-eco setups.",
                    economy_strength="They're strongest when they have full buys and utility advantage.",
                    primary_win_condition=primary_win_condition,
                    critical_actions=[
                        f"Ban their best map ({best_map})",
                        "Win pistol rounds consistently",
                        "Control economy flow"
                    ],
                    quick_wins=[
                        "Exploit predictable patterns",
                        "Counter preferred sites"
                    ]
                )
            except Exception as fallback_error:
                logger.error(f"Even fallback generation failed: {fallback_error}")
                # Absolute minimal fallback
                return TacticalBriefing(
                    team_name=team.name,
                    matches_analyzed=analysis.matches_analyzed,
                    tournament_context=tournament_name,
                    team_identity=f"{team.name} is a VALORANT team analyzed across {analysis.matches_analyzed} matches. Review the detailed sections below for tactical insights.",
                    playstyle_summary=f"Analysis of {team.name}'s playstyle based on recent match data.",
                    map_strategies=[],
                    star_players=[],
                    economy_weakness="",
                    economy_strength="",
                    primary_win_condition="",
                    critical_actions=[],
                    quick_wins=[]
                )
    
    async def _generate_with_llm(self, prompt: str, parse_json: bool = False):
        """Generate text or JSON using LLM."""
        if self.provider == "template" or not self.client:
            logger.warning(f"LLM not available (provider: {self.provider}, client: {self.client is not None})")
            logger.warning("This means tactical briefing will use fallback content")
            return "" if not parse_json else {}
        
        try:
            logger.info(f"Calling LLM ({self.provider}) for tactical briefing generation")
            if self.provider == "anthropic":
                message = self.client.messages.create(
                    model=self.settings.effective_llm_model,
                    max_tokens=2000,
                    temperature=0.8,  # Higher creativity for storytelling
                    messages=[{"role": "user", "content": prompt}]
                )
                text = message.content[0].text
                logger.info(f"LLM response received ({len(text)} chars)")
            elif self.provider == "openai":
                # Thinking models (o1, gpt-5.2-thinking) don't support temperature or max_tokens
                if self.settings.is_thinking_model:
                    # Try with reasoning_effort, fallback without it if SDK doesn't support
                    try:
                        response = self.client.chat.completions.create(
                            model=self.settings.effective_llm_model,
                            messages=[{"role": "user", "content": prompt}],
                            reasoning_effort="medium"  # Balance between quality and speed
                        )
                    except TypeError:
                        # SDK version doesn't support reasoning_effort, use without it
                        logger.warning("SDK doesn't support reasoning_effort, using default reasoning")
                        response = self.client.chat.completions.create(
                            model=self.settings.effective_llm_model,
                            messages=[{"role": "user", "content": prompt}]
                        )
                else:
                    response = self.client.chat.completions.create(
                        model=self.settings.effective_llm_model,
                        messages=[{"role": "user", "content": prompt}],
                        max_tokens=2000,
                        temperature=0.8
                    )
                text = response.choices[0].message.content
                logger.info(f"LLM response received ({len(text)} chars)")
            else:
                logger.warning(f"Unknown provider: {self.provider}")
                return "" if not parse_json else {}
            
            if parse_json:
                # Try to extract JSON from response
                import re
                json_match = re.search(r'\{.*\}', text, re.DOTALL)
                if json_match:
                    return json.loads(json_match.group())
                logger.warning("Failed to parse JSON from LLM response")
                return {}
            
            return text
            
        except Exception as e:
            error_msg = str(e)
            # Handle OpenAI API errors
            if hasattr(e, 'response') and hasattr(e.response, 'json'):
                try:
                    error_data = e.response.json()
                    error_msg = error_data.get('error', {}).get('message', error_msg)
                except:
                    pass
            logger.error(f"LLM generation failed: {error_msg}", exc_info=True)
            return "" if not parse_json else {}
    
    def _generate_fallback_team_identity(self, team_name: str, context: dict) -> str:
        """Generate a fallback team identity when LLM is not available."""
        agent_tendencies = context.get("agent_tendencies", {})
        agent_pick_rates = agent_tendencies.get("agent_pick_rates", {})
        top_agents = sorted(agent_pick_rates.items(), key=lambda x: x[1], reverse=True)[:3]
        
        map_win_rates = context.get("map_win_rates", {})
        # Handle both string percentages and float values
        def get_win_rate_value(rate):
            if isinstance(rate, str):
                # Remove % and convert to float
                return float(rate.rstrip('%'))
            return rate * 100 if isinstance(rate, float) else 0
        
        best_map = max(map_win_rates.items(), key=lambda x: get_win_rate_value(x[1]))[0] if map_win_rates else "Unknown"
        best_map_wr = get_win_rate_value(map_win_rates.get(best_map, 0))
        
        economy = context.get("economy_patterns", {})
        pistol_wr = economy.get("pistol_win_rate", 0) * 100 if economy.get("pistol_win_rate") else 0
        
        return f"""{team_name} is a VALORANT team with a distinct playstyle shaped by their agent preferences and tactical approach.

Their agent pool centers around {', '.join([a[0] for a in top_agents]) if top_agents else 'a diverse set of agents'}, indicating {'a methodical, utility-focused approach' if any('Controller' in str(a) for a in top_agents) else 'an aggressive, duelist-heavy style' if any('Duelist' in str(a) for a in top_agents) else 'a balanced, adaptive composition'}.

On their best map, {best_map}, they demonstrate strong fundamentals with a {best_map_wr:.0f}% win rate. Their pistol round performance sits at {pistol_wr:.0f}%, {'showing strong early-round execution' if pistol_wr > 55 else 'indicating potential vulnerability in opening rounds' if pistol_wr < 45 else 'demonstrating average pistol play'}.

This team's identity is built on {'consistent, structured play' if len(agent_pick_rates) < 12 else 'flexibility and adaptation'}, making them {'predictable but reliable' if len(agent_pick_rates) < 12 else 'unpredictable but potentially exploitable'}."""
    
    def _generate_fallback_map_strategy(self, map_name: str, map_data: dict, team_name: str, context: dict) -> Optional[MapStrategy]:
        """Generate fallback map strategy when LLM is not available."""
        try:
            a_rate = map_data.get('a_site_attack_rate', 0) * 100
            b_rate = map_data.get('b_site_attack_rate', 0) * 100
            map_wr = map_data.get('map_win_rate', 0) * 100
            atk_wr = (map_data.get('attack_rounds_won', 0) / max(map_data.get('attack_rounds_played', 1), 1)) * 100
            def_wr = (map_data.get('defense_rounds_won', 0) / max(map_data.get('defense_rounds_played', 1), 1)) * 100
            
            # Determine primary site
            primary_site = "A" if a_rate > b_rate else "B"
            
            narrative = f"""{team_name} approaches {map_name} with a {'strong' if map_wr > 55 else 'weak' if map_wr < 45 else 'balanced'} record, showing a {map_wr:.0f}% win rate. Their attack side demonstrates {'strength' if atk_wr > 55 else 'vulnerability' if atk_wr < 45 else 'consistency'} with a {atk_wr:.0f}% attack round win rate, while their defense sits at {def_wr:.0f}% round win rate.

They show a clear preference for {primary_site} site, hitting it {max(a_rate, b_rate):.0f}% of the time on attack. This {'predictable pattern' if max(a_rate, b_rate) > 60 else 'balanced approach'} {'creates opportunities for counter-strategies' if max(a_rate, b_rate) > 60 else 'requires adaptive defense'}."""
            
            key_tendencies = []
            if a_rate > 60:
                key_tendencies.append(f"Heavy {primary_site} site focus ({a_rate:.0f}% of attacks)")
            elif b_rate > 60:
                key_tendencies.append(f"Heavy {primary_site} site focus ({b_rate:.0f}% of attacks)")
            if atk_wr > 55:
                key_tendencies.append(f"Strong attack side ({atk_wr:.0f}% attack round win rate)")
            if def_wr > 55:
                key_tendencies.append(f"Strong defense ({def_wr:.0f}% defense round win rate)")
            
            counter_strategies = []
            if max(a_rate, b_rate) > 60:
                counter_strategies.append(f"Stack {primary_site} site on defense - they hit it {max(a_rate, b_rate):.0f}% of the time")
            if atk_wr < 45:
                counter_strategies.append("Exploit their weak attack side with aggressive defense")
            if def_wr < 45:
                counter_strategies.append("Fast executes recommended - their defense is vulnerable")
            
            # Get agent recommendations from context
            agent_tendencies = context.get("agent_tendencies", {})
            top_agents = sorted(agent_tendencies.get("agent_pick_rates", {}).items(), key=lambda x: x[1], reverse=True)[:3]
            agent_bans = [a[0] for a in top_agents[:2]] if top_agents else []
            
            return MapStrategy(
                map_name=map_name,
                narrative=narrative,
                key_tendencies=key_tendencies[:5],
                counter_strategies=counter_strategies[:6],
                agent_bans=agent_bans,
                agent_picks=[],
                site_priorities={primary_site: f"Focus defense here - {max(a_rate, b_rate):.0f}% attack rate"},
                timing_notes=f"Execute {'fast' if def_wr < 45 else 'methodically'} based on their {def_wr:.0f}% defense win rate",
                win_condition=f"Control {primary_site} site and exploit their {'weak attack' if atk_wr < 45 else 'weak defense' if def_wr < 45 else 'predictable patterns'}"
            )
        except Exception as e:
            logger.error(f"Failed to generate fallback map strategy: {e}")
            return None
    
    def _prepare_context(self, team: TeamDetails, analysis: MatchAnalysis) -> dict:
        """Prepare data context for LLM prompt."""
        return {
            "team_name": team.name,
            "region": team.region,
            "players": [{"nickname": p.nickname, "country": p.country} for p in team.players],
            "matches_analyzed": analysis.matches_analyzed,
            "date_range": analysis.date_range,
            "win_rate": f"{analysis.win_rate * 100:.1f}%",
            "map_win_rates": {k: f"{v * 100:.1f}%" for k, v in analysis.map_win_rates.items()},
            "agent_tendencies": analysis.agent_tendencies.model_dump() if analysis.agent_tendencies else {},
            "site_tendencies": {k: v.model_dump() for k, v in analysis.site_tendencies.items()},
            "economy_patterns": analysis.economy_patterns.model_dump() if analysis.economy_patterns else {},
            "player_stats": analysis.player_stats,
            "exploitable_patterns": analysis.exploitable_patterns.model_dump() if analysis.exploitable_patterns else {},
        }
    
    async def _generate_section(
        self,
        section_type: str,
        context: dict,
        instruction: str
    ) -> str:
        """Generate a single report section using LLM."""
        if self.provider == "template":
            return self._template_section(section_type, context)
        
        # Prepare a more focused context for the LLM
        focused_context = {
            "team_name": context.get("team_name"),
            "region": context.get("region"),
            "matches_analyzed": context.get("matches_analyzed"),
            "win_rate": context.get("win_rate"),
            "map_win_rates": context.get("map_win_rates"),
        }
        
        # Add section-specific data
        if section_type == "executive_summary":
            focused_context["agent_tendencies"] = context.get("agent_tendencies", {})
            focused_context["economy_patterns"] = context.get("economy_patterns", {})
            focused_context["exploitable_patterns"] = context.get("exploitable_patterns", {})
            # Add top 3 players
            player_stats = context.get("player_stats", {})
            top_players = sorted(player_stats.items(), key=lambda x: (x[1].get('kd_ratio', 0) if isinstance(x[1], dict) else getattr(x[1], 'kd_ratio', 0)), reverse=True)[:3]
            focused_context["top_players"] = {k: {"kd": v.get('kd_ratio') if isinstance(v, dict) else getattr(v, 'kd_ratio', 0), "role": v.get('primary_role') if isinstance(v, dict) else getattr(v, 'primary_role', 'Unknown'), "agent": v.get('primary_agent') if isinstance(v, dict) else getattr(v, 'primary_agent', 'Unknown')} for k, v in top_players}
        elif section_type == "agent_compositions":
            focused_context["agent_tendencies"] = context.get("agent_tendencies", {})
        elif section_type == "map_strategies":
            focused_context["site_tendencies"] = context.get("site_tendencies", {})
        elif section_type == "economy":
            focused_context["economy_patterns"] = context.get("economy_patterns", {})
        elif section_type == "players":
            focused_context["player_stats"] = context.get("player_stats", {})
        elif section_type == "exploits":
            focused_context["exploitable_patterns"] = context.get("exploitable_patterns", {})
        
        prompt = f"""Based on the following data about {context['team_name']}, {instruction}

Data:
```json
{json.dumps(focused_context, indent=2, default=str)}
```

IMPORTANT:
- Reference specific numbers and percentages from the data
- Be direct and actionable - this is for professional coaches
- Avoid generic statements - every sentence should have concrete value
- Keep paragraphs short and scannable
- Use proper VALORANT terminology"""

        try:
            logger.info(f"Generating {section_type} section with {self.provider}")
            
            if self.provider == "anthropic":
                message = self.client.messages.create(
                    model=self.settings.effective_llm_model,
                    max_tokens=1500,
                    temperature=0.7,
                    system=self.SYSTEM_PROMPT,
                    messages=[{"role": "user", "content": prompt}]
                )
                return message.content[0].text
            
            elif self.provider == "openai":
                if self.settings.is_thinking_model:
                    # Thinking models: GPT-5.2 supports system messages, o1 doesn't
                    model_name = self.settings.effective_llm_model.lower()
                    if model_name.startswith("gpt-5.2"):
                        # GPT-5.2-thinking supports system messages
                        try:
                            response = self.client.chat.completions.create(
                                model=self.settings.effective_llm_model,
                                messages=[
                                    {"role": "system", "content": self.SYSTEM_PROMPT},
                                    {"role": "user", "content": prompt}
                                ],
                                reasoning_effort="high"
                            )
                        except TypeError:
                            # SDK doesn't support reasoning_effort
                            logger.warning("SDK doesn't support reasoning_effort, using default")
                            response = self.client.chat.completions.create(
                                model=self.settings.effective_llm_model,
                                messages=[
                                    {"role": "system", "content": self.SYSTEM_PROMPT},
                                    {"role": "user", "content": prompt}
                                ]
                            )
                    else:
                        # o1 models: combine system and user into user message
                        combined_prompt = f"{self.SYSTEM_PROMPT}\n\n{prompt}"
                        try:
                            response = self.client.chat.completions.create(
                                model=self.settings.effective_llm_model,
                                messages=[{"role": "user", "content": combined_prompt}],
                                reasoning_effort="high"
                            )
                        except TypeError:
                            logger.warning("SDK doesn't support reasoning_effort, using default")
                            response = self.client.chat.completions.create(
                                model=self.settings.effective_llm_model,
                                messages=[{"role": "user", "content": combined_prompt}]
                            )
                else:
                    response = self.client.chat.completions.create(
                        model=self.settings.effective_llm_model,
                        messages=[
                            {"role": "system", "content": self.SYSTEM_PROMPT},
                            {"role": "user", "content": prompt}
                        ],
                        max_tokens=1500,
                        temperature=0.7
                    )
                return response.choices[0].message.content
                
        except Exception as e:
            logger.error(f"LLM generation failed for {section_type}: {e}")
            return self._template_section(section_type, context)
    
    async def _generate_key_insights(self, context: dict) -> list[str]:
        """Generate bullet-point key insights using LLM."""
        import random
        import time
        
        # Prepare specific data points for more targeted insights
        agent_tendencies = context.get('agent_tendencies', {})
        top_agents = sorted(
            agent_tendencies.get('agent_pick_rates', {}).items(),
            key=lambda x: x[1],
            reverse=True
        )[:5]
        top_agents_str = ", ".join([f"{a[0]} ({a[1]*100:.0f}%)" for a in top_agents]) if top_agents else "N/A"
        
        # Get flex picks
        flex_picks = agent_tendencies.get('flex_picks', [])
        flex_str = ", ".join(flex_picks[:3]) if flex_picks else "None"
        
        # Map analysis
        map_data = context.get('map_win_rates', {})
        site_data = context.get('site_tendencies', {})
        
        map_details = []
        for map_name, win_rate in map_data.items():
            site_info = site_data.get(map_name, {})
            atk_wr = site_info.get('attack_rounds_won', 0) / max(site_info.get('attack_rounds_played', 1), 1) * 100
            def_wr = site_info.get('defense_rounds_won', 0) / max(site_info.get('defense_rounds_played', 1), 1) * 100
            games = site_info.get('games_played', 0)
            map_details.append(f"{map_name}: {win_rate} overall, {atk_wr:.0f}% ATK, {def_wr:.0f}% DEF ({games} games)")
        
        best_map = max(map_data.items(), key=lambda x: float(x[1].replace('%', '')))[0] if map_data else "N/A"
        worst_map = min(map_data.items(), key=lambda x: float(x[1].replace('%', '')))[0] if map_data else "N/A"
        
        # Economy details
        eco = context.get('economy_patterns', {})
        pistol_wr = eco.get('pistol_win_rate', 0) * 100
        r2_conv = eco.get('round2_conversion_rate', 0) * 100
        force_rate = eco.get('force_buy_rate', 0) * 100
        eco_wr = eco.get('eco_round_win_rate', 0) * 100
        
        # Player analysis
        player_stats = context.get('player_stats', {})
        player_details = []
        for name, stats in sorted(player_stats.items(), key=lambda x: (x[1].get('kd_ratio', 0) if isinstance(x[1], dict) else getattr(x[1], 'kd_ratio', 0)), reverse=True)[:4]:
            if isinstance(stats, dict):
                role = stats.get('primary_role', 'Unknown')
                agent = stats.get('primary_agent', 'Unknown')
                kd = stats.get('kd_ratio', 0)
                kills = stats.get('kills', 0)
                deaths = stats.get('deaths', 0)
            else:
                role = getattr(stats, 'primary_role', 'Unknown')
                agent = getattr(stats, 'primary_agent', 'Unknown')
                kd = getattr(stats, 'kd_ratio', 0)
                kills = getattr(stats, 'kills', 0)
                deaths = getattr(stats, 'deaths', 0)
            player_details.append(f"{name} ({role}, {agent}): {kd:.2f} K/D ({kills}K/{deaths}D)")
        
        top_player = max(player_stats.items(), key=lambda x: (x[1].get('kd_ratio', 0) if isinstance(x[1], dict) else getattr(x[1], 'kd_ratio', 0)))[0] if player_stats else "N/A"
        
        # Exploitable patterns
        exploits = context.get('exploitable_patterns', {})
        timing_tells = exploits.get('timing_tells', [])[:2]
        weak_sites = exploits.get('weak_sites', {})
        
        # Use timestamp-based seed for true randomness
        random_seed = int(time.time() * 1000) % 100000
        
        # Randomly select focus areas for variety
        focus_options = [
            'aggressive early-round plays',
            'defensive site holds',
            'economic warfare',
            'individual player shutdowns',
            'map control and rotations',
            'utility usage patterns',
            'post-plant situations',
            'retake scenarios'
        ]
        insight_focus = random.choice(focus_options)
        
        # Randomly select perspective
        perspective = random.choice([
            'as the attacking team',
            'as the defending team',
            'in close rounds',
            'in eco situations'
        ])
        
        # If template mode, generate dynamic insights from data
        if self.provider == "template":
            return self._template_insights(context)
        
        prompt = f"""You are an elite VALORANT esports analyst. Generate 6 UNIQUE tactical insights for a team preparing to face {context['team_name']}.

TIMESTAMP: {random_seed}
FOCUS: {insight_focus}
PERSPECTIVE: {perspective}

=== OPPONENT DATA ===

AGENTS:
- Core: {top_agents_str}
- Flex Pool: {flex_str}

MAPS ({len(map_data)} played):
{chr(10).join(map_details[:5]) if map_details else 'Limited data'}
- Best: {best_map} | Worst: {worst_map}

ECONOMY:
Pistol: {pistol_wr:.0f}% | R2 Convert: {r2_conv:.0f}% | Force: {force_rate:.0f}% | Eco Win: {eco_wr:.0f}%

PLAYERS:
{chr(10).join(player_details) if player_details else 'No data'}

PATTERNS:
{', '.join(timing_tells) if timing_tells else 'None'} | Weak: {', '.join([f'{m}-{s}' for m,s in list(weak_sites.items())[:2]]) if weak_sites else 'None'}

=== GENERATE 6 INSIGHTS ===

Requirements:
- Each insight MUST use specific numbers/percentages from above
- Start with ACTION VERB: Target, Exploit, Force, Ban, Counter, Punish, Pressure, Stack
- Focus on: {insight_focus}
- Max 20 words each
- Be creative and varied - no two insights should sound similar
- Include at least one insight about: economy, player, map, agents

Format: Return ONLY 6 lines starting with "- " (no headers, no numbering)"""

        try:
            logger.info(f"Generating key insights with {self.provider} (seed: {random_seed}, focus: {insight_focus})")
            
            if self.provider == "anthropic":
                message = self.client.messages.create(
                    model=self.settings.effective_llm_model,
                    max_tokens=600,
                    temperature=1.0,  # Max creativity for unique insights
                    messages=[{"role": "user", "content": prompt}]
                )
                text = message.content[0].text
            elif self.provider == "openai":
                if self.settings.is_thinking_model:
                    # Thinking models don't support temperature, penalties, or max_tokens
                    try:
                        response = self.client.chat.completions.create(
                            model=self.settings.effective_llm_model,
                            messages=[{"role": "user", "content": prompt}],
                            reasoning_effort="low"  # Low for faster insights
                        )
                    except TypeError:
                        logger.warning("SDK doesn't support reasoning_effort, using default")
                        response = self.client.chat.completions.create(
                            model=self.settings.effective_llm_model,
                            messages=[{"role": "user", "content": prompt}]
                        )
                else:
                    response = self.client.chat.completions.create(
                        model=self.settings.effective_llm_model,
                        messages=[{"role": "user", "content": prompt}],
                        max_tokens=600,
                        temperature=1.0,  # Max creativity for unique insights
                        presence_penalty=0.6,  # Encourage diverse outputs
                        frequency_penalty=0.4  # Discourage repetition
                    )
                text = response.choices[0].message.content
            else:
                return self._template_insights(context)
            
            logger.info(f"LLM key insights response: {text[:200]}...")
            
            # Parse bullet points - handle various formats
            lines = text.strip().split("\n")
            insights = []
            for line in lines:
                line = line.strip()
                if line.startswith("-"):
                    insight = line.lstrip("- ").strip()
                    if insight and len(insight) > 10:
                        insights.append(insight)
                elif line.startswith("•"):
                    insight = line.lstrip("• ").strip()
                    if insight and len(insight) > 10:
                        insights.append(insight)
                elif line and line[0].isdigit() and "." in line[:3]:
                    insight = line.split(".", 1)[1].strip()
                    if insight and len(insight) > 10:
                        insights.append(insight)
            
            if len(insights) >= 3:
                logger.info(f"Generated {len(insights)} key insights successfully")
                return insights[:6]
            
            logger.warning(f"Only {len(insights)} insights parsed, falling back to template")
            return self._template_insights(context)
            
        except Exception as e:
            logger.error(f"Key insights generation failed: {e}")
            return self._template_insights(context)
    
    def _template_section(self, section_type: str, context: dict) -> str:
        """Generate template-based section when LLM is unavailable."""
        team = context["team_name"]
        
        templates = {
            "executive_summary": f"""## Executive Summary

{team} is a {context.get('region') or 'professional'} team with a {context.get('win_rate', 'N/A')} win rate across their {context.get('date_range', 'recent matches')}.

Based on this match data, the team shows consistent patterns in their agent compositions and site preferences. Key areas to exploit include their predictable rotations and economic tendencies.

This report provides detailed breakdowns of their strategies across all maps, player tendencies, and specific counter-strategies to employ.""",

            "agent_compositions": f"""### Agent Selection Patterns

**Pick Rates:**
{self._format_pick_rates(context.get('agent_tendencies', {}).get('agent_pick_rates', {}))}

**Common Compositions:**
The team frequently runs variations of their core composition, with flexibility in the duelist and initiator roles.

**Flex Picks:**
{', '.join(context.get('agent_tendencies', {}).get('flex_picks', ['None identified']))}""",

            "map_strategies": f"""### Map Pool Analysis

**Win Rates by Map:**
{self._format_map_rates(context.get('map_win_rates', {}))}

**Site Preferences:**
Analysis shows varied site attack preferences depending on the map and opponent setup.""",

            "economy": f"""### Economic Tendencies

**Pistol Rounds:**
- Win Rate: {context.get('economy_patterns', {}).get('pistol_win_rate', 0) * 100:.1f}%

**Force Buy Behavior:**
- Force Rate: {context.get('economy_patterns', {}).get('force_buy_rate', 0) * 100:.1f}%

**Post-Pistol:**
- Round 2 Conversion: {context.get('economy_patterns', {}).get('round2_conversion_rate', 0) * 100:.1f}%""",

            "players": f"""### Player Profiles

{self._format_player_profiles(context.get('player_stats', {}))}""",

            "exploits": f"""### Exploitable Patterns

**Timing Tells:**
{self._format_list(context.get('exploitable_patterns', {}).get('timing_tells', []))}

**Counter-Strategies:**
{self._format_list(context.get('exploitable_patterns', {}).get('counter_strategies', []))}"""
        }
        
        return templates.get(section_type, "Section content unavailable.")
    
    def _template_insights(self, context: dict) -> list[str]:
        """Generate dynamic template insights based on actual data."""
        import random
        import time
        
        insights = []
        team_name = context.get('team_name', 'Team')
        
        # Use timestamp for variety in template selection
        random.seed(int(time.time()))
        
        # Agent composition insights - varied phrasing
        agent_rates = context.get('agent_tendencies', {}).get('agent_pick_rates', {})
        if agent_rates:
            sorted_agents = sorted(agent_rates.items(), key=lambda x: x[1], reverse=True)
            if len(sorted_agents) >= 2:
                top_agent = sorted_agents[0]
                second_agent = sorted_agents[1]
                agent_templates = [
                    f"Counter their {top_agent[0]} ({top_agent[1]*100:.0f}%) and {second_agent[0]} ({second_agent[1]*100:.0f}%) core",
                    f"Target {top_agent[0]} players - {top_agent[1]*100:.0f}% pick rate makes them predictable",
                    f"Draft counters for {top_agent[0]}/{second_agent[0]} combo ({top_agent[1]*100:.0f}%/{second_agent[1]*100:.0f}%)",
                    f"Exploit {top_agent[0]} dependency - {top_agent[1]*100:.0f}% of rounds feature this agent"
                ]
                insights.append(random.choice(agent_templates))
        
        # Map pick/ban insight - varied phrasing
        map_rates = context.get('map_win_rates', {})
        if map_rates:
            sorted_maps = sorted(map_rates.items(), key=lambda x: float(x[1].replace('%', '')))
            if sorted_maps:
                worst_map = sorted_maps[0]
                best_map = sorted_maps[-1]
                map_templates = [
                    f"Pick {worst_map[0]} ({worst_map[1]} WR) - ban {best_map[0]} ({best_map[1]} WR)",
                    f"Force them onto {worst_map[0]} - only {worst_map[1]} win rate there",
                    f"Ban {best_map[0]} immediately ({best_map[1]} WR), fight on {worst_map[0]}",
                    f"Map advantage on {worst_map[0]} ({worst_map[1]}) - avoid {best_map[0]} ({best_map[1]})"
                ]
                insights.append(random.choice(map_templates))
        
        # Economy insights - varied based on actual numbers
        eco = context.get('economy_patterns', {})
        pistol_wr = eco.get('pistol_win_rate', 0)
        r2_conv = eco.get('round2_conversion_rate', 0)
        force_rate = eco.get('force_buy_rate', 0)
        eco_wr = eco.get('eco_round_win_rate', 0)
        
        eco_templates = []
        if pistol_wr > 0.55:
            eco_templates.append(f"Prioritize pistol utility - they win {pistol_wr*100:.0f}% of pistols")
            eco_templates.append(f"Danger on pistols ({pistol_wr*100:.0f}% WR) - consider 5-man coordinated plays")
        elif pistol_wr < 0.45:
            eco_templates.append(f"Punish weak pistols ({pistol_wr*100:.0f}% WR) - aggressive early round")
        
        if r2_conv < 0.5 and r2_conv > 0:
            eco_templates.append(f"Force Round 2 - only {r2_conv*100:.0f}% conversion after pistol wins")
        
        if force_rate > 0.3:
            eco_templates.append(f"Prepare anti-force setups - {force_rate*100:.0f}% force rate is exploitable")
        
        if eco_wr > 0.15:
            eco_templates.append(f"Respect their eco rounds - {eco_wr*100:.0f}% eco win rate is dangerous")
        elif eco_wr < 0.1 and eco_wr > 0:
            eco_templates.append(f"Push aggressively on eco rounds - only {eco_wr*100:.0f}% success rate")
        
        if eco_templates:
            insights.extend(random.sample(eco_templates, min(2, len(eco_templates))))
        
        # Player-specific insights - varied
        player_stats = context.get('player_stats', {})
        if player_stats:
            sorted_players = sorted(player_stats.items(), key=lambda x: (x[1].get('kd_ratio', 0) if isinstance(x[1], dict) else getattr(x[1], 'kd_ratio', 0)), reverse=True)
            if sorted_players:
                star = sorted_players[0]
                star_name = star[0]
                star_kd = star[1].get('kd_ratio', 0)
                star_agent = star[1].get('primary_agent', 'Unknown')
                star_role = star[1].get('primary_role', 'Unknown')
                
                player_templates = [
                    f"Shutdown {star_name} ({star_kd:.2f} K/D on {star_agent}) in early round",
                    f"Focus {star_name} - {star_kd:.2f} K/D as {star_role} makes them the carry",
                    f"Trade {star_name} immediately - {star_kd:.2f} K/D {star_role} is their win condition",
                    f"Deny {star_name}'s {star_agent} impact ({star_kd:.2f} K/D) with utility"
                ]
                insights.append(random.choice(player_templates))
                
                # Second best player insight sometimes
                if len(sorted_players) >= 2 and random.random() > 0.5:
                    second = sorted_players[1]
                    insights.append(f"Secondary threat: {second[0]} ({second[1].get('kd_ratio', 0):.2f} K/D) on {second[1].get('primary_agent', 'Unknown')}")
        
        # Site tendency insight
        site_data = context.get('site_tendencies', {})
        for map_name, data in site_data.items():
            if data.get('preferred_sites'):
                pref_site = list(data.get('preferred_sites', {}).keys())[0] if data.get('preferred_sites') else None
                if pref_site:
                    site_templates = [
                        f"Stack {pref_site} on {map_name} - their preferred execute site",
                        f"Heavy {pref_site} presence on {map_name} - anticipate their default"
                    ]
                    insights.append(random.choice(site_templates))
                    break
        
        # Side strength insight
        total_atk_won = sum(s.get('attack_rounds_won', 0) for s in site_data.values())
        total_atk_played = sum(s.get('attack_rounds_played', 1) for s in site_data.values()) or 1
        total_def_won = sum(s.get('defense_rounds_won', 0) for s in site_data.values())
        total_def_played = sum(s.get('defense_rounds_played', 1) for s in site_data.values()) or 1
        
        atk_wr = total_atk_won / total_atk_played * 100
        def_wr = total_def_won / total_def_played * 100
        
        if atk_wr > def_wr + 10:
            side_templates = [
                f"Strong attackers ({atk_wr:.0f}% ATK vs {def_wr:.0f}% DEF) - deny their tempo",
                f"Attack-sided team ({atk_wr:.0f}%) - slow them down, force retakes"
            ]
            insights.append(random.choice(side_templates))
        elif def_wr > atk_wr + 10:
            side_templates = [
                f"Defense-heavy ({def_wr:.0f}% DEF vs {atk_wr:.0f}% ATK) - use fast executes",
                f"Weak on attack ({atk_wr:.0f}%) - play aggressive CT sides"
            ]
            insights.append(random.choice(side_templates))
        
        # Shuffle for variety
        random.shuffle(insights)
        return insights[:6]
    
    def _format_pick_rates(self, rates: dict) -> str:
        """Format agent pick rates as markdown."""
        if not rates:
            return "No data available"
        sorted_rates = sorted(rates.items(), key=lambda x: x[1], reverse=True)
        return "\n".join([f"- {agent}: {rate*100:.1f}%" for agent, rate in sorted_rates[:8]])
    
    def _format_map_rates(self, rates: dict) -> str:
        """Format map win rates as markdown."""
        if not rates:
            return "No data available"
        return "\n".join([f"- {map_name}: {rate}" for map_name, rate in rates.items()])
    
    def _format_player_profiles(self, stats: dict) -> str:
        """Format player profiles as markdown."""
        if not stats:
            return "No player data available"
        
        profiles = []
        for player_id, data in list(stats.items())[:5]:
            profiles.append(f"""**{player_id}**
- Role: {data.get('primary_role', 'Unknown')}
- K/D: {data.get('kd_ratio', 0):.2f}
- Primary Agent: {data.get('primary_agent', 'Unknown')}""")
        
        return "\n\n".join(profiles)
    
    def _format_list(self, items: list) -> str:
        """Format list as markdown bullets."""
        if not items:
            return "- None identified"
        return "\n".join([f"- {item}" for item in items])
