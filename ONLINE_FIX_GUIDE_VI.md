# 🌐 Online-Fix Smart Search - Hướng Dẫn Sử Dụng

## 📋 Tổng Quan

Bot Discord Lua v2.0 giờ đây có tính năng **tìm kiếm online-fix thông minh**. Khi người dùng gõ lệnh `!<appid>`, bot sẽ:

1. ✅ Lấy tên game chính xác từ Steam API hoặc SteamDB.info
2. ✅ Tìm kiếm Lua script trong thư mục `lua_files/`
3. ✅ Tìm kiếm Online-Fix trong thư mục `online_fix/` 
4. ✅ Hiển thị nút tải xuống nếu các file tồn tại

## 📁 Cấu Trúc Thư Mục

```
discord-lua-bot/
├── lua_files/           # Chứa Lua scripts
│   ├── <appid>.lua      # Ví dụ: 1623730.lua (Palworld)
│   └── ...
├── online_fix/          # Chứa Online-Fix archives
│   ├── Devour online-fix.zip
│   ├── <Game Name> online-fix.zip
│   └── ...
└── fix_files/           # Chứa Fix/Crack archives
```

## 🔍 Cách Đặt Tên File Online-Fix (RẤT QUAN TRỌNG!)

Bot sử dụng **Smart Name Matching** để tìm online-fix. Để tối ưu hóa khả năng tìm kiếm:

### ✅ Đặt Tên Đúng Cách:

```
Devour online-fix.zip                    ← ✅ Đúng
Palworld online-fix.zip                  ← ✅ Đúng
Black Myth Wukong online-fix.zip         ← ✅ Đúng
Tekken 8 online-fix.zip                  ← ✅ Đúng
EA SPORTS FC 25 online-fix.zip           ← ✅ Đúng
Dragon's Dogma 2 online-fix.zip          ← ✅ Đúng
```

### ❌ Tránh Đặt Tên Như Vậy:

```
devour_fix.zip                           ← ❌ Thiếu "online-fix"
1623730-online-fix.rar                   ← ❌ Dùng AppID thay vì tên game
devour.zip                               ← ❌ Không rõ là online-fix
online-fix-devour.zip                    ← ❌ Thứ tự sai
```

### 📝 Quy Tắc Đặt Tên:

1. **Phải chứa tên game chính xác** (theo cách Steam ghi tên)
2. **Phải chứa "online-fix"** hoặc "onlinefix" ở cuối
3. **Ngăn cách bằng dấu cách**, không dùng underscore `_`
4. **Dùng phần mở rộng**: `.zip`, `.rar`, hoặc `.7z`

## 🎮 Ví Dụ Thực Tế

### Kịch Bản 1: Tìm Online-Fix Cho Palworld
```
1. Người dùng: !1623730
2. Bot tìm kiếm:
   - Steam API → Tên game: "Palworld"
   - lua_files/ → Tìm thấy: 1623730.lua ✅
   - online_fix/ → Tìm thấy: "Palworld online-fix.zip" ✅
3. Bot gửi Embed với 2 nút tải: LUA SCRIPT + ONLINE-FIX
```

### Kịch Bản 2: Game Không Có Online-Fix
```
1. Người dùng: !570 (Dota 2)
2. Bot tìm kiếm:
   - Steam API → Tên game: "Dota 2"
   - lua_files/ → Tìm thấy: 570.lua ✅
   - online_fix/ → Không tìm thấy ❌
3. Bot gửi Embed:
   - Nút LUA SCRIPT có
   - Thông báo: "⚠️ Chưa có Online-Fix"
```

### Kịch Bản 3: Steam API Down, Fallback SteamDB
```
1. Người dùng: !131890
2. Steam API bị down
3. Bot fallback → SteamDB.info → Tên game: "Starbound"
4. Bot tiếp tục tìm kiếm file như bình thường
```

## 🔧 Hệ Thống Tìm Kiếm (Matching Algorithm)

Bot sử dụng **3 cấp độ tìm kiếm** để so khớp tên game:

### Level 1: Tìm Chính Xác (Score: 100)
```
Game Name: "palworld"
File Name: "palworld online-fix"
→ Match! (Tên game xuất hiện đầy đủ trong file name)
```

### Level 2: Tìm Bao Gồm (Score: 90)
```
Game Name: "black myth wukong"
File Name: "black myth wukong online-fix"
→ Match! (Tên game được bao gồm trong file name)
```

### Level 3: Tìm Từng Phần (Score: 10 per word match)
```
Game Name: "dragon's dogma 2"
File Name: "dragon dogma 2 online-fix"
→ Match! (Các từ quan trọng được tìm thấy)
```

## 📊 Quy Trình Tìm Kiếm Chi Tiết

```
!<appid> Command
    ↓
Get Game Info from Steam API
    ↓
Steam API Success?
    ├─ YES → Use Steam Name
    └─ NO → Try SteamDB.info
    ↓
Search Lua Files
    ├─ By AppID: lua_files/<appid>.lua
    └─ By Folder: lua_files/<appid>/game.lua
    ↓
Search Online-Fix Files
    ├─ By AppID: online_fix/<appid>.zip
    └─ By Game Name (Smart): "Game Name online-fix.zip"
    ↓
Display Results with Download Buttons
```

## 🚀 Thêm Online-Fix Mới

### Các Bước:
1. **Tên file**: `"<Tên Game Chính Xác> online-fix.zip"`
   - Ví dụ: `"Tekken 8 online-fix.zip"`

2. **Kiểm tra tên game chính xác**:
   - Truy cập: https://steamdb.info/app/<appid>/
   - Xem tên game ở tiêu đề trang hoặc header

3. **Copy file vào thư mục**:
   ```
   online_fix/ → "Tekken 8 online-fix.zip"
   ```

4. **Test**: Gõ `!2519830` (Tekken 8 AppID)
   - Bot sẽ tìm thấy và hiển thị nút ONLINE-FIX ✅

## ⚙️ Cấu Hình Advanced

### Thay Đổi Match Score:
File: `lua_discord_bot.js`, hàm `calculateMatchScore()`

```javascript
// Hiện tại:
if (cleanFileName === gameName) return 100;  // Exact match
if (cleanFileName.includes(gameName)) return 90;  // Contains
if (gameName.includes(cleanFileName)) return 85;  // Reverse
// Mỗi word match = +10 point
```

### Thay Đổi Thư Mục Online-Fix:
File: `.env`
```
ONLINE_FIX_PATH=./online_fix
# Hoặc:
ONLINE_FIX_PATH=./online-fix-files
```

## 🐛 Troubleshooting

### Problem: Bot không tìm thấy online-fix
**Solution:**
1. Kiểm tra tên file: Phải có `"online-fix"` (không phải `"onlinefix"`)
2. Kiểm tra tên game: Phải khớp với tên Steam chính xác
3. Kiểm tra vị trí file: Phải trong thư mục `online_fix/`
4. Chạy test: `node test_online_fix_search.js`

### Problem: Game có nhiều file online-fix
**Solution:**
Bot sẽ chọn file có **match score cao nhất**. Nếu bạn có:
```
Final Fantasy 7 Remake online-fix.zip (score: 100)
Final Fantasy online-fix.zip (score: 50)
```
Bot sẽ chọn file đầu tiên.

### Problem: Tên game quá dài hoặc có kí tự đặc biệt
**Solution:**
Bot sẽ **normalize** tên file (loại bỏ kí tự đặc biệt, space):
```
"Dragon's Dogma 2" → "dragonsdog2" (tìm kiếm)
"Dragon's Dogma 2 online-fix.zip" → "dragonsdog2onlinefix" (file)
→ Match!
```

## 📈 Thống Kê

Bot sẽ log tất cả các tìm kiếm online-fix:

```
[SUCCESS] Found Online-Fix by game name: Palworld
  ├─ File: Palworld online-fix.zip
  ├─ Match Score: 100
  └─ File Size: 2.5 GB
```

## 📝 Checklist Cài Đặt Online-Fix

- [ ] Tạo thư mục `online_fix/` nếu chưa có
- [ ] Copy file online-fix vào: `online_fix/<Game Name> online-fix.zip`
- [ ] Kiểm tra tên game chính xác trên SteamDB
- [ ] Test bằng lệnh `!<appid>`
- [ ] Xác nhận nút ONLINE-FIX xuất hiện
- [ ] Kiểm tra download hoạt động đúng

## 🔗 Liên Quan

- **SteamDB**: https://steamdb.info/
- **Steam Store**: https://store.steampowered.com/
- **Test Script**: `test_online_fix_search.js`

---

**Last Updated**: December 2024
**Bot Version**: 2.0.0
