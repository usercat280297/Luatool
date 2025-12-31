I will fix the `EADDRINUSE` (port already in use) error by:

1.  **Stopping the conflicting process**: I have already stopped the test process that was holding port 3000.
2.  **Updating `lua_discord_bot.js`**: I will modify the server startup code to automatically try the next available port (e.g., 3001, 3002) if port 3000 is busy. This prevents the bot from crashing if the port is taken.

This ensures the bot can always start the health check server without errors, even if a previous instance is still running in the background.