# Quick Start Guide - Game Crawler

## 65 Games with Lua Support Created!

### Important Files:
- `games_list_final.csv` - Main list (standard format)
- `games_list_final_names.csv` - With game names
- `games_list_final.json` - JSON format

### Usage:

#### 1. Quick Run (65 pre-configured games):
```bash
python master_crawler.py
```

#### 2. Add More Games:
Add to `known_games.py`:
```python
KNOWN_LUA_GAMES = {
    123456: "Your Game Name",
    # ...
}
```

#### 3. Auto Update:
```bash
python auto_update.py
```

### Data Sources:

1. **Known Games** (65 games)
   - Garry's Mod, Arma 3, RimWorld
   - GTA V, Cities Skylines, Terraria
   - Source Engine games
   - Strategy games (Civ, Stellaris, HOI4)

2. **Steam API** (expandable)
   - Search by keywords: lua, modding, scripting
   - Rate limit: 1 req/s

3. **Workshop** (15+ games)
   - Games with Workshop support
   - Community mods

4. **GitHub** (auto search)
   - Lua mod repositories

### Expanding Coverage:

#### Add from SteamDB:
1. Go to https://steamdb.info
2. Search for "lua" or "modding"
3. Copy AppIDs
4. Add to `known_games.py`

#### Add from PCGamingWiki:
1. Go to https://www.pcgamingwiki.com
2. Find games with "Lua scripting"
3. Get AppID from Steam link

### Current Stats:
- **Total: 65 games**
- Source Engine: 10 games
- Strategy/Sim: 15 games
- Survival: 10 games
- RPG/Action: 20 games
- Other: 10 games

### Scheduled Run:
Windows Task Scheduler:
```
Program: python
Arguments: master_crawler.py
Start in: e:\bot ngu luatool1.1\discord-lua-bot
Trigger: Weekly
```

### Troubleshooting:
- **Encoding Error**: Fixed (using ASCII instead of Unicode)
- **Rate limit**: Added `time.sleep()` in crawler
- **Cache**: Delete `game_cache.json` to refresh
