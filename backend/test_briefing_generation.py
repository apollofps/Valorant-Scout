"""
Test script for tactical briefing generation.
Tests LLM connectivity and briefing generation with mock data.
"""
import asyncio
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent
sys.path.insert(0, str(backend_path))

from app.config import get_settings, clear_settings_cache
from app.services.report_generator import ReportGenerator
from app.models.team import TeamDetails, Player
from app.models.report import (
    AgentTendencies,
    SiteTendencies,
    EconomyPatterns,
    ExploitablePatterns,
    WeaponPatterns
)
from app.models.player import PlayerStats
from app.services.data_processor import MatchAnalysis


def create_mock_team() -> TeamDetails:
    """Create mock team data for testing."""
    return TeamDetails(
        id="test_team_123",
        name="Test Team",
        short_name="TT",
        logo_url="",
        players=[
            Player(id="p1", nickname="StarPlayer", country="US"),
            Player(id="p2", nickname="SupportPlayer", country="US")
        ]
    )


def create_mock_analysis() -> MatchAnalysis:
    """Create mock match analysis data for testing."""
    from dataclasses import field
    
    return MatchAnalysis(
        team_id="test_team_123",
        team_name="Test Team",
        matches_analyzed=5,
        total_maps_played=10,
        date_range="5 matches (10 maps)",
        win_rate=0.6,
        map_win_rates={"Ascent": 0.70, "Bind": 0.65, "Icebox": 0.40},
        player_stats={
            "player1": PlayerStats(
                player_id="player1",
                nickname="StarPlayer",
                kills=150,
                deaths=100,
                assists=50,
                kd_ratio=1.5,
                average_combat_score=200.0,
                average_damage_per_round=150.5,
                first_kill_rate=0.65,
                primary_agent="Jett",
                agents_played={"Jett": 80, "Raze": 20}
            ),
            "player2": PlayerStats(
                player_id="player2",
                nickname="SupportPlayer",
                kills=80,
                deaths=90,
                assists=120,
                kd_ratio=0.89,
                average_combat_score=180.0,
                average_damage_per_round=120.0,
                first_kill_rate=0.30,
                primary_agent="Omen",
                agents_played={"Omen": 70, "Viper": 30}
            )
        },
        agent_tendencies=AgentTendencies(
            agent_pick_rates={"Jett": 0.4, "Omen": 0.3, "Sage": 0.2, "Sova": 0.1}
        ),
        site_tendencies={
            "Ascent": SiteTendencies(
                map_name="Ascent",
                a_site_attack_rate=0.6,
                b_site_attack_rate=0.4,
                map_win_rate=0.70,
                games_played=5
            ),
            "Bind": SiteTendencies(
                map_name="Bind",
                a_site_attack_rate=0.55,
                b_site_attack_rate=0.45,
                map_win_rate=0.65,
                games_played=3
            )
        },
        economy_patterns=EconomyPatterns(
            pistol_win_rate=0.55,
            force_buy_rate=0.15,
            eco_round_frequency=0.25,
            eco_round_win_rate=0.35
        ),
        exploitable_patterns=ExploitablePatterns(
            weak_maps=["Icebox"],
            strong_maps=["Ascent", "Bind"],
            predictable_strategies=["Always stack A on pistol"],
            weak_economy_rounds=["Round 2 after pistol loss"]
        ),
        weapon_patterns=WeaponPatterns(
            preferred_weapons={"Vandal": 0.6, "Phantom": 0.3, "Operator": 0.1},
            weapon_win_rates={"Vandal": 0.58, "Phantom": 0.55, "Operator": 0.70}
        )
    )


async def test_llm_connection():
    """Test if LLM connection works."""
    print("=" * 60)
    print("TEST 1: LLM Connection Test")
    print("=" * 60)
    
    clear_settings_cache()
    settings = get_settings()
    
    print(f"[OK] Provider: {settings.llm_provider}")
    print(f"[OK] Model: {settings.effective_llm_model}")
    print(f"[OK] Is Thinking Model: {settings.is_thinking_model}")
    print(f"[OK] API Key Present: {'Yes' if settings.openai_api_key else 'No'}")
    
    generator = ReportGenerator()
    
    if not generator.client:
        print("[FAIL] LLM client not initialized")
        return False
    
    print("[OK] LLM client initialized")
    
    # Test simple LLM call
    test_prompt = "Say 'Hello, test successful' in one sentence."
    try:
        print("\nTesting LLM API call...")
        response = await generator._generate_with_llm(test_prompt)
        
        if response and len(response) > 0:
            print(f"[SUCCESS] LLM responded ({len(response)} chars)")
            print(f"   Response preview: {response[:100]}...")
            return True
        else:
            print("[FAIL] LLM returned empty response")
            return False
            
    except Exception as e:
        print(f"[FAIL] LLM call error: {str(e)}")
        return False


async def test_briefing_generation():
    """Test tactical briefing generation with mock data."""
    print("\n" + "=" * 60)
    print("TEST 2: Tactical Briefing Generation Test")
    print("=" * 60)
    
    generator = ReportGenerator()
    team = create_mock_team()
    analysis = create_mock_analysis()
    
    # Prepare context
    context = generator._prepare_context(team, analysis)
    
    print(f"[OK] Team: {team.name}")
    print(f"[OK] Matches analyzed: {analysis.matches_analyzed}")
    print(f"[OK] Maps in context: {len(context.get('site_tendencies', {}))}")
    print(f"[OK] Players in context: {len(context.get('player_stats', {}))}")
    
    try:
        print("\nGenerating tactical briefing...")
        briefing = await generator.generate_tactical_briefing(
            team=team,
            analysis=analysis,
            context=context,
            tournament_name="Test Tournament"
        )
        
        # Validate required fields
        print("\nValidating briefing structure...")
        checks = []
        
        # Team identity check
        has_team_identity = bool(briefing.team_identity and len(briefing.team_identity.strip()) > 50)
        checks.append(("Team Identity", has_team_identity, briefing.team_identity[:100] if briefing.team_identity else "EMPTY"))
        
        # Playstyle summary check
        has_playstyle = bool(briefing.playstyle_summary and len(briefing.playstyle_summary.strip()) > 50)
        checks.append(("Playstyle Summary", has_playstyle, briefing.playstyle_summary[:100] if briefing.playstyle_summary else "EMPTY"))
        
        # Map strategies check
        has_map_strategies = len(briefing.map_strategies) > 0
        map_details = f"{len(briefing.map_strategies)} maps" if briefing.map_strategies else "EMPTY"
        checks.append(("Map Strategies", has_map_strategies, map_details))
        
        # Star players check
        has_star_players = len(briefing.star_players) > 0
        player_details = f"{len(briefing.star_players)} players" if briefing.star_players else "EMPTY"
        checks.append(("Star Players", has_star_players, player_details))
        
        # Economy analysis check
        has_economy_weakness = bool(briefing.economy_weakness and len(briefing.economy_weakness.strip()) > 20)
        checks.append(("Economy Weakness", has_economy_weakness, briefing.economy_weakness[:80] if briefing.economy_weakness else "EMPTY"))
        
        has_economy_strength = bool(briefing.economy_strength and len(briefing.economy_strength.strip()) > 20)
        checks.append(("Economy Strength", has_economy_strength, briefing.economy_strength[:80] if briefing.economy_strength else "EMPTY"))
        
        # Win conditions check
        has_win_condition = bool(briefing.primary_win_condition and len(briefing.primary_win_condition.strip()) > 20)
        checks.append(("Primary Win Condition", has_win_condition, briefing.primary_win_condition[:80] if briefing.primary_win_condition else "EMPTY"))
        
        has_critical_actions = len(briefing.critical_actions) > 0
        actions_details = f"{len(briefing.critical_actions)} actions" if briefing.critical_actions else "EMPTY"
        checks.append(("Critical Actions", has_critical_actions, actions_details))
        
        has_quick_wins = len(briefing.quick_wins) > 0
        quick_wins_details = f"{len(briefing.quick_wins)} items" if briefing.quick_wins else "EMPTY"
        checks.append(("Quick Wins", has_quick_wins, quick_wins_details))
        
        # Print results
        print("\n" + "-" * 60)
        all_passed = True
        for field_name, passed, details in checks:
            status = "[PASS]" if passed else "[FAIL]"
            print(f"{status} | {field_name:25} | {details}")
            if not passed:
                all_passed = False
        
        print("-" * 60)
        
        if all_passed:
            print("\n[SUCCESS] All briefing fields populated correctly!")
            print(f"\nBriefing Summary:")
            print(f"   - Team: {briefing.team_name}")
            print(f"   - Maps: {len(briefing.map_strategies)}")
            print(f"   - Star Players: {len(briefing.star_players)}")
            print(f"   - Team Identity Length: {len(briefing.team_identity)} chars")
            return True
        else:
            print("\n[WARNING] Some briefing fields are empty or too short")
            print("   This may indicate LLM generation failed and fallback was used")
            return False
            
    except Exception as e:
        print(f"\n[FAIL] Briefing generation error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    """Run all tests."""
    print("\n" + "=" * 60)
    print("TACTICAL BRIEFING GENERATION TEST SUITE")
    print("=" * 60)
    print(f"Testing with: {get_settings().effective_llm_model}")
    print("=" * 60)
    
    # Test 1: LLM Connection
    llm_works = await test_llm_connection()
    
    if not llm_works:
        print("\n[WARNING] LLM connection failed. Briefing will use fallback content.")
        print("   Check your API key and model access.")
    
    # Test 2: Briefing Generation
    briefing_works = await test_briefing_generation()
    
    # Final summary
    print("\n" + "=" * 60)
    print("FINAL RESULTS")
    print("=" * 60)
    print(f"LLM Connection:     {'[PASS]' if llm_works else '[FAIL]'}")
    print(f"Briefing Generation: {'[PASS]' if briefing_works else '[FAIL]'}")
    print("=" * 60)
    
    if llm_works and briefing_works:
        print("\n[SUCCESS] ALL TESTS PASSED! Briefing generation is working correctly.")
        return 0
    elif briefing_works:
        print("\n[WARNING] Briefing works but using fallback content (LLM not accessible)")
        return 1
    else:
        print("\n[FAIL] TESTS FAILED. Check the errors above.")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
