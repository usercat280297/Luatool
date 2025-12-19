# 🔧 Hướng Dẫn Cập Nhật GitHub Token

## ⚠️ Vấn Đề Hiện Tại

Bot không thể upload file lên GitHub. Lỗi:
```
❌ Failed to upload file to GitHub!
```

**Nguyên Nhân Có Thể:**
1. ❌ GitHub token **đã hết hạn** (most likely)
2. ❌ Repository name sai (đã fix: `steam-manifests` → `Luatool`)
3. ❌ Token không có quyền write

---

## ✅ Cách Fix: Tạo GitHub Token Mới

### Step 1: Vào GitHub Settings
1. Truy cập: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**

### Step 2: Cấu Hình Token
**Name:** `Discord Lua Bot Token`

**Expiration:** 90 days (hoặc tùy thích)

**Scopes (Quyền):**
```
✅ repo (full control of private repositories)
   ✅ repo:status
   ✅ repo_deployment
   ✅ public_repo
   ✅ repo:invite
   ✅ security_events
✅ workflow
✅ write:packages
✅ read:packages
✅ delete:packages
```

**Simplified:** Chỉ cần check:
- ✅ `repo` (full)
- ✅ `workflow`

### Step 3: Copy Token
Token sẽ hiển thị 1 lần. Copy ngay vào một file text tạm để không mất:
```
ghp_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX  (đây là format, replace bằng token thật)
```

### Step 4: Update .env File

Thay đổi trong file `.env`:
```env
# 🐙 GitHub
GITHUB_TOKEN=ghp_XXXXXXXXXX...XXXXXXXXXX  ← Paste token mới vào đây (thay X bằng token)
GITHUB_REPO_OWNER=usercat280297
GITHUB_REPO_NAME=Luatool
```

### Step 5: Restart Bot
**Trên Render.com:**
1. Dashboard → Your Bot Service
2. Click **"Manual Deploy"** → **"Deploy latest commit"**
3. Chờ ~30 giây để deploy xong

**Hoặc local:**
```bash
npm start
```

---

## 🧪 Test Token

Sau khi update, test bằng lệnh:
```
!1274570
```

Sau đó click nút **"ONLINE-FIX"**

**Expected:**
```
✅ Download Ready!
📁 File: Devour online-fix.zip
📊 Size: 18.98 MB

⬇️ [CLICK HERE TO DOWNLOAD](https://raw.githubusercontent.com/...)

ℹ️ Link không hết hạn!
```

---

## ❌ Troubleshooting

### Error: "Failed to process file for download!"

**Check:**
1. ✅ GITHUB_TOKEN có token mới không?
2. ✅ Token có hết hạn không? (GitHub → Settings → Developer settings → Personal access tokens)
3. ✅ Repository `usercat280297/Luatool` tồn tại không?
4. ✅ Token có quyền `repo` không?

### Error: "401 Unauthorized"
- ❌ Token sai hoặc hết hạn
- ✅ Tạo token mới (các bước ở trên)

### Error: "404 Not Found"
- ❌ Repository sai
- ✅ Kiểm tra: `GITHUB_REPO_OWNER=usercat280297` và `GITHUB_REPO_NAME=Luatool`

---

## 📝 Kiểm Tra Token Hiện Tại

Để kiểm tra token có hợp lệ không, chạy:

```bash
# Thay TOKEN bằng token của bạn
curl -H "Authorization: token ghp_YOUR_TOKEN_HERE" \
  https://api.github.com/user
```

Nếu valid, sẽ thấy:
```json
{
  "login": "usercat280297",
  "id": 12345678,
  ...
}
```

Nếu sai, sẽ thấy:
```json
{
  "message": "Bad credentials",
  "documentation_url": "https://docs.github.com/rest"
}
```

---

## 🔐 Security Best Practices

1. ✅ **Không share token** - Nó như password
2. ✅ **Không commit .env vào git** - `.gitignore` đã có
3. ✅ **Token hết hạn?** - Tạo token mới
4. ✅ **Token bị leak?** - Delete ngay tại GitHub Settings

---

## 📋 Checklist

- [ ] Vào https://github.com/settings/tokens
- [ ] Tạo token mới (classic)
- [ ] Copy token
- [ ] Paste vào `.env` file (`GITHUB_TOKEN=...`)
- [ ] Save `.env` file
- [ ] Commit và push (hoặc manual deploy trên Render)
- [ ] Chờ Render reload (~30 giây)
- [ ] Test: `!1274570` + click ONLINE-FIX
- [ ] Verify link tải xuống

---

## 🆘 Nếu Vẫn Lỗi

Liên hệ với admin kèm theo:
1. Error message từ bot
2. `.env` file (che token, ví dụ: `ghp_XXXX****XXXX`)
3. Repository URL: `https://github.com/usercat280297/Luatool`

---

**Last Updated:** December 19, 2025
**Version:** v2.0 - GitHub Token Guide
