I will proceed with translating the entire project to English and bolding all hyperlinks as requested.

### Phase 1: Core System & UI Translation (Codebase)
I will update the following JavaScript files to replace all Vietnamese text with English and apply bold formatting to links.

1.  **`embed_styles.js`** (UI Styling)
    *   **Translate Fields**: 'Giá' → 'Price', 'Dung lượng' → 'Size', 'Cập nhật' → 'Last Update', 'Ngôn ngữ' → 'Languages', 'Đánh giá' → 'Rating'.
    *   **Translate Warnings**: Convert Denuvo and Anti-cheat warnings to clear English alerts.
    *   **Translate Statuses**: 'Chưa có' → 'Not available', 'Hướng dẫn...' → 'Installation Guide...'.
    *   **Bold Links**: Ensure all embed links follow the `[**Link Text**](URL)` format.

2.  **`lua_discord_bot.js`** (Main Logic)
    *   **Translate Responses**: Convert all bot replies (success, error, loading messages) to English.
    *   **Translate Logs**: Update `console.log` and system logs to English for easier debugging.
    *   **Translate Comments**: Translate code comments for better maintainability.
    *   **Web Dashboard**: Translate the "Health Check" HTML page.
    *   **Date Format**: Change `vi-VN` locale to `en-US` or standard ISO format.
    *   **Bold Links**: Update dynamic link generation in commands like `!search` and `!crack` to use bold formatting.

3.  **`git_backup.js`** (Backup System)
    *   **Translate Logs**: Convert backup status logs to English.
    *   **Commit Messages**: Change auto-commit messages to English (e.g., "Auto backup: [Timestamp]").

### Phase 2: Documentation (Docs)
After the code is updated, I will translate the key documentation files to English to match the new system language.
*   `README.md`
*   `USAGE_GUIDE.md`
*   `QUICKSTART.md`

### Phase 3: Verification
*   I will run the bot to ensure no syntax errors were introduced during translation.
*   I will verify that the "Health Check" page loads in English.
