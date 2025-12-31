# Test Suite Optimization Plan

I will restructure the testing framework to consolidate 9 scattered test files into 4 focused modules within the `tests/` directory. This achieves a **55% reduction** in file count (exceeding the 30% goal) while maintaining full coverage.

## 1. Structure Analysis
**Current State (9 files):**
-   Search Logic: `test_search.js`, `test_search_simple.js`, `test_steam_search.js`, `test_steamdb_search.js`, `test_steamdb_search_with_cookies.js`
-   Online Fix: `test_online_fix_search.js`
-   UI/Embeds: `test_ui.js`
-   System Health: `test_syntax.js`, `tests/test_features.js`

**New Structure (4 modules + 1 runner):**
-   `tests/search.test.js`: Unified search testing (Steam API, SteamDB, Local CSV).
-   `tests/online_fix.test.js`: Online-fix search algorithms.
-   `tests/ui.test.js`: Embed generation and UI formatting.
-   `tests/health.test.js`: System checks, syntax validation, environment variables, and folder structure.
-   `tests/runner.js`: Main entry point to run all tests.

## 2. Implementation Steps
1.  **Create `tests/search.test.js`**:
    -   Merge `test_steam_search.js` (API) and `test_steamdb_search.js` (Scraping).
    -   Update imports to point to `../src/`.
    -   Include cookies test case if environment permits.
2.  **Create `tests/ui.test.js`**:
    -   Move logic from `test_ui.js`.
    -   Update import to `../src/embed_styles.js`.
3.  **Create `tests/online_fix.test.js`**:
    -   Move logic from `test_online_fix_search.js`.
    -   Update paths to `../data/` or `../online_fix`.
4.  **Create `tests/health.test.js`**:
    -   Merge `tests/test_features.js` and `test_syntax.js`.
    -   Update checks for new folder structure (`src/`, `scripts/`).
5.  **Create `tests/runner.js`**:
    -   Script to execute all tests sequentially and report pass/fail status.
6.  **Cleanup**:
    -   Delete the 9 obsolete files in the root directory.
7.  **Documentation**:
    -   Create `docs/TESTING.md` explaining how to run the new test suite.

## 3. Verification
-   Run `node tests/runner.js` to ensure all tests pass and execution time is within limits.
-   Verify that coverage includes: API calls, HTML parsing, Embed creation, and System integrity.