# Mobile UI Redesign Plan

I will redesign the Discord Embeds in `embed_styles.js` to be fully optimized for mobile devices, focusing on readability, contrast, and touch-friendly layouts.

## 1. Visual Improvements (Contrast & Readability)
- **High-Contrast Data**: Critical information (Price, Size, Ratings) will be wrapped in `code blocks` (e.g., \`50 GB\`) to create a button-like appearance that stands out against the dark background.
- **Typography**: Extensive use of **Bold** text for headers and key values to ensure legibility on small screens.
- **Clean Layout**: Reduce visual clutter by grouping related information.

## 2. Layout Optimization (Mobile Grid)
- **Problem**: Current "Developer" and "Publisher" fields often wrap or get cut off on mobile when set to `inline: true`.
- **Solution**:
    - **Row 1 (Critical)**: Price & Size (Inline - Short values fit well).
    - **Row 2 (Quality)**: Rating & Languages (Inline).
    - **Row 3 (Updates)**: Release Date & DLC (Inline).
    - **Row 4 (Credits)**: **Merge** Developer and Publisher into a single "🛠️ Studio / Credits" section (Full Width) to ensure long names are fully visible.
- **Description**: Keep short and punchy, with links on their own lines for easy tapping.

## 3. Touch Targets & Interaction
- **Links**: Ensure all hyperlinks (Steam, SteamDB) are **Bold** and separated by spacing to prevent accidental mis-taps.
- **Buttons**: The existing button logic in `lua_discord_bot.js` uses distinct colors (Blue/Green/Red) which is already optimal for mobile. I will ensure labels are clear.

## 4. Implementation Steps
1.  **Modify `embed_styles.js`**:
    - Update `createBeautifulGameEmbed` function.
    - Implement the new field grouping logic.
    - Apply code-block formatting to values.
2.  **Verify**: Ensure no syntax errors and that the structure complies with Discord API limits.

This approach addresses all points: contrast (code blocks), layout (merged fields), touch targets (spacing), and aesthetics.