# Implementation Plan: Online-Fix Link System

I will replace the file-based Online-Fix system with a link-based system, mirroring the implementation of Crack Links.

## 1. Create Data Source
-   Create `data/online_fix_links.js` to store the AppID -> Link mapping.
-   Structure will be identical to `data/crack_links.js`.

## 2. Modify Bot Logic (`src/lua_discord_bot.js`)
-   **Import**: Import the new `online_fix_links.js` module.
-   **Cleanup**:
    -   Remove `findOnlineFixByGameName` function.
    -   Remove `scanFolder` calls for the `online_fix` directory.
    -   Remove local file scanning logic for `onlineFix` in `findFiles`.
-   **Command Handler (`handleGameCommand`)**:
    -   Check for links in `ONLINE_FIX_LINKS` using the AppID.
    -   Add a "Download Online-Fix" button if a link exists (Style: Danger/Red, similar to current).
-   **Interaction Handler**:
    -   Update the button handler for `online` type.
    -   Instead of uploading a file, it will reply with an ephemeral message containing the link.
    -   **Format**:
        ```
        🌐 **ONLINE-FIX DOWNLOAD LINK FOR GAME: [Game Name]**
        [Download online-fix file here](Link)
        
        ⚠️ This link is provided directly, use at your own risk.
        ```

## 3. Verification
-   Verify the bot starts without errors.
-   Check that `!search` and `!<appid>` commands work.
-   Ensure the new Online-Fix button appears for games with links and functions correctly.

This plan fulfills all user requirements: removing the old folder method, maintaining consistency with crack links, and ensuring the new link format.