# Comprehensive Project Cleanup and Optimization Plan

This plan aims to clean, organize, and optimize the `discord-lua-bot` project as per the user's request.

## 1. Clean Source Code
### Actions:
-   **Remove Unused Files**:
    -   `demo.bat` (Use `setup.bat` or standard commands).
    -   `MOBILE_FIX.txt`, `CHECKLIST.txt`, `START_HERE.txt` (Consolidate into documentation).
    -   `.gitignore.tmp` (Temporary file).
    -   `README_V2.md` (Merge content into `README.md`).
    -   `CHANGELOG_v2.0.md`, `CHANGELOG_V2.md` (Merge into `CHANGELOG.md`).
    -   `test_features.js` (If obsolete or rename to `tests/feature_test.js`).
    -   `test_online_fix_search.js` (Move to `tests/`).
    -   `bulk_lua_downloader.js`, `lua_collector.js`, `steamdb_updater.js` (Move to `scripts/`).
    -   `auto_update.py`, `game_crawler.py`, `known_games.py` (Move to `scripts/` or remove if unused/Python legacy).
    -   `games_list.csv` (Move to `data/` if needed, else delete).
-   **Folder Structure Optimization**:
    -   Create `src/` for core bot logic (`lua_discord_bot.js`, `embed_styles.js`, etc.).
    -   Create `scripts/` for utility scripts (`git_backup.js`, collectors).
    -   Create `data/` for static data (`denuvo_data.js`, `crack_links.js`).
    -   Create `docs/` for documentation (`USAGE_GUIDE.md`, `QUICKSTART.md`, etc.).
    -   Create `tests/` for test scripts.
-   **Dependency Check**:
    -   Run `npm prune` to remove unused packages.
    -   Check `package.json` for unused dependencies (e.g., `puppeteer` if not used in active code).

## 2. Clean Documentation (Markdown)
### Actions:
-   **Consolidate**: Merge `README.md` and `README_V2.md` into a single, comprehensive `README.md`.
-   **Organize**: Move guide files (`USAGE_GUIDE.md`, `QUICKSTART.md`, `RENDER_DEPLOY.md`, `ONLINE_FIX_GUIDE_VI.md`, `QUICK_FIX_VI.md`, `CRAWLER_README.md`) into `docs/`.
-   **Standardize**: Ensure all Markdown files use consistent formatting (headers, code blocks).
-   **Update**: Verify `README.md` reflects the current project structure and v2.0 features.

## 3. Quality Assurance
### Actions:
-   **Code Review**: Briefly scan core files (`lua_discord_bot.js`) for hardcoded paths that might break after folder restructuring.
-   **Update Imports**: Update `require()` paths in `src/lua_discord_bot.js` to point to the new locations of `embed_styles.js`, `denuvo_data.js`, etc.
-   **Config Check**: Ensure `.env` loading works with new structure.

## 4. Final Verification
### Actions:
-   **Test Run**: Start the bot locally to ensure it boots up without errors.
-   **Command Test**: Verify `!help` and `!search` still work.
-   **Report**: Generate a `CLEANUP_REPORT.md` summarizing changes.

---

## Execution Steps

1.  **Backup**: Create a full backup of the current state (handled via git if initialized, or I will be careful not to delete critical data).
2.  **Restructure Folders**: Create `src`, `scripts`, `data`, `docs`, `tests`.
3.  **Move Files**: Move files to their respective new directories.
4.  **Update Code**: Modify `lua_discord_bot.js` and other scripts to update file paths (imports/requires).
5.  **Clean Up**: Delete identified temporary and redundant files.
6.  **Update Documentation**: Rewrite `README.md` and organize `docs/`.
7.  **Verify**: Run the bot and check logs.
8.  **Report**: Write the final report.