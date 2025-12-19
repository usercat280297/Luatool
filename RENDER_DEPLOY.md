# 🚀 Deploy Discord Lua Bot v2.0 trên Render

## ✅ Code Đã Push Lên GitHub

Repository: `https://github.com/usercat280297/Luatool`

---

## 📋 Bước Deploy Trên Render

### 1️⃣ Tạo Web Service Mới

1. Đăng nhập vào [Render.com](https://render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect GitHub repository: `usercat280297/Luatool`
4. Chọn branch: `main`

### 2️⃣ Cấu Hình Service

**Basic Settings:**
- **Name**: `discord-lua-bot-v2`
- **Region**: `Singapore` (gần Việt Nam nhất)
- **Branch**: `main`
- **Root Directory**: `discord-lua-bot` (nếu cần)
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

**Instance Type:**
- Free tier hoặc Starter ($7/month)

### 3️⃣ Environment Variables

Thêm các biến môi trường sau:

```bash
# Discord
BOT_TOKEN=your_discord_bot_token_here

# GitHub
GITHUB_TOKEN=your_github_token_here
GITHUB_REPO_OWNER=usercat280297
GITHUB_REPO_NAME=Luatool

# Steam
STEAM_API_KEY=your_steam_api_key_here

# MongoDB
MONGODB_URI=your_mongodb_uri_here

# Config
NODE_ENV=production
API_PORT=3000
ENABLE_DETAILED_LOGGING=true
```

### 4️⃣ Deploy

1. Click **"Create Web Service"**
2. Đợi build & deploy (2-5 phút)
3. Kiểm tra logs để đảm bảo bot đã start

---

## 🔍 Kiểm Tra Deploy

### Check Logs
```
[2025-01-29] ✅ Logged in as: YourBot#1234
[2025-01-29] 🎮 Bot ID: 123456789
[2025-01-29] 📊 Command prefix: !
[2025-01-29] 🎯 Total available games: 4047
```

### Test Commands
```
!help
!1623730
!refresh 1623730
```

---

## 🆕 Tính Năng Mới v2.0

### 1. UI Đẹp Hơn
- Box design với ký tự đặc biệt
- Responsive PC/Mobile
- Code blocks với màu sắc

### 2. Thông Tin Mới Nhất
- Cache 1 giờ (thay vì 12 giờ)
- Lệnh `!refresh <appid>`
- SteamDB real-time

### 3. Thu Thập Lua
- Lệnh `!collectlua` (Admin)
- Tự động từ GitHub

---

## 🔧 Troubleshooting

### Bot không start?
1. Check logs trên Render
2. Verify environment variables
3. Check BOT_TOKEN

### Lỗi "Module not found"?
1. Check Build Command: `npm install`
2. Verify package.json có cheerio

### Bot offline?
1. Check Render service status
2. Restart service
3. Check logs

---

## 📊 Monitoring

### Health Check
URL: `https://your-app.onrender.com/health`

Response:
```json
{
  "status": "ok",
  "bot": {
    "username": "YourBot#1234",
    "status": "online"
  },
  "stats": {
    "totalGames": 4047,
    "cachedGames": 1
  }
}
```

---

## 🔄 Auto-Deploy

Mỗi khi push code mới lên GitHub, Render sẽ tự động:
1. Pull code mới
2. Run `npm install`
3. Restart service

---

## 💡 Tips

1. **Free Tier**: Service sẽ sleep sau 15 phút không hoạt động
2. **Keep Alive**: Dùng UptimeRobot để ping mỗi 5 phút
3. **Logs**: Xem logs real-time trên Render dashboard

---

## 🎉 Hoàn Tất!

Bot v2.0 đã sẵn sàng trên Render với:
- ✅ Beautiful UI
- ✅ Real-time SteamDB
- ✅ Auto Lua Collection
- ✅ 4,000+ lua files

**Test ngay trong Discord:** `!help`
