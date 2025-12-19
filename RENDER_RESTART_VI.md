# 🚀 Render.com Restart Guide

## Cách 1: Auto Restart (Recommended)
Bot sẽ **tự động restart** khi bạn push code lên GitHub.

```bash
git add .
git commit -m "Update changes"
git push origin main
```

→ Render sẽ **tự động detect** và restart bot trong 2-5 phút

## Cách 2: Manual Restart
1. Vào https://dashboard.render.com
2. Chọn service `lua-discord-bot`
3. Click **"Manual Deploy"** hoặc **"Restart"** button
4. Wait 1-2 phút để bot start

## Cách 3: Check Logs
1. Dashboard → service → **"Logs"** tab
2. Xem nó pull code từ GitHub chưa
3. Tìm "Starting" message

## What to Look For
```
✅ "Pulling from GitHub..." - Code được update
✅ "npm install" - Dependencies được install
✅ "🚀 DISCORD LUA BOT - ENHANCED VERSION 2.0" - Bot started
✅ "✅ Logged in as: BotName#0000" - Bot connected
```

## Nếu Không Auto-Restart

**Thủ công:** Vào Render dashboard:
1. Dashboard
2. Service "lua-discord-bot"
3. Settings tab
4. Scroll down → "Restart Instance" button
5. Click!

---

**Status**: Đã push token mới lên GitHub  
**Next**: Render sẽ auto-restart trong 2-5 phút  
**Then**: Test bot lại
