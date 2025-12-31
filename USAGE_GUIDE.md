# 🎮 Discord Lua Bot - Usage Guide

## ✨ New Features v2.0

### 1. **Improved Message UI**
- ✅ Box design with special characters
- ✅ Responsive on PC & Mobile
- ✅ Code blocks with syntax highlighting
- ✅ Clear section division
- ✅ English Localization

### 2. **Always Fresh Information**
- ✅ Cache duration reduced to 1 hour (from 12 hours)
- ✅ `!refresh <appid>` command for instant update
- ✅ Automatic data fetching from SteamDB
- ✅ Real-time information display

### 3. **Automatic Lua File Collection**
- ✅ Scrape from GitHub repositories
- ✅ Search GitHub Gists
- ✅ Scan known repositories
- ✅ Auto download and save

---

## 📋 Bot Commands

### **User Commands**

```bash
!<appid>              # View game info
!search <game name>   # Search for games
!refresh <appid>      # Refresh info from SteamDB
!list                 # List available games
!help                 # Show help
```

### **Admin Commands**

```bash
!stats                # View bot statistics
!reload               # Reload database & cache
!clearcache           # Clear all cache
!toggleautodelete     # Toggle message auto-delete
!collectlua           # Collect new Lua files
```

---

## 🚀 Installation & Run

### **1. Install dependencies**

```bash
cd "e:\bot ngu luatool1.1\discord-lua-bot"
npm install
```

### **2. Run bot**

```bash
npm start
```

### **3. Collect Lua files (manual run)**

```bash
npm run collect-lua
```

### **4. Update SteamDB info (manual run)**

```bash
npm run update-steamdb
```

---

## 📊 Usage Examples

### **View game info**
```
!1623730
```
→ Displays Palworld information with beautiful UI

### **Search for a game**
```
!search tekken
```
→ Finds all Tekken games

### **Refresh information**
```
!refresh 1623730
```
→ Fetches latest info from SteamDB for Palworld

### **Collect new Lua files (Admin)**
```
!collectlua
```
→ Automatically finds and downloads lua files from GitHub

---

## 🔧 Configuration

### **Reduce Cache Duration**

File: `lua_discord_bot.js`
```javascript
CACHE_DURATION: 3600000, // 1 hour
```

Can be reduced to:
- `1800000` = 30 minutes
- `900000` = 15 minutes
- `300000` = 5 minutes

### **Increase Search Results**

File: `lua_collector.js`
```javascript
per_page: 100, // Increase to 100 (max)
```

---

## 📁 File Structure

```
discord-lua-bot/
├── lua_discord_bot.js      # Main Bot
├── lua_collector.js        # Lua File Collector
├── steamdb_updater.js      # SteamDB Updater
├── lua_files/              # Folder containing 4000+ lua files
├── online_fix/             # Online-Fix Folder
├── fix_files/              # Crack/Fix Folder
├── game_info_cache.json    # Game Info Cache
├── collected_lua_log.json  # Lua Collection Log
└── .env                    # Token Configuration
```

---

## 🎯 Lua Collection Sources

### **1. GitHub Repositories**
- Search: `addappid filename:.lua`
- Search: `setManifestid filename:.lua`
- Scans public repos

### **2. GitHub Gists**
- Scans public gists
- Finds `.lua` files with AppID patterns

### **3. Known Repositories**
- `usercat280297/Luatool`
- `SteamRE/DepotDownloader`
- Other known repos

### **4. cs.rin.ru** (In Development)
- Requires authentication
- Will be added in future versions

---

## 📈 Statistics

After running `!collectlua`, check log:

```json
{
  "total": 4500,
  "sources": {
    "github": 350,
    "gists": 120,
    "knownRepos": 30
  },
  "lastUpdate": "2025-01-29T10:30:00.000Z"
}
```

---

## ⚠️ Notes

1. **Rate Limiting**: GitHub API limits 5000 requests/hour
2. **Token**: Requires valid GitHub token in `.env`
3. **Delay**: Script automatically delays 2s between requests
4. **Cache**: Info cached for 1 hour, use `!refresh` to update immediately

---

## 🐛 Troubleshooting

### **Error: "GitHub authentication failed"**
→ Check `GITHUB_TOKEN` in `.env`

### **Error: "Failed to fetch from SteamDB"**
→ SteamDB might be blocking, try again in a few minutes

### **No new lua files found**
→ Run `npm run collect-lua` to collect

### **Old game info**
→ Use `!refresh <appid>` to update

---

## 📞 Support

If you encounter issues, check:
1. `.env` file has all tokens
2. `npm install` ran successfully
3. `lua_files/` folder exists
4. Bot has permission to send messages in channel

---

## 🎉 Conclusion

Bot has been upgraded with:
- ✅ Better, responsive UI
- ✅ Always fresh info (1h cache)
- ✅ Automatic lua file collection
- ✅ Manual refresh command
- ✅ Real-time SteamDB integration

**Happy using! 🚀**
