# 🎮 Discord Lua Bot - Hướng Dẫn Sử Dụng

## ✨ Tính Năng Mới v2.0

### 1. **UI Tin Nhắn Đẹp Hơn**
- ✅ Thiết kế box với ký tự đặc biệt
- ✅ Responsive trên PC & Mobile
- ✅ Code blocks với syntax highlighting
- ✅ Phân chia section rõ ràng
- ✅ Tiếng Việt hóa

### 2. **Thông Tin Luôn Mới Nhất**
- ✅ Cache chỉ 1 giờ (thay vì 12 giờ)
- ✅ Lệnh `!refresh <appid>` để cập nhật ngay
- ✅ Tự động lấy data từ SteamDB
- ✅ Hiển thị thông tin real-time

### 3. **Thu Thập Lua Files Tự Động**
- ✅ Scrape từ GitHub repositories
- ✅ Tìm kiếm GitHub Gists
- ✅ Quét các repo đã biết
- ✅ Tự động download và lưu

---

## 📋 Lệnh Bot

### **Lệnh Người Dùng**

```bash
!<appid>              # Xem thông tin game
!search <tên game>    # Tìm kiếm game
!refresh <appid>      # Làm mới thông tin từ SteamDB
!list                 # Danh sách game có sẵn
!help                 # Hiển thị trợ giúp
```

### **Lệnh Admin**

```bash
!stats                # Xem thống kê bot
!reload               # Reload database & cache
!clearcache           # Xóa toàn bộ cache
!toggleautodelete     # Bật/tắt tự động xóa tin nhắn
!collectlua           # Thu thập Lua files mới
```

---

## 🚀 Cài Đặt & Chạy

### **1. Cài đặt dependencies**

```bash
cd "e:\bot ngu luatool1.1\discord-lua-bot"
npm install
```

### **2. Chạy bot**

```bash
npm start
```

### **3. Thu thập Lua files (chạy riêng)**

```bash
npm run collect-lua
```

### **4. Cập nhật thông tin từ SteamDB (chạy riêng)**

```bash
npm run update-steamdb
```

---

## 📊 Ví Dụ Sử Dụng

### **Xem thông tin game**
```
!1623730
```
→ Hiển thị thông tin Palworld với UI đẹp

### **Tìm kiếm game**
```
!search tekken
```
→ Tìm tất cả game Tekken

### **Làm mới thông tin**
```
!refresh 1623730
```
→ Lấy thông tin mới nhất từ SteamDB cho Palworld

### **Thu thập Lua files mới (Admin)**
```
!collectlua
```
→ Tự động tìm và download lua files từ GitHub

---

## 🔧 Cấu Hình

### **Giảm thời gian cache**

File: `lua_discord_bot.js`
```javascript
CACHE_DURATION: 3600000, // 1 hour
```

Có thể giảm xuống:
- `1800000` = 30 phút
- `900000` = 15 phút
- `300000` = 5 phút

### **Tăng số lượng kết quả tìm kiếm**

File: `lua_collector.js`
```javascript
per_page: 100, // Tăng lên 100 (max)
```

---

## 📁 Cấu Trúc File

```
discord-lua-bot/
├── lua_discord_bot.js      # Bot chính
├── lua_collector.js        # Thu thập Lua files
├── steamdb_updater.js      # Cập nhật từ SteamDB
├── lua_files/              # Thư mục chứa 4000+ lua files
├── online_fix/             # Thư mục Online-Fix
├── fix_files/              # Thư mục Crack/Fix
├── game_info_cache.json    # Cache thông tin game
├── collected_lua_log.json  # Log thu thập lua
└── .env                    # Cấu hình tokens
```

---

## 🎯 Nguồn Thu Thập Lua

### **1. GitHub Repositories**
- Tìm kiếm: `addappid filename:.lua`
- Tìm kiếm: `setManifestid filename:.lua`
- Quét các repo công khai

### **2. GitHub Gists**
- Quét gists công khai
- Tìm file `.lua` với pattern AppID

### **3. Known Repositories**
- `usercat280297/Luatool`
- `SteamRE/DepotDownloader`
- Các repo đã biết khác

### **4. cs.rin.ru** (Đang phát triển)
- Cần authentication
- Sẽ được thêm trong phiên bản sau

---

## 📈 Thống Kê

Sau khi chạy `!collectlua`, xem log:

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

## ⚠️ Lưu Ý

1. **Rate Limiting**: GitHub API giới hạn 5000 requests/hour
2. **Token**: Cần GitHub token hợp lệ trong `.env`
3. **Delay**: Script tự động delay 2s giữa các request
4. **Cache**: Thông tin cache 1 giờ, dùng `!refresh` để cập nhật ngay

---

## 🐛 Troubleshooting

### **Lỗi: "GitHub authentication failed"**
→ Kiểm tra `GITHUB_TOKEN` trong `.env`

### **Lỗi: "Failed to fetch from SteamDB"**
→ SteamDB có thể block, thử lại sau vài phút

### **Không tìm thấy lua files mới**
→ Chạy `npm run collect-lua` để thu thập

### **Thông tin game cũ**
→ Dùng `!refresh <appid>` để cập nhật

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề, kiểm tra:
1. File `.env` có đầy đủ tokens
2. `npm install` đã chạy thành công
3. Folder `lua_files/` tồn tại
4. Bot có quyền gửi tin nhắn trong channel

---

## 🎉 Kết Luận

Bot đã được nâng cấp với:
- ✅ UI đẹp hơn, responsive
- ✅ Thông tin luôn mới nhất (cache 1h)
- ✅ Tự động thu thập lua files
- ✅ Lệnh refresh thủ công
- ✅ Tích hợp SteamDB real-time

**Chúc bạn sử dụng vui vẻ! 🚀**
