# 🚀 Quick Start Guide

## ⚡ 3 Bước Nhanh

### 1️⃣ Cài đặt
```bash
cd "e:\bot ngu luatool1.1\discord-lua-bot"
npm install
```

### 2️⃣ Chạy bot
```bash
npm start
```

### 3️⃣ Test trong Discord
```
!help
!1623730
!search palworld
```

---

## 🎯 Lệnh Quan Trọng

### Người dùng:
```bash
!<appid>              # Xem game
!search <tên>         # Tìm game
!refresh <appid>      # Làm mới data
```

### Admin:
```bash
!collectlua           # Thu thập lua mới
!stats                # Xem thống kê
```

---

## 🔧 Tính Năng Mới v2.0

✅ **UI đẹp hơn** - Box design, responsive  
✅ **Data mới nhất** - Cache 1h, refresh được  
✅ **Thu thập lua** - Tự động từ GitHub  

---

## 📊 Kiểm tra

```bash
node test_features.js
```

---

## 🆘 Lỗi thường gặp

**Bot không start?**
→ Kiểm tra `BOT_TOKEN` trong `.env`

**Không tìm thấy game?**
→ Chạy `!collectlua` để thu thập thêm

**Thông tin cũ?**
→ Dùng `!refresh <appid>`

---

**Xem chi tiết**: `USAGE_GUIDE.md`  
**Changelog**: `CHANGELOG_v2.0.md`
