# 🌐 HƯỚNG DẪN ONLINE-FIX

## 📁 Cấu trúc thư mục

```
online_fix/
├── EA SPORTS FC 25 online-fix.zip
├── Tekken 8 online-fix.rar
├── Palworld online-fix.zip
├── Monster Hunter Wilds online-fix.7z
└── ...
```

## ✅ QUY TẮC ĐẶT TÊN FILE

### 1. Format chuẩn (Khuyến nghị)
```
<Tên Game Chính Xác> online-fix.<zip|rar|7z>
```

**Ví dụ:**
- ✅ `EA SPORTS FC 25 online-fix.zip`
- ✅ `Tekken 8 online-fix.rar`
- ✅ `Black Myth Wukong online-fix.zip`
- ✅ `Baldurs Gate 3 online-fix.7z`

### 2. Format thay thế (Cũng hoạt động)
```
<Tên Game>-online-fix.<zip|rar|7z>
<Tên Game> Online Fix.<zip|rar|7z>
<Tên Game>_online_fix.<zip|rar|7z>
```

**Ví dụ:**
- ✅ `Palworld-online-fix.zip`
- ✅ `Elden Ring Online Fix.rar`
- ✅ `Cyberpunk_2077_online_fix.zip`

### 3. Hoặc theo AppID (Nếu muốn chắc chắn 100%)
```
<AppID>.zip
<AppID> online-fix.zip
```

**Ví dụ:**
- ✅ `1623730.zip` (Palworld)
- ✅ `2669320 online-fix.zip` (EA SPORTS FC 25)

## 🎯 HỆ THỐNG TÌM KIẾM THÔNG MINH

Bot sẽ tự động tìm file Online-Fix theo thứ tự:

### Bước 1: Tìm theo AppID
```
online_fix/2669320.zip
online_fix/2669320.rar
online_fix/2669320.7z
online_fix/2669320/online-fix.zip
```

### Bước 2: Tìm theo tên game (Smart Search)
Bot sẽ:
1. Lấy tên game từ Steam API
2. Chuẩn hóa tên (bỏ ký tự đặc biệt, khoảng trắng)
3. So sánh với tất cả file trong thư mục `online_fix/`
4. Chọn file khớp nhất (match score cao nhất)

**Ví dụ:**
- Game: `EA SPORTS FC™ 25`
- Bot tìm: `easportsfc25`
- Khớp với: `EA SPORTS FC 25 online-fix.zip` ✅

## 📊 ĐIỂM KHỚP (Match Score)

Bot tính điểm khớp như sau:

| Loại khớp | Điểm | Ví dụ |
|-----------|------|-------|
| Khớp chính xác 100% | 100 | `tekken8` = `tekken8` |
| Tên game trong filename | 90 | `tekken8` trong `tekken8onlinefix` |
| Filename trong tên game | 85 | `tekken` trong `tekken8` |
| Khớp từng từ | 10/từ | `ea`, `sports`, `fc` |

## ⚠️ LƯU Ý QUAN TRỌNG

### ✅ NÊN:
- Đặt tên file giống y hệt tên game trên Steam
- Thêm "online-fix" vào cuối tên
- Sử dụng định dạng `.zip`, `.rar`, hoặc `.7z`
- Kiểm tra kỹ tên game trước khi upload

### ❌ KHÔNG NÊN:
- Đặt tên sai lệch quá nhiều so với tên game
- Sử dụng tên viết tắt không rõ ràng
- Bỏ qua số trong tên game (ví dụ: `FC` thay vì `FC 25`)
- Sử dụng định dạng file khác (`.exe`, `.txt`, v.v.)

## 🔍 KIỂM TRA FILE CÓ ĐƯỢC TÌM THẤY KHÔNG

### Cách 1: Test trực tiếp
```
!<appid>
```
Ví dụ: `!2669320` (EA SPORTS FC 25)

Bot sẽ hiển thị:
- ✅ "Online-Fix Available" nếu tìm thấy
- ❌ "Chưa có Online-Fix" nếu không tìm thấy

### Cách 2: Xem log
Bot sẽ ghi log khi tìm thấy file:
```
[SUCCESS] Found Online-Fix by game name: EA SPORTS FC 25
  file: EA SPORTS FC 25 online-fix.zip
  matchScore: 90
```

## 📝 VÍ DỤ THỰC TẾ

### Game: EA SPORTS FC 25 (AppID: 2669320)

**Các tên file sẽ được tìm thấy:**
1. ✅ `2669320.zip` (Khớp AppID - Ưu tiên cao nhất)
2. ✅ `EA SPORTS FC 25 online-fix.zip` (Khớp tên - Điểm 90)
3. ✅ `EA Sports FC 25 Online Fix.rar` (Khớp tên - Điểm 90)
4. ✅ `EASPORTSFC25-online-fix.zip` (Khớp tên - Điểm 85)
5. ⚠️ `FC 25 online-fix.zip` (Khớp một phần - Điểm thấp)

**Các tên file KHÔNG được tìm thấy:**
- ❌ `FIFA 25 online-fix.zip` (Sai tên game)
- ❌ `FC online-fix.zip` (Thiếu số)
- ❌ `game.zip` (Không có tên game)

## 🚀 WORKFLOW KHUYẾN NGHỊ

1. **Tìm AppID của game:**
   - Vào Steam Store
   - Xem URL: `https://store.steampowered.com/app/2669320/`
   - AppID = `2669320`

2. **Lấy tên chính xác:**
   - Copy tên game từ Steam Store
   - Ví dụ: `EA SPORTS FC™ 25`

3. **Đặt tên file:**
   - Bỏ ký tự đặc biệt: `EA SPORTS FC 25`
   - Thêm suffix: `EA SPORTS FC 25 online-fix.zip`

4. **Upload vào thư mục:**
   ```
   online_fix/EA SPORTS FC 25 online-fix.zip
   ```

5. **Test:**
   ```
   !2669320
   ```

6. **Kiểm tra kết quả:**
   - Nếu thấy nút "🌐 ONLINE-FIX" → ✅ Thành công
   - Nếu thấy "Chưa có Online-Fix" → ❌ Cần kiểm tra lại tên file

## 🎮 DANH SÁCH GAME PHỔ BIẾN CẦN ONLINE-FIX

| Game | AppID | Tên file khuyến nghị |
|------|-------|---------------------|
| EA SPORTS FC 25 | 2669320 | `EA SPORTS FC 25 online-fix.zip` |
| Tekken 8 | 1778820 | `Tekken 8 online-fix.zip` |
| Palworld | 1623730 | `Palworld online-fix.zip` |
| Baldur's Gate 3 | 1086940 | `Baldurs Gate 3 online-fix.zip` |
| Elden Ring | 1245620 | `Elden Ring online-fix.zip` |
| Monster Hunter Wilds | 2246460 | `Monster Hunter Wilds online-fix.zip` |
| It Takes Two | 1426210 | `It Takes Two online-fix.zip` |
| Valheim | 892970 | `Valheim online-fix.zip` |
| Cyberpunk 2077 | 1091500 | `Cyberpunk 2077 online-fix.zip` |
| Red Dead Redemption 2 | 1174180 | `Red Dead Redemption 2 online-fix.zip` |

## 🔧 TROUBLESHOOTING

### Vấn đề: Bot không tìm thấy file

**Giải pháp:**
1. Kiểm tra tên file có đúng format không
2. Kiểm tra file có trong thư mục `online_fix/` không
3. Kiểm tra định dạng file (phải là `.zip`, `.rar`, hoặc `.7z`)
4. Thử đổi tên file theo AppID: `<appid>.zip`
5. Xem log để biết bot đang tìm gì

### Vấn đề: Bot tìm sai file

**Giải pháp:**
1. Đặt tên file chính xác hơn
2. Sử dụng format theo AppID để chắc chắn 100%
3. Xóa các file có tên tương tự gây nhầm lẫn

### Vấn đề: File quá lớn không gửi được

**Giải pháp:**
1. Discord giới hạn 25MB cho file
2. Nén file nhỏ hơn hoặc chia nhỏ file
3. Hoặc upload lên host khác và gửi link

## 📞 HỖ TRỢ

Nếu có vấn đề, liên hệ admin hoặc xem log tại:
```
logs/<date>.log
```

---

**© 2025 Discord Lua Bot v2.0 - Enhanced with Smart Online-Fix Search**
