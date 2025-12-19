# Quick Start Guide - Game Crawler

## Đã tạo 65 games với Lua support!

### Files quan trọng:
- `games_list_final.csv` - Danh sách chính (format chuẩn)
- `games_list_final_names.csv` - Có tên game
- `games_list_final.json` - JSON format

### Cách sử dụng:

#### 1. Chạy nhanh (65 games có sẵn):
```bash
python master_crawler.py
```

#### 2. Cập nhật thêm games:
Thêm vào `known_games.py`:
```python
KNOWN_LUA_GAMES = {
    123456: "Your Game Name",
    # ...
}
```

#### 3. Tự động cập nhật:
```bash
python auto_update.py
```

### Các nguồn dữ liệu:

1. **Known Games** (65 games)
   - Garry's Mod, Arma 3, RimWorld
   - GTA V, Cities Skylines, Terraria
   - Source Engine games
   - Strategy games (Civ, Stellaris, HOI4)

2. **Steam API** (có thể mở rộng)
   - Tìm theo keywords: lua, modding, scripting
   - Rate limit: 1 req/s

3. **Workshop** (15+ games)
   - Games có Workshop support
   - Community mods

4. **GitHub** (tự động search)
   - Lua mod repositories

### Mở rộng thêm:

#### Thêm từ SteamDB:
1. Vào https://steamdb.info
2. Search "lua" hoặc "modding"
3. Copy AppIDs
4. Thêm vào `known_games.py`

#### Thêm từ PCGamingWiki:
1. Vào https://www.pcgamingwiki.com
2. Tìm games có "Lua scripting"
3. Lấy AppID từ Steam link

### Stats hiện tại:
- **Total: 65 games**
- Source Engine: 10 games
- Strategy/Sim: 15 games
- Survival: 10 games
- RPG/Action: 20 games
- Other: 10 games

### Chạy định kỳ:
Windows Task Scheduler:
```
Program: python
Arguments: master_crawler.py
Start in: e:\bot ngu luatool1.1\discord-lua-bot
Trigger: Weekly
```

### Troubleshooting:
- Lỗi encoding: Đã fix (dùng ASCII thay Unicode)
- Rate limit: Thêm `time.sleep()` trong crawler
- Cache: Xóa `game_cache.json` để refresh
