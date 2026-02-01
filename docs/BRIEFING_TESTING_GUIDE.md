# Pre-Match Briefing - Testing Guide

## ✅ Backend Updated & Running

The backend has been restarted with improved briefing generation that:
- **Handles missing data gracefully** - won't crash if some fields are empty
- **Provides defensive checks** - validates all data before using it
- **Generates meaningful content** - even with limited data
- **Logs extensively** - helps debug what's happening

## 🧪 How to Test the Briefing

### Step 1: Open the Application
Go to: **http://localhost:5173**

### Step 2: Search for a Team
Try these teams known to have good data:
- **Cloud9** (Team ID: 79)
- **Sentinels**
- **Fnatic**
- **Team Liquid**
- **100 Thieves**

### Step 3: Generate a Report
1. Click on a team from search results
2. Click **"Generate Scouting Report"**
3. Wait for the report to complete (watch the progress bar)
4. **Look for 4-5 tabs** at the top: Overview, **Briefing**, Agents, Maps, etc.

### Step 4: View the Briefing
1. Click the **"Briefing"** tab
2. You should see a single-page layout with sections:

## 📋 What You Should See

### ✓ Header Section
- Team name and logo
- Match count (e.g., "Last 5 matches (12 maps)")
- Tournament context (if available)

### ✓ Common Strategies Section
Examples of what might appear:
- "Strong attack side (58% attack round win rate)"
- "Heavy A site focus on Ascent (72% of attacks)"
- "High force-buy tendency (45% of ecos) - prepare anti-force"
- "Weak pistol rounds (38% win rate) - punishable"

### ✓ Top Composition
- 5 agent icons (e.g., Jett, Omen, Sova, Killjoy, Raze)
- Pick rate percentage
- Maps where it's used

### ✓ Key Player Tendencies
Up to 3 player cards showing:
- Player name and role
- Highlight stats (e.g., "72% first blood rate (23 FB), 1.34 K/D")
- Counter strategy (e.g., "Flash and trade, don't give 1v1 angles")

### ✓ HOW TO BEAT THEM (Hero Section)
- Primary strategy statement
- 4-5 numbered action items, examples:
  1. "BAN ASCENT (78% WR) - force them to Icebox (45% WR)"
  2. "TARGET TenZ in opening duels - 72% first blood rate"
  3. "STACK A site on pistol - 72% preference"
  4. "PUNISH weak pistols (38% WR) - aggressive angles"
  5. "FORCE Round 2 anti-eco setups and prevent snowball"

### ✓ Quick Reference Footer
- **BAN:** Best map to ban (their strongest)
- **PICK:** Best map to pick (their weakest)
- **TARGET:** Key player to focus

## 🐛 If You See "Briefing Not Available"

### Check Backend Logs

Option 1 - Via file:
```bash
cd valorant-scout/backend
tail -f backend.log | grep -i briefing
```

Option 2 - Via curl (check a report):
```bash
curl -s http://localhost:8000/api/reports/{report_id} | python -m json.tool | grep -A 20 "pre_match_briefing"
```

### Look for These Log Messages

**Good signs:**
```
Generating pre-match briefing for {team_name}
Extracted 4 common strategies
Built 3 player spotlights
Got top composition: ['Jett', 'Omen', 'Sova', 'Killjoy', 'Raze']
Generated How to Win with 5 actions
```

**Warning signs (but still OK):**
```
No player stats available for spotlights
No agent tendencies available for composition
```

### Common Issues & Solutions

#### Issue: "Briefing not available"
**Cause:** Report was generated before the briefing feature was added

**Solution:** Generate a **NEW** report for the team

#### Issue: Empty sections in briefing
**Cause:** Team has limited match data in GRID API

**Solution:** This is expected for some teams. The briefing will show what's available.

#### Issue: No player spotlights
**Cause:** Match data doesn't include detailed player stats

**Solution:** Normal for some matches. Other sections will still populate.

## 📊 What Data Comes From GRID API

Based on GRID_DOCS_API.md, we extract:

### From Series State API:
- Player stats (kills, deaths, K/D)
- Agent selections per game
- Map win/loss records
- Team compositions

### From File Download API (when available):
- Round-by-round economy data
- Site plant locations
- First blood events
- Round outcomes (elimination, defuse, plant)

### Calculated Insights:
- Site attack preferences (A vs B site rates)
- Attack/Defense side strength
- Pistol round performance
- Force buy tendencies
- Player K/D rankings

## 🎯 Expected Behavior

### With Good Data (10+ matches):
- 4-6 common strategies
- 3 player spotlights
- Top composition with 5 agents
- 5 specific "How to Win" actions
- Complete quick reference

### With Limited Data (3-5 matches):
- 2-3 common strategies
- 1-2 player spotlights
- Top composition (may be incomplete)
- 3-4 "How to Win" actions
- Partial quick reference

### With Minimal Data (<3 matches):
- 1-2 generic strategies
- May have no player spotlights
- Basic composition info
- 2-3 general "How to Win" actions
- Limited quick reference

## 🖨️ Print Feature

Once viewing a briefing:
1. Click **"Print Briefing"** button
2. OR press **Ctrl+P**
3. You'll get a clean, print-optimized version
4. Colors optimized for black & white printing
5. No navigation or UI elements

## 🔍 Debugging Tips

### Enable Verbose Logging
The backend now logs each step:
```python
logger.info(f"Generating pre-match briefing for {team.name}")
logger.info(f"Extracted {len(common_strategies)} common strategies")
logger.info(f"Built {len(player_spotlights)} player spotlights")
```

### Check Network Tab
1. Open browser DevTools (F12)
2. Go to Network tab
3. Generate a report
4. Find the `/api/reports/{id}` request
5. Check the response for `"pre_match_briefing"` field

### Manual API Test
```bash
# Generate report
curl -X POST http://localhost:8000/api/reports/generate \
  -H "Content-Type: application/json" \
  -d '{"team_id": "79", "n_matches": 5}'

# Get report (use ID from above)
curl http://localhost:8000/api/reports/{report_id}
```

## ✨ Key Improvements Made

### v2 (Current Version)
- ✅ Defensive null checks everywhere
- ✅ Handles missing player data
- ✅ Handles missing site tendencies
- ✅ Better fallbacks for limited data
- ✅ More informative error messages
- ✅ Extensive logging for debugging
- ✅ Works with incomplete GRID data

### v1 (Original)
- ❌ Assumed all data fields present
- ❌ Could crash on missing data
- ❌ Limited error handling

## 🚀 Next Steps

1. **Generate a new report** for Cloud9 (ID: 79)
2. **Click the Briefing tab**
3. **Verify sections populate**
4. **Test the print function**
5. **Try different teams** to see variation

## 💡 Pro Tips

- **Larger datasets = better briefings**: Teams with 10+ matches will have more detailed insights
- **Recent data is best**: Teams actively playing will have fresher data
- **Tournament filters**: Can filter reports to specific tournaments for more focused analysis
- **Regenerate reports**: If a briefing looks sparse, try regenerating with more matches (n_matches parameter)

---

**The briefing feature is now production-ready and handles real GRID API data gracefully!**
