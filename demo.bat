@echo off
title Discord Lua Bot v2.0 - Demo
color 0A

:MENU
cls
echo ========================================
echo   Discord Lua Bot v2.0 - Demo Menu
echo ========================================
echo.
echo   1. Run Feature Tests
echo   2. Start Bot
echo   3. Collect Lua Files
echo   4. Update SteamDB Data
echo   5. View Statistics
echo   6. Exit
echo.
echo ========================================
set /p choice="Select option (1-6): "

if "%choice%"=="1" goto TEST
if "%choice%"=="2" goto START
if "%choice%"=="3" goto COLLECT
if "%choice%"=="4" goto UPDATE
if "%choice%"=="5" goto STATS
if "%choice%"=="6" goto EXIT
goto MENU

:TEST
cls
echo ========================================
echo   Running Feature Tests...
echo ========================================
echo.
node test_features.js
echo.
pause
goto MENU

:START
cls
echo ========================================
echo   Starting Discord Bot...
echo ========================================
echo.
echo Press Ctrl+C to stop the bot
echo.
npm start
pause
goto MENU

:COLLECT
cls
echo ========================================
echo   Collecting Lua Files...
echo ========================================
echo.
echo This may take several minutes...
echo.
node lua_collector.js
echo.
pause
goto MENU

:UPDATE
cls
echo ========================================
echo   Updating SteamDB Data...
echo ========================================
echo.
node steamdb_updater.js update-all
echo.
pause
goto MENU

:STATS
cls
echo ========================================
echo   Bot Statistics
echo ========================================
echo.
echo Counting files...
echo.
for /f %%a in ('dir /b /s "lua_files\*.lua" ^| find /c ".lua"') do set lua_count=%%a
for /f %%a in ('dir /b /s "online_fix\*.*" ^| find /c "\"') do set fix_count=%%a
echo   Lua files: %lua_count%
echo   Online-Fix files: %fix_count%
echo.
if exist "game_info_cache.json" (
    echo   Cache: EXISTS
) else (
    echo   Cache: NOT FOUND
)
echo.
if exist "collected_lua_log.json" (
    echo   Collection log: EXISTS
) else (
    echo   Collection log: NOT FOUND
)
echo.
echo ========================================
pause
goto MENU

:EXIT
cls
echo.
echo Thank you for using Discord Lua Bot v2.0!
echo.
timeout /t 2 >nul
exit
