# UI Improvement Plan: Button Layout

The user is reporting that the buttons are overlapping or cluttered. I will reorganize the buttons into multiple rows (`ActionRowBuilder`) to prevent them from being squeezed into a single row, which can cause layout issues on some devices.

## 1. Analyze Current Layout
Currently, all buttons are added to a single `row`:
-   Download Lua
-   Download Crack (File)
-   Download Crack (Link)
-   Download Online-Fix (Link)
-   Download Online-Fix (Legacy File)

Discord allows a maximum of 5 buttons per row. If we have many options, it's better to split them logically.

## 2. New Layout Strategy
I will split the buttons into two potential rows:

**Row 1: Primary Files (Lua & Local Crack)**
-   `[📜 Download Lua]` (if available)
-   `[🔧 Download Crack]` (if local file exists)

**Row 2: External Links & Online Fixes**
-   `[🔥 Download Crack (Direct)]` (if link exists)
-   `[🌐 Download Online-Fix]` (if link exists)
-   `[📁 Download Online-Fix (Legacy)]` (if file exists)

## 3. Implementation Steps (`src/lua_discord_bot.js`)
1.  Initialize `row1` and `row2`.
2.  Add Lua and Local Crack buttons to `row1`.
3.  Add Direct Links (Crack/Online) and Legacy Online buttons to `row2`.
4.  Push non-empty rows to the `rows` array.

## 4. Verification
-   This change is purely cosmetic/layout-based and ensures buttons are grouped logically and don't overcrowd a single row.

This plan directly addresses the "buttons overlapping/cluttered" issue.