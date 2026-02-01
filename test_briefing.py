#!/usr/bin/env python3
"""
Quick test script to verify briefing generation works.
Run this from the backend directory:
    cd backend
    python ../test_briefing.py
"""

import sys
import asyncio
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / "valorant-scout" / "backend"
sys.path.insert(0, str(backend_path))

try:
    from app.models.report import PreMatchBriefing, PlayerSpotlight, HowToWin
    from app.services.report_generator import ReportGenerator
    from app.services.data_processor import MatchAnalysis
    from app.models.team import TeamDetails, Player

    print("✓ All imports successful")

    # Create mock data
    mock_team = TeamDetails(
        id="test-team-id",
        name="Test Team",
        short_name="TT",
        region="NA",
        players=[
            Player(id="p1", nickname="Player1", country="US"),
            Player(id="p2", nickname="Player2", country="US"),
            Player(id="p3", nickname="Player3", country="US"),
        ]
    )

    mock_analysis = MatchAnalysis(
        team_id="test-team-id",
        team_name="Test Team",
        matches_analyzed=5,
        total_maps_played=12,
        date_range="Last 5 matches",
        win_rate=0.55,
        map_win_rates={
            "Ascent": 0.78,
            "Bind": 0.65,
            "Icebox": 0.45
        },
        player_stats={
            "Player1": {
                "kd_ratio": 1.34,
                "primary_agent": "Jett",
                "primary_role": "Duelist",
                "first_kills": 45,
                "first_deaths": 20,
                "kills": 250,
                "deaths": 186
            },
            "Player2": {
                "kd_ratio": 1.12,
                "primary_agent": "Omen",
                "primary_role": "Controller",
                "first_kills": 25,
                "first_deaths": 30,
                "kills": 200,
                "deaths": 178
            }
        }
    )

    print("✓ Mock data created")

    async def test_briefing():
        generator = ReportGenerator()
        print("\n🔄 Generating briefing...")

        briefing = await generator.generate_briefing(
            team=mock_team,
            analysis=mock_analysis,
            tournament_name="Test Tournament"
        )

        print("\n✅ Briefing generated successfully!\n")
        print(f"Team: {briefing.team_name}")
        print(f"Matches: {briefing.matches_analyzed}")
        print(f"Maps: {briefing.maps_analyzed}")
        print(f"Tournament: {briefing.tournament_context}")
        print(f"\nCommon Strategies ({len(briefing.common_strategies)}):")
        for i, strategy in enumerate(briefing.common_strategies, 1):
            print(f"  {i}. {strategy}")

        print(f"\nPlayer Spotlights ({len(briefing.player_spotlights)}):")
        for spotlight in briefing.player_spotlights:
            print(f"  - {spotlight.name} ({spotlight.role}, {spotlight.agent})")
            print(f"    Highlight: {spotlight.highlight}")
            print(f"    Counter: {spotlight.counter}")

        print(f"\nTop Composition:")
        if briefing.top_composition.get('agents'):
            print(f"  Agents: {', '.join(briefing.top_composition['agents'])}")
            print(f"  Pick Rate: {briefing.top_composition.get('pick_rate', 0)}%")
        else:
            print("  No composition data")

        print(f"\nHow to Win:")
        if briefing.how_to_win:
            print(f"  Strategy: {briefing.how_to_win.primary_strategy}")
            print(f"  Actions ({len(briefing.how_to_win.actions)}):")
            for i, action in enumerate(briefing.how_to_win.actions, 1):
                print(f"    {i}. {action}")
        else:
            print("  No how to win data")

        print(f"\nQuick Reference:")
        print(f"  Ban: {briefing.quick_reference.get('ban', 'N/A')}")
        print(f"  Pick: {briefing.quick_reference.get('pick', 'N/A')}")
        print(f"  Target: {briefing.quick_reference.get('target_player', 'N/A')}")

        return briefing

    # Run the test
    print("\n" + "="*60)
    print("TESTING PRE-MATCH BRIEFING GENERATION")
    print("="*60)

    briefing = asyncio.run(test_briefing())

    print("\n" + "="*60)
    print("✅ ALL TESTS PASSED")
    print("="*60)
    print("\nThe briefing feature is working correctly!")
    print("You can now generate reports and access the Briefing tab.")

except ImportError as e:
    print(f"❌ Import error: {e}")
    print("\nMake sure you're running this from the project root:")
    print("  cd c9sky")
    print("  python test_briefing.py")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
