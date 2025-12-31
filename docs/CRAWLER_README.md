# Game Crawler - Thu thập Steam Games có Lua Support

## Tổng quan
Hệ thống crawler tự động thu thập danh sách Steam games hỗ trợ Lua scripting từ nhiều nguồn.

## Các nguồn dữ liệu

### 1. Known Games Database (`known_games.py`)
- 65+ games phổ biến có Lua support
- Bao gồm: Garry's Mod, Arma 3, RimWorld, Cities Skylines, GTA V, v.v.
- Cập nhật thủ công từ community knowledge

### 2. Steam API
- `ISteamApps/GetAppList` - Toàn bộ apps (~150k+)
- `appdetails` - Chi tiết từng game
- Tìm kiếm keywords: lua, modding, scripting, workshop

### 3. SteamDB (Manual/Scraping)
- Filter theo scripting support
- Cần implement scraping hoặc manual update

### 4. GitHub
- Search repositories: "steam lua mod"
- Parse AppIDs từ mod repositories

### 5. PCGamingWiki
- Community-maintained modding info
- Cần API integration

## Cài đặt

```bash
pip install -r requirements_crawler.txt
```

## Sử dụng

### Quick Mode (Nhanh - Chỉ known games)
```bash
python advanced_crawler.py
```

### Full Scan (Chậm - Quét Steam API)
Sửa trong `advanced_crawler.py`:
```python
# Thay đổi giới hạn
for i, app in enumerate(apps[:10000]):  # Tăng từ 1000
```

### Merge với danh sách cũ
```bash
python merge_games.py
```

## Output Files

- `games_list.csv` - Format chuẩn (AppID, Files, Types, Paths)
- `games_with_names.csv` - Có tên game
- `games_list_merged.csv` - Merged với danh sách cũ
- `game_cache.json` - Cache để tránh re-fetch

## Cấu trúc Files

```
discord-lua-bot/
├── game_crawler.py          # Basic crawler
├── advanced_crawler.py      # Advanced với caching
├── known_games.py           # Database games đã biết
├── merge_games.py           # Merge tool
├── games_list.csv           # Output chính
├── games_with_names.csv     # Output có tên
└── game_cache.json          # Cache
```

## Mở rộng

### Thêm games mới vào known_games.py
```python
KNOWN_LUA_GAMES = {
    123456: "New Game Name",
    # ...
}
```

### Thêm nguồn mới
Implement trong `AdvancedGameCrawler`:
```python
def fetch_from_new_source(self):
    # Your implementation
    return [appid1, appid2, ...]
```

## Rate Limiting

- Steam API: 1 request/giây
- GitHub API: 60 requests/giờ (không auth)
- Sử dụng cache để giảm requests

## Cập nhật định kỳ

Tạo scheduled task:
```bash
# Windows Task Scheduler
# Chạy mỗi tuần: python advanced_crawler.py
```

## Known Issues

- Steam API không có filter trực tiếp cho Lua
- Cần verify thủ công một số games
- Rate limiting có thể làm chậm full scan

## TODO

- [ ] Implement SteamDB scraping
- [ ] PCGamingWiki API integration
- [ ] Auto-verify Lua support
- [ ] Web UI để browse games
- [ ] Discord bot integration
- [ ] Scheduled auto-update

## Stats hiện tại

- **65 games** trong known database
- **Source Engine**: 10 games
- **Strategy/Sim**: 15+ games
- **Survival/Sandbox**: 10+ games
- **RPG/Action**: 20+ games

## Đóng góp

Để thêm games mới:
1. Verify game có Lua support
2. Thêm vào `known_games.py`
3. Run `python advanced_crawler.py`
4. Submit PR

## License

MIT
