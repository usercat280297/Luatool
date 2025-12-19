# 🎮 Discord Lua Bot - Enhanced v2.0

Bot Discord mạnh mẽ để quản lý Lua scripts, Online-Fix, và thông tin game từ Steam!

## ✨ Tính Năng Chính (v2.0)

### 🎯 Core Features
- ✅ **Tìm kiếm game theo AppID**: `!<appid>` - Xem đầy đủ thông tin game
- ✅ **Tìm kiếm game theo tên**: `!search <game name>` - Tìm AppID game
- ✅ **Danh sách game**: `!list` - Xem tất cả game có sẵn
- ✅ **Lệnh Help**: `!help` - Hướng dẫn sử dụng

### 🚀 v2.0 New Features
- ✅ **Online-Fix Smart Search** - Tìm online-fix bằng tên game tự động
- ✅ **Auto-Delete Messages** - Tin nhắn tự xóa sau 5 phút
- ✅ **SteamDB Fallback** - Nếu Steam API down, tự lấy từ SteamDB
- ✅ **GitHub Upload** - Upload files lớn (>25MB) lên GitHub tự động
- ✅ **Enhanced DRM Database** - 60+ game Denuvo được xác thực
- ✅ **Better File Matching** - Tìm file theo cả AppID và tên game
- ✅ **Improved UI** - Embed đẹp hơn với biểu tượng hữu ích

### 📊 Game Information
- 💰 **Giá game** từ Steam Store
- 🎮 **Kích thước game** (từ SteamDB/Steam)
- 📅 **Ngày phát hành**
- 📝 **Mô tả game**
- 👥 **Số DLC**
- 🌍 **Số ngôn ngữ hỗ trợ**
- ⭐ **Số lượng review**
- 🔐 **Loại DRM** (Denuvo, EAC, BattlEye, v.v.)

### 📥 File Management
- **Lua Scripts** - Tìm trong `lua_files/`
- **Crack/Fix** - Tìm trong `fix_files/`
- **Online-Fix** - Tìm trong `online_fix/` với tên game tự động
- **Download** - Nút tải xuống tích hợp trong Discord
- **GitHub Upload** - Tự động upload file lớn lên GitHub

## 🚀 Cài Đặt Nhanh

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd discord-lua-bot
npm install
```

### 2. Setup Environment Variables
Tạo file `.env`:
```env
# Discord Bot
BOT_TOKEN=your_discord_bot_token
DISCORD_TOKEN=your_discord_bot_token

# Steam API
STEAM_API_KEY=your_steam_api_key

# GitHub (for large file upload)
GITHUB_TOKEN=your_github_token
GITHUB_REPO_OWNER=your_username
GITHUB_REPO_NAME=your_repo_name

# Server Port
PORT=3000
```

### 3. Chuẩn Bị Thư Mục
```bash
mkdir -p lua_files
mkdir -p fix_files
mkdir -p online_fix
mkdir -p logs
```

### 4. Copy Lua Scripts & Online-Fix
```
lua_files/
├── 1623730.lua          # Palworld
├── 2245450.lua          # Black Myth: Wukong
└── ...

online_fix/
├── Devour online-fix.zip
├── Palworld online-fix.zip
└── ...
```

### 5. Khởi Động Bot
```bash
npm start
# hoặc
node lua_discord_bot.js
```

Bot sẽ chạy trên port 3000 và hiển thị:
```
🚀 DISCORD LUA BOT - ENHANCED VERSION 2.0
✅ Logged in as: YourBotName#0000
📊 Total available games: 2500+
🔄 Auto-delete: ENABLED (5 min)
```

## 📖 Cách Sử Dụng

### Xem Thông Tin Game
```
!1623730          # Palworld
!2245450          # Black Myth: Wukong
!2519830          # Tekken 8
```

**Kết quả:**
- Embed với đầy đủ thông tin game
- Nút tải Lua Script (nếu có)
- Nút tải Crack/Fix (nếu có)
- Nút tải Online-Fix (nếu có)
- Thông báo trạng thái DRM

### Tìm Game Theo Tên
```
!search palworld
!search tekken
!search black myth
```

**Kết quả:**
- Danh sách 5 game phù hợp
- AppID của mỗi game
- Lệnh để xem chi tiết

### Xem Danh Sách Game
```
!list
```

**Kết quả:**
- Hiển thị tất cả AppID có sẵn
- Tổng số game

### Admin Commands
```
!stats              # Xem thống kê bot
!reload             # Tải lại database
!clearcache         # Xóa cache game
!toggleautodelete   # Bật/tắt auto-delete
```

## 🔧 File Structure

```
discord-lua-bot/
├── lua_discord_bot.js              # Main bot file
├── bulk_lua_downloader.js           # Bulk downloader
├── test_online_fix_search.js        # Test script
├── package.json                     # Dependencies
├── .env                             # Environment variables
├── .gitignore                       # Git ignore
├── database.json                    # Game database (auto-generated)
├── game_info_cache.json             # Cache (auto-generated)
├── logs/                            # Log files
│   └── bot.log
├── lua_files/                       # Lua scripts
│   ├── 1623730.lua
│   └── ...
├── fix_files/                       # Crack/Fix archives
│   ├── 1623730.zip
│   └── ...
├── online_fix/                      # Online-Fix archives
│   ├── Palworld online-fix.zip
│   └── ...
└── ONLINE_FIX_GUIDE_VI.md          # Online-Fix setup guide
```

## 🔐 File Naming Convention

### Lua Scripts
```
lua_files/
├── <appid>.lua              # Ví dụ: 1623730.lua
└── <appid>/
    └── game.lua
```

### Online-Fix (IMPORTANT!)
```
online_fix/
└── <Game Name> online-fix.zip       # Ví dụ: Palworld online-fix.zip
                                     # (Tên phải khớp Steam)
```

**Quy tắc đặt tên Online-Fix:**
- ✅ `Palworld online-fix.zip`
- ✅ `Black Myth Wukong online-fix.zip`
- ✅ `Tekken 8 online-fix.zip`
- ❌ `palworld_fix.zip` (sai tên)
- ❌ `1623730-onlinefix.rar` (sai format)

Xem [ONLINE_FIX_GUIDE_VI.md](./ONLINE_FIX_GUIDE_VI.md) để biết thêm chi tiết.

## 📊 DRM Database

Bot có sẵn cơ sở dữ liệu xác thực cho 60+ game Denuvo:

### Denuvo Games
- Tekken 8
- Mortal Kombat 1
- Black Myth: Wukong
- Dragon's Dogma 2
- Persona 3 Reload
- Persona 5 Royal
- Silent Hill 2 Remake
- Star Wars Outlaws
- ... và 50+ game khác

### DRM-Free Games
- Baldur's Gate 3
- Palworld
- Valheim
- Stardew Valley
- ... và nhiều hơn nữa

Bot sẽ **tự động phát hiện** loại DRM và cảnh báo người dùng.

## 🌐 Steam API Integration

Bot tích hợp với:
- 🔗 **Steam Store API** - Thông tin game chính thức
- 📊 **SteamSpy API** - Thống kê người chơi
- 🗂️ **SteamDB** - Fallback tên game
- 🔍 **Steam Community Search** - Tìm kiếm game

## 🚀 Deployment

### Deploy to Render.com
1. Push code lên GitHub
2. Tạo New Web Service trên Render
3. Connect GitHub repository
4. Set Environment Variables
5. Deploy!

Bot sẽ:
- ✅ Tự động keep-alive (Express server)
- ✅ Ghi log tất cả hoạt động
- ✅ Xử lý errors gracefully
- ✅ Reload database khi restart

### Health Check
```
GET http://localhost:3000/health
```

Response:
```json
{
  "status": "ok",
  "bot": {
    "username": "YourBot#0000",
    "status": "online"
  },
  "stats": {
    "totalGames": 2500,
    "totalDownloads": 150,
    "totalSearches": 300
  }
}
```

## 🐛 Troubleshooting

### Bot không phản hồi
- Kiểm tra `BOT_TOKEN` trong `.env`
- Kiểm tra bot có quyền Send Messages
- Xem logs: `logs/bot.log`

### Không tìm thấy Online-Fix
- Kiểm tra tên file: phải có `"online-fix"`
- Kiểm tra tên game khớp với Steam chính xác
- Chạy test: `node test_online_fix_search.js`
- Xem hướng dẫn: [ONLINE_FIX_GUIDE_VI.md](./ONLINE_FIX_GUIDE_VI.md)

### GitHub Upload fail
- Kiểm tra `GITHUB_TOKEN` hợp lệ
- Kiểm tra repository public hoặc bot có access
- Kiểm tra file size không vượt quá GitHub limit (100MB)
- Kiểm tra internet connection

### Messages bị xóa quá nhanh
```
!toggleautodelete   # Tắt auto-delete
!toggleautodelete   # Bật lại
```

## 📈 Performance Tips

1. **Cache Game Info**: Bot sẽ cache thông tin game 12 tiếng
2. **Lazy Load**: Chỉ fetch data khi cần
3. **Batch Requests**: Tập hợp requests lại
4. **Database Optimization**: Định kỳ xóa cache cũ

```javascript
// Xóa cache cũ hơn 24 tiếng
const oneDay = 24 * 60 * 60 * 1000;
Object.keys(gameInfoCache).forEach(appId => {
  if (Date.now() - gameInfoCache[appId].timestamp > oneDay) {
    delete gameInfoCache[appId];
  }
});
```

## 📝 Logging

Tất cả hoạt động được lưu vào `logs/bot.log`:

```
[2024-12-19 10:30:45] [INFO] Game displayed: Palworld
  ├─ user: User#1234
  ├─ drm: DRM-Free
  └─ size: 40.5 GB

[2024-12-19 10:31:12] [SUCCESS] Uploaded to GitHub
  ├─ fileName: Palworld online-fix.zip
  └─ downloadUrl: https://raw.githubusercontent.com/...
```

## 🔄 Updates & Maintenance

### Regular Updates
- Cập nhật Denuvo database hàng tháng
- Kiểm tra API changes hàng tuần
- Fix bugs theo feedback

### Before Production
1. Kiểm tra tất cả commands
2. Test với 10+ games
3. Kiểm tra GitHub upload
4. Kiểm tra auto-delete
5. Monitor logs 24h

## 📞 Support

- 📧 Email: your@email.com
- 💬 Discord: YourDiscordUsername#0000
- 🐛 Issues: GitHub Issues
- 📚 Docs: [ONLINE_FIX_GUIDE_VI.md](./ONLINE_FIX_GUIDE_VI.md)

## 📄 License

MIT License - Tự do sử dụng cho mục đích cá nhân hoặc thương mại.

## 🙏 Credits

- **Discord.js**: https://discord.js.org/
- **Steam API**: https://steamcommunity.com/dev
- **SteamDB**: https://steamdb.info/
- **Axios**: https://axios-http.com/

## 🎯 Roadmap v3.0

- [ ] Web dashboard để quản lý files
- [ ] Tích hợp với Torrent search
- [ ] Multi-language support
- [ ] Slash commands
- [ ] Role-based permissions
- [ ] Game recommendation engine
- [ ] Auto-update detection

---

**Version**: 2.0.0  
**Last Updated**: December 2024  
**Maintained By**: Your Name  
**Status**: Production Ready ✅
