# Testing Guide

This project uses a custom test suite to verify the functionality of the Discord bot, search algorithms, and UI generation.

## Test Structure

The tests are organized in the `tests/` directory:

| File | Purpose |
|------|---------|
| `tests/runner.js` | **Main Entry Point**. Runs all tests sequentially. |
| `tests/health.test.js` | Checks system environment, dependencies, folder structure, and syntax. |
| `tests/search.test.js` | Verifies Steam API integration and SteamDB scraping logic. |
| `tests/ui.test.js` | Tests Discord Embed generation and mobile optimization. |
| `tests/online_fix.test.js` | Tests the fuzzy matching logic for local Online-Fix files. |

## Running Tests

### Run All Tests (Recommended)
```bash
npm test
```
Or manually:
```bash
node tests/runner.js
```

### Run Specific Modules
You can run individual test modules directly with Node.js:

```bash
# Test Search Logic
node tests/search.test.js

# Test UI Generation
node tests/ui.test.js

# Test System Health
node tests/health.test.js
```

## Writing New Tests
1. Create a new file in `tests/` (e.g., `tests/new_feature.test.js`).
2. Export a `runTests()` async function that returns `true` (pass) or `false` (fail).
3. Add the module to `tests/runner.js`.

## Coverage
The current suite covers:
- ✅ Environment Variables (API Keys)
- ✅ File System Structure
- ✅ Steam Store API Connection
- ✅ SteamDB HTML Parsing (Regex)
- ✅ Embed Formatting (Colors, Fields)
- ✅ Mobile UI Optimization
- ✅ File Name Normalization & Matching
