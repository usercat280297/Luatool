// ============================================
// DISCORD LUA BOT - ENHANCED VERSION 2.0
// Multi-source data + Auto-delete + Online-Fix
// ============================================
require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
  BOT_TOKEN: process.env.BOT_TOKEN,
  STEAM_API_KEY: process.env.STEAM_API_KEY,
  COMMAND_PREFIX: '!',
  
  LUA_FILES_PATH: './lua_files',
  FIX_FILES_PATH: './fix_files',
  ONLINE_FIX_PATH: './online_fix',
  LOGS_PATH: './logs',
  DATABASE_PATH: './database.json',
  GAME_INFO_CACHE_PATH: './game_info_cache.json',
  
  ADMIN_USER_IDS: ['898595655562432584'],
  MAX_FILE_SIZE_MB: 25,
  CACHE_DURATION: 43200000, // 12 hours
  
  // AUTO-DELETE: Messages tự xóa sau 5 phút
  AUTO_DELETE_TIMEOUT: 5 * 60 * 1000, // 5 minutes
  ENABLE_AUTO_DELETE: true,
};

// ============================================
// EXPANDED DRM DATABASE (2024-2025 Games)
// ============================================
const VERIFIED_DRM = {
  // ⚠️ DENUVO GAMES - EXPANDED LIST (60+ games)
  denuvo: [
    // 2026 Games
    2852190, // Monster Hunter Stories 3: Twisted Reflection
    4115450, // Phantom Blade Zero
    3764200, // Resident Evil Requiem
    3937550, // Yakuza Kiwami 3 & Dark Ties
    2362060, // CODE VEIN II
    2499860, // DRAGON QUEST VII Reimagined
    1984270, // Digimon Story Time Stranger
    3014320, // OCTOPATH TRAVELER 0

    // 2025 Games
    3357650, // PRAGMATA
    1941540, // Mafia: The Old Country
    3551340, // Football Manager 26
    3274580, // Anno 117: Pax Romana
    2958130, // Jurassic World Evolution 3
    3017860, // DOOM: The Dark Ages
    3059520, // F1 25
    2638890, // Onimusha: Way of the Sword
    3046600, // Onimusha 2: Samurai's Destiny
    3489700, // Stellar Blade (PC)
    3472040, // NBA 2K26
    3405690, // EA Sports FC 26
    2893570, // Dragon Quest I & II HD-2D
    1984270, // Digimon Story: Time Stranger
    1285190, // Borderlands 4
    
    // 2024 Major Releases
    2208920, // Assassin's Creed Valhalla
    1971870, // Mortal Kombat 1
    1778820, // Tekken 8
    2358720, // Black Myth: Wukong
    2054970, // Dragon's Dogma 2
    2161700, // Persona 3 Reload
    1687950, // Persona 5 Royal
    3595270, // Call of Duty: Modern Warfare III
    2124490, // Silent Hill 2 Remake
    2842040, // Star Wars Outlaws
    3738540, // Hades II (Early Access)
    1174180, // Red Dead Redemption 2
    315210, // Suicide Squad: Kill the Justice League
    2751000, // Prince of Persia: The Lost Crown
    1426210, // It Takes Two
    990080, // Hogwarts Legacy

    // Sports Games
    2669320, // EA Sports FC 25
    2488620, // F1 24
    1785650, // TopSpin 2K25
    2878980, // NBA 2K25
    
    // Capcom Games
    2050650, // Resident Evil 4 Remake
    1364780, // Street Fighter 6
    1196590, // Resident Evil Village
    
    // Square Enix
    2515020, // Final Fantasy XVI
    2909400, // Final Fantasy VII Rebirth
    1680880, // Forspoken
    
    // SEGA/Atlus
    2072450, // Like a Dragon: Infinite Wealth
    1875830, // Shin Megami Tensei V: Vengeance
    2679460, // Metaphor: ReFantazio
    
    // Ubisoft Games
    2853730, // Skull and Bones
    2840770, // Avatar: Frontiers of Pandora
    
    // Others
    1593500, // God of War
    1817070, // Spider-Man Remastered
    1817190, // Spider-Man: Miles Morales
    1086940, // Baldur's Gate 3
    2246340, // Monster Hunter Wilds
    1282100, // Remnant II
    1716740, // Starfield
    934700, // Dead Island 2
    1544020, // The Callisto Protocol
  ],
  
  // EasyAntiCheat Games
  easyAntiCheat: [
    1517290, // Battlefield 2042
    1172470, // Apex Legends
    1665460, // eFootball
    730,     // Counter-Strike 2
    1086940, // Baldur's Gate 3 (multiplayer)
    892970,  // Valheim
    1623730, // Palworld (multiplayer)
  ],
  
  // BattlEye Anti-Cheat
  battleye: [
    578080,  // PUBG: Battlegrounds
    230410,  // Warframe
    252490,  // Rust
    1966720, // Starfield
    1938090, // Escape from Tarkov
    728880,  // Overwatch 2
  ],
  
  // ✅ VERIFIED DRM-FREE GAMES
  drmFree: [
    1623730, // Palworld
    413150,  // Stardew Valley
    1091500, // Cyberpunk 2077 (GOG)
    3590,    // Plants vs. Zombies GOTY
    367520,  // Hollow Knight
    646570,  // Slay the Spire
    892970,  // Valheim (DRM-free on GOG)
    1245620, // Elden Ring (Steam DRM only)
  ],
  
  // 🌐 NEEDS ONLINE-FIX
  needsOnlineFix: [
    2246460, // Monster Hunter Wilds
    1174180, // Red Dead Redemption 2
    1086940, // Baldur's Gate 3
    1426210, // It Takes Two
    1245620, // Elden Ring
    1091500, // Cyberpunk 2077
    271590,  // Grand Theft Auto V
    1938090, // Call of Duty: Modern Warfare III
    2519830, // Tekken 8
    2358720, // Mortal Kombat 1
    1517290, // Battlefield 2042
    1172470, // Apex Legends
    578080,  // PUBG
    730,     // CS2
    1623730, // Palworld
    892970,  // Valheim
    1966720, // Starfield
    2050650, // Persona 3 Reload
  ],
};

// ============================================
// ICONS & STYLING
// ============================================
const ICONS = {
  // General
  game: '🎮', link: '🔗', check: '✅', cross: '❌', 
  warning: '⚠️', info: 'ℹ️', sparkles: '✨', fire: '🔥',
  
  // Game Info
  price: '💰', size: '💾', date: '📅', dlc: '🎯',
  language: '🌍', review: '⭐',
  
  // DRM Types
  denuvo: '🚫', antiCheat: '🛡️', drm: '🔒', 
  drmFree: '🆓', online: '🌐',
  
  // Publisher/Developer
  developer: '👨‍💻', publisher: '🏢',
  
  // Downloads
  download: '⬇️', lua: '📜', fix: '🔧', onlineFix: '🌐',
  
  // Platforms
  windows: '🪟', mac: '🍎', linux: '🐧',
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

let database = { games: {}, stats: { totalDownloads: 0, totalSearches: 0 } };
let gameInfoCache = {};

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

function initializeFolders() {
  [CONFIG.LUA_FILES_PATH, CONFIG.FIX_FILES_PATH, 
   CONFIG.ONLINE_FIX_PATH, CONFIG.LOGS_PATH].forEach(folder => {
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
  });
}

function loadDatabase() {
  if (fs.existsSync(CONFIG.DATABASE_PATH)) {
    try {
      database = JSON.parse(fs.readFileSync(CONFIG.DATABASE_PATH, 'utf8'));
      console.log('✅ Loaded database');
    } catch (error) {
      console.error('❌ Error loading database:', error);
    }
  }
}

function saveDatabase() {
  try {
    fs.writeFileSync(CONFIG.DATABASE_PATH, JSON.stringify(database, null, 2));
  } catch (error) {
    console.error('❌ Error saving database:', error);
  }
}

function loadGameInfoCache() {
  if (fs.existsSync(CONFIG.GAME_INFO_CACHE_PATH)) {
    try {
      gameInfoCache = JSON.parse(fs.readFileSync(CONFIG.GAME_INFO_CACHE_PATH, 'utf8'));
      console.log(`✅ Loaded ${Object.keys(gameInfoCache).length} cached games`);
    } catch (error) {
      console.error('❌ Error loading cache:', error);
    }
  }
}

function saveGameInfoCache() {
  try {
    fs.writeFileSync(CONFIG.GAME_INFO_CACHE_PATH, JSON.stringify(gameInfoCache, null, 2));
  } catch (error) {
    console.error('❌ Error saving cache:', error);
  }
}

function log(type, message, data = {}) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${type}] ${message}`);
  
  try {
    const logFile = path.join(CONFIG.LOGS_PATH, `${new Date().toISOString().split('T')[0]}.log`);
    fs.appendFileSync(logFile, JSON.stringify({ timestamp, type, message, ...data }) + '\n');
  } catch (error) {}
}

function isAdmin(userId) {
  return CONFIG.ADMIN_USER_IDS.includes(userId);
}

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return 'Unknown';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function formatPrice(priceData) {
  if (!priceData) return 'N/A';
  if (priceData.is_free) return 'Free to Play';
  return priceData.final_formatted || 'N/A';
}

function formatNumber(num) {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

// ============================================
// AUTO-DELETE FUNCTION
// ============================================
function scheduleMessageDeletion(message) {
  if (!CONFIG.ENABLE_AUTO_DELETE) return;
  
  setTimeout(async () => {
    try {
      await message.delete();
      log('INFO', 'Auto-deleted message', { 
        messageId: message.id,
        age: '5 minutes'
      });
    } catch (error) {
      log('WARN', 'Failed to auto-delete message', { 
        error: error.message 
      });
    }
  }, CONFIG.AUTO_DELETE_TIMEOUT);
}

// ============================================
// API SOURCES
// ============================================
const API_SOURCES = {
  steamStore: (appId) => `https://store.steampowered.com/api/appdetails?appids=${appId}&l=english`,
  steamSpy: (appId) => `https://steamspy.com/api.php?request=appdetails&appid=${appId}`,
  pcgw: (gameName) => `https://www.pcgamingwiki.com/w/api.php?action=cargoquery&tables=Infobox_game&fields=DRM&where=Infobox_game.Steam_AppID='${gameName}'&format=json`,
  steamDB: (appId) => `https://steamdb.info/app/${appId}/depots/`,
};

// ============================================
// MULTI-SOURCE API FETCHING
// ============================================

async function fetchSteamStoreData(appId) {
  try {
    const response = await axios.get(API_SOURCES.steamStore(appId), { timeout: 10000 });
    
    if (!response.data[appId]?.success) return null;
    
    const data = response.data[appId].data;
    
    return {
      appId: appId,
      name: data.name,
      type: data.type,
      shortDescription: data.short_description,
      headerImage: data.header_image,
      developers: data.developers || [],
      publishers: data.publishers || [],
      releaseDate: data.release_date?.date || 'TBA',
      price: data.is_free ? 'Free to Play' : (data.price_overview?.final_formatted || 'N/A'),
      priceRaw: data.price_overview?.final || 0,
      currency: data.price_overview?.currency || 'USD',
      isFree: data.is_free || false,
      dlcCount: data.dlc?.length || 0,
      categories: data.categories?.map(c => c.description) || [],
      genres: data.genres?.map(g => g.description) || [],
      platforms: {
        windows: data.platforms?.windows || false,
        mac: data.platforms?.mac || false,
        linux: data.platforms?.linux || false,
      },
      metacriticScore: data.metacritic?.score || null,
      recommendations: data.recommendations?.total || 0,
      supportedLanguages: data.supported_languages || '',
      screenshots: data.screenshots?.slice(0, 3).map(s => s.path_full) || [],
      movies: data.movies?.slice(0, 1).map(m => m.webm?.max || m.mp4?.max) || [],
    };
    
  } catch (error) {
    log('ERROR', `Failed to fetch Steam store data for ${appId}`, { error: error.message });
    return null;
  }
}

async function fetchSteamSpyData(appId) {
  try {
    const response = await axios.get(API_SOURCES.steamSpy(appId), { timeout: 10000 });
    
    if (response.data && response.data.appid) {
      return {
        owners: response.data.owners || 'Unknown',
        averagePlaytime: response.data.average_forever || 0,
        medianPlaytime: response.data.median_forever || 0,
        ccu: response.data.ccu || 0,
      };
    }
    
    return null;
  } catch (error) {
    log('WARN', `SteamSpy data unavailable for ${appId}`, { error: error.message });
    return null;
  }
}

async function getAccurateGameSize(appId) {
  const htmlSize = await getSizeFromSteamHTML(appId);
  if (htmlSize) return htmlSize;
  
  const steamDBSize = await getSizeFromSteamDB(appId);
  if (steamDBSize) return steamDBSize;
  
  const knownSize = getKnownGameSize(appId);
  if (knownSize) return knownSize;
  
  log('WARN', `All size detection methods failed for ${appId}`);
  return null;
}

async function getSizeFromSteamHTML(appId) {
  try {
    const response = await axios.get(`https://store.steampowered.com/app/${appId}`, {
      timeout: 8000,
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const html = response.data;
    
    const patterns = [
      /Storage:\s*(\d+(?:\.\d+)?)\s*(GB|MB)\s+available/i,
      /Storage:\s*(\d+(?:\.\d+)?)\s*(GB|MB)/i,
      /(\d+(?:\.\d+)?)\s*(GB|MB)\s+available\s+space/i,
      /Hard\s+Drive:\s*(\d+(?:\.\d+)?)\s*(GB|MB)/i,
      /<strong>Minimum:<\/strong>[\s\S]{0,500}?(\d+(?:\.\d+)?)\s*GB/i,
    ];
    
    for (const pattern of patterns) {
      const sizeMatch = html.match(pattern);
      if (sizeMatch) {
        const size = parseFloat(sizeMatch[1]);
        const unit = sizeMatch[2]?.toUpperCase() || 'GB';
        
        if (size >= 0.5 && size <= 500) {
          const bytes = unit === 'GB' ? size * 1024 * 1024 * 1024 : size * 1024 * 1024;
          log('SUCCESS', `Got size from HTML: ${size} ${unit}`);
          return bytes;
        }
      }
    }
    
    return null;
  } catch (error) {
    log('WARN', `HTML scraping failed for ${appId}`, { error: error.message });
    return null;
  }
}

async function getSizeFromSteamDB(appId) {
  try {
    const response = await axios.get(`https://steamdb.info/app/${appId}/`, {
      timeout: 5000,
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const html = response.data;
    const sizeMatch = html.match(/Download\s+Size[:\s]+(\d+(?:\.\d+)?)\s*(GB|MB)/i);
    
    if (sizeMatch) {
      const size = parseFloat(sizeMatch[1]);
      const unit = sizeMatch[2].toUpperCase();
      const bytes = unit === 'GB' ? size * 1024 * 1024 * 1024 : size * 1024 * 1024;
      log('SUCCESS', `Got size from SteamDB: ${size} ${unit}`);
      return bytes;
    }
    
    return null;
  } catch (error) {
    log('WARN', `SteamDB fetch failed for ${appId}`, { error: error.message });
    return null;
  }
}

function getKnownGameSize(appId) {
  const KNOWN_SIZES = {
    // 2024-2025 AAA Games
    2358720: 100 * 1024 * 1024 * 1024, // Mortal Kombat 1
    2519830: 100 * 1024 * 1024 * 1024, // Tekken 8
    2245450: 120 * 1024 * 1024 * 1024, // Black Myth: Wukong
    1623730: 25 * 1024 * 1024 * 1024,  // Palworld
    2399830: 148 * 1024 * 1024 * 1024, // Dragon's Dogma 2
    1086940: 150 * 1024 * 1024 * 1024, // Baldur's Gate 3
    2246460: 140 * 1024 * 1024 * 1024, // Monster Hunter Wilds
    1174180: 150 * 1024 * 1024 * 1024, // Red Dead Redemption 2
    1091500: 70 * 1024 * 1024 * 1024,  // Cyberpunk 2077
    2357570: 60 * 1024 * 1024 * 1024,  // Elden Ring
    1966720: 125 * 1024 * 1024 * 1024, // Starfield
    1938090: 149 * 1024 * 1024 * 1024, // Call of Duty: MW III
    1593500: 70 * 1024 * 1024 * 1024,  // God of War
    1817190: 75 * 1024 * 1024 * 1024,  // Spider-Man
    2050650: 100 * 1024 * 1024 * 1024, // Persona 3 Reload
    2124490: 50 * 1024 * 1024 * 1024,  // Silent Hill 2 Remake
    
    // Popular Games
    413150: 500 * 1024 * 1024,         // Stardew Valley
    1426210: 50 * 1024 * 1024 * 1024,  // It Takes Two
    892970: 1 * 1024 * 1024 * 1024,    // Valheim
    730: 85 * 1024 * 1024 * 1024,      // CS2
    1172470: 75 * 1024 * 1024 * 1024,  // Apex Legends
    578080: 40 * 1024 * 1024 * 1024,   // PUBG
  };
  
  const numAppId = parseInt(appId);
  if (KNOWN_SIZES[numAppId]) {
    log('SUCCESS', `Got size from known database: ${formatFileSize(KNOWN_SIZES[numAppId])}`);
    return KNOWN_SIZES[numAppId];
  }
  
  return null;
}

function detectDRMAccurate(appId, steamData) {
  const numAppId = parseInt(appId);
  
  const drmInfo = {
    type: 'None',
    hasDenuvo: false,
    hasEAC: false,
    hasBattlEye: false,
    hasEAAntiCheat: false,
    hasSteamDRM: false,
    isDRMFree: true,
    severity: 'none',
    icon: ICONS.drmFree,
    needsOnlineFix: false,
  };
  
  if (VERIFIED_DRM.drmFree.includes(numAppId)) {
    drmInfo.type = 'DRM-Free';
    drmInfo.isDRMFree = true;
    drmInfo.severity = 'none';
    drmInfo.icon = ICONS.drmFree;
    return drmInfo;
  }
  
  if (VERIFIED_DRM.denuvo.includes(numAppId)) {
    drmInfo.hasDenuvo = true;
    drmInfo.type = 'Denuvo Anti-Tamper';
    drmInfo.severity = 'critical';
    drmInfo.icon = ICONS.denuvo;
    drmInfo.isDRMFree = false;
    return drmInfo;
  }
  
  if (VERIFIED_DRM.easyAntiCheat.includes(numAppId)) {
    drmInfo.hasEAC = true;
    drmInfo.type = 'EasyAntiCheat';
    drmInfo.severity = 'warning';
    drmInfo.icon = ICONS.antiCheat;
    drmInfo.isDRMFree = false;
  }
  
  if (VERIFIED_DRM.battleye.includes(numAppId)) {
    drmInfo.hasBattlEye = true;
    drmInfo.type = 'BattlEye Anti-Cheat';
    drmInfo.severity = 'warning';
    drmInfo.icon = ICONS.antiCheat;
    drmInfo.isDRMFree = false;
  }
  
  if (VERIFIED_DRM.needsOnlineFix.includes(numAppId)) {
    drmInfo.needsOnlineFix = true;
  }
  
  if (drmInfo.isDRMFree && steamData?.categories) {
    const hasMultiplayer = steamData.categories.some(cat => 
      ['multiplayer', 'multi-player', 'co-op', 'online'].some(kw => 
        cat.toLowerCase().includes(kw)
      )
    );
    
    if (hasMultiplayer) {
      drmInfo.hasSteamDRM = true;
      drmInfo.type = 'Steam DRM';
      drmInfo.severity = 'info';
      drmInfo.icon = ICONS.drm;
      drmInfo.isDRMFree = false;
      
      if (!VERIFIED_DRM.drmFree.includes(numAppId)) {
        drmInfo.needsOnlineFix = true;
      }
    }
  }
  
  if (drmInfo.isDRMFree && !VERIFIED_DRM.drmFree.includes(numAppId)) {
    drmInfo.hasSteamDRM = true;
    drmInfo.type = 'Steam DRM';
    drmInfo.severity = 'info';
    drmInfo.icon = ICONS.drm;
    drmInfo.isDRMFree = false;
  }
  
  return drmInfo;
}

function detectPublisher(publishers) {
  if (!publishers || publishers.length === 0) {
    return { name: 'Unknown', isEA: false, isUbisoft: false };
  }
  
  const pub = publishers[0];
  
  return {
    name: pub,
    isEA: ['Electronic Arts', 'EA Games', 'EA Sports'].some(ea => pub.includes(ea)),
    isUbisoft: pub.includes('Ubisoft'),
    isActivision: pub.includes('Activision'),
    isRockstar: pub.includes('Rockstar'),
  };
}

async function getFullGameInfo(appId) {
  const cached = gameInfoCache[appId];
  if (cached && (Date.now() - cached.timestamp < CONFIG.CACHE_DURATION)) {
    log('INFO', `Using cached data for ${appId}`);
    return cached.data;
  }
  
  log('INFO', `Fetching fresh data for ${appId} from multiple sources...`);
  
  const steamData = await fetchSteamStoreData(appId);
  if (!steamData) return null;
  
  const steamSpyData = await fetchSteamSpyData(appId);
  const accurateSize = await getAccurateGameSize(appId);
  const drmInfo = detectDRMAccurate(appId, steamData);
  const publisherInfo = detectPublisher(steamData.publishers);
  
  const languageCount = steamData.supportedLanguages
    ? steamData.supportedLanguages.split(',').filter(l => l.trim()).length
    : 0;
  
  const fullInfo = {
    ...steamData,
    drm: drmInfo,
    publisher: publisherInfo,
    size: accurateSize,
    sizeFormatted: formatFileSize(accurateSize),
    languageCount: languageCount,
    steamSpy: steamSpyData,
    
    isEAGame: publisherInfo.isEA,
    hasMultiplayer: steamData.categories?.some(c => 
      c.toLowerCase().includes('multi') || c.toLowerCase().includes('co-op')
    ),
    isEarlyAccess: steamData.categories?.some(c => 
      c.toLowerCase().includes('early access')
    ),
    
    lastUpdated: Date.now(),
  };
  
  gameInfoCache[appId] = {
    data: fullInfo,
    timestamp: Date.now(),
  };
  saveGameInfoCache();
  
  log('SUCCESS', `Got full info for ${steamData.name}`, {
    size: fullInfo.sizeFormatted,
    drm: drmInfo.type,
    price: steamData.price,
  });
  
  return fullInfo;
}

// ============================================
// FILE MANAGEMENT - ENHANCED WITH ONLINE-FIX
// ============================================

function findFiles(appId) {
  const result = { lua: [], fix: [], onlineFix: [] };
  
  const patterns = {
    lua: [
      path.join(CONFIG.LUA_FILES_PATH, `${appId}.lua`),
      path.join(CONFIG.LUA_FILES_PATH, appId, 'game.lua'),
    ],
    fix: [
      path.join(CONFIG.FIX_FILES_PATH, `${appId}.rar`),
      path.join(CONFIG.FIX_FILES_PATH, `${appId}.zip`),
      path.join(CONFIG.FIX_FILES_PATH, `${appId}.7z`),
    ],
    onlineFix: [
      path.join(CONFIG.ONLINE_FIX_PATH, `${appId}.rar`),
      path.join(CONFIG.ONLINE_FIX_PATH, `${appId}.zip`),
      path.join(CONFIG.ONLINE_FIX_PATH, `${appId}.7z`),
      path.join(CONFIG.ONLINE_FIX_PATH, appId, 'online-fix.rar'),
      path.join(CONFIG.ONLINE_FIX_PATH, appId, 'online-fix.zip'),
    ],
  };
  
  for (const [type, paths] of Object.entries(patterns)) {
    for (const filePath of paths) {
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        result[type].push({
          path: filePath,
          name: path.basename(filePath),
          size: stats.size,
          sizeFormatted: formatFileSize(stats.size),
        });
      }
    }
  }
  
  return result;
}

function scanAllGames() {
  const games = new Set();
  
  function scanFolder(folder) {
    if (!fs.existsSync(folder)) return;
    fs.readdirSync(folder).forEach(item => {
      const match = item.match(/(\d{6,8})/);
      if (match) games.add(match[1]);
    });
  }
  
  scanFolder(CONFIG.LUA_FILES_PATH);
  scanFolder(CONFIG.FIX_FILES_PATH);
  scanFolder(CONFIG.ONLINE_FIX_PATH);
  
  return Array.from(games).sort();
}

// ============================================
// IMPROVED EMBED CREATION
// ============================================

async function createGameEmbed(appId, gameInfo, files) {
  const embed = new EmbedBuilder();
  
  embed.setTitle(`${ICONS.game} ${gameInfo.name}`)
    .setURL(`https://store.steampowered.com/app/${appId}`)
    .setThumbnail(gameInfo.headerImage);
  
  const colors = {
    critical: 0xFF0000,  // Denuvo - Red
    warning: 0xFFA500,   // Anti-cheat - Orange
    info: 0x4A90E2,      // Steam DRM - Blue
    none: 0x00FF00,      // DRM-Free - Green
  };
  embed.setColor(colors[gameInfo.drm.severity] || 0x5865F2);
  
  let description = `${ICONS.link} **[View on Steam](https://store.steampowered.com/app/${appId})**\n`;
  
  if (gameInfo.shortDescription) {
    const desc = gameInfo.shortDescription.length > 120 
      ? gameInfo.shortDescription.substring(0, 120) + '...'
      : gameInfo.shortDescription;
    description += `\n${desc}\n`;
  }
  
  embed.setDescription(description);
  
  // ===== MAIN INFO SECTION =====
  embed.addFields(
    { 
      name: `${ICONS.price} Price`, 
      value: `**${gameInfo.price}**`, 
      inline: true 
    },
    { 
      name: `${ICONS.size} Size`, 
      value: `**${gameInfo.sizeFormatted || 'Unknown'}**`, 
      inline: true 
    },
    { 
      name: `${ICONS.date} Release`, 
      value: `**${gameInfo.releaseDate}**`, 
      inline: true 
    }
  );
  
  embed.addFields(
    { 
      name: `${ICONS.dlc} DLCs`, 
      value: `${gameInfo.dlcCount}`, 
      inline: true 
    },
    { 
      name: `${ICONS.language} Languages`, 
      value: `${gameInfo.languageCount}`, 
      inline: true 
    },
    { 
      name: `${ICONS.review} Reviews`, 
      value: formatNumber(gameInfo.recommendations), 
      inline: true 
    }
  );
  
  // ===== SEPARATOR =====
  embed.addFields({ 
    name: '\u200B', 
    value: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 
    inline: false 
  });
  
  // ===== DRM WARNING SECTION =====
  if (gameInfo.drm.severity === 'critical') {
    embed.addFields({
      name: `${ICONS.denuvo} **⚠️ DENUVO DETECTED**`,
      value: `❌ **This game has DENUVO Anti-Tamper**\n${ICONS.warning} You may **NOT** be able to play this game!\n${ICONS.info} Denuvo protection is extremely difficult to bypass.`,
      inline: false
    });
  } else if (gameInfo.drm.severity === 'warning') {
    const acName = gameInfo.drm.hasEAC ? 'EasyAntiCheat' :
                   gameInfo.drm.hasBattlEye ? 'BattlEye' : 'Anti-Cheat';
    embed.addFields({
      name: `${ICONS.antiCheat} **${acName} Detected**`,
      value: `${ICONS.warning} Requires special bypass process to work properly.`,
      inline: false
    });
  } else if (gameInfo.drm.isDRMFree) {
    embed.addFields({
      name: `${ICONS.drmFree} **✅ DRM-FREE GAME**`,
      value: `${ICONS.check} This game has no DRM protection!\n${ICONS.sparkles} Should work without issues!`,
      inline: false
    });
  }
  
  // Online-Fix Status
  if (gameInfo.drm.needsOnlineFix) {
    if (files.onlineFix.length > 0) {
      embed.addFields({
        name: `${ICONS.onlineFix} **Online-Fix Available**`,
        value: `${ICONS.check} Online-Fix file detected! Download below for multiplayer/co-op.`,
        inline: false
      });
    } else {
      embed.addFields({
        name: `${ICONS.online} **⚠️ Online Features Unavailable**`,
        value: `${ICONS.cross} No Online-Fix available. Multiplayer/Co-op won't work.\n${ICONS.info} Single-player should work fine.`,
        inline: false
      });
    }
  }
  
  if (gameInfo.isEAGame) {
    embed.addFields({
      name: `${ICONS.warning} **EA Game Notice**`,
      value: 'May require Origin/EA App for full functionality.',
      inline: false
    });
  }
  
  // ===== SEPARATOR =====
  embed.addFields({ 
    name: '\u200B', 
    value: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 
    inline: false 
  });
  
  // ===== METADATA SECTION =====
  embed.addFields(
    { 
      name: `${ICONS.developer} Developer`, 
      value: gameInfo.developers[0] || 'Unknown', 
      inline: true 
    },
    { 
      name: `${ICONS.publisher} Publisher`, 
      value: gameInfo.publisher.name, 
      inline: true 
    },
    { 
      name: `${gameInfo.drm.icon} DRM Type`, 
      value: `**${gameInfo.drm.type}**`, 
      inline: true 
    }
  );
  
  // ===== SEPARATOR =====
  embed.addFields({ 
    name: '\u200B', 
    value: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 
    inline: false 
  });
  
  // ===== DOWNLOAD SECTION =====
  const fileStatus = [];
  if (files.lua.length > 0) fileStatus.push(`${ICONS.lua} Lua Script Available`);
  if (files.fix.length > 0) fileStatus.push(`${ICONS.fix} Crack/Fix Available`);
  if (files.onlineFix.length > 0) fileStatus.push(`${ICONS.onlineFix} Online-Fix Available`);
  
  if (fileStatus.length > 0) {
    embed.addFields({
      name: `${ICONS.download} **📥 AVAILABLE DOWNLOADS**`,
      value: fileStatus.map(s => `✅ ${s}`).join('\n'),
      inline: false
    });
    
    embed.addFields({
      name: `${ICONS.sparkles} **⬇️ CLICK BUTTONS BELOW TO DOWNLOAD** ${ICONS.sparkles}`,
      value: '_ _',
      inline: false
    });
  } else {
    embed.addFields({
      name: `${ICONS.cross} **No Files Available**`,
      value: 'No files found for this game.',
      inline: false
    });
  }
  
  // ===== FOOTER =====
  const currentYear = new Date().getFullYear();
  embed.setFooter({ 
    text: `AppID: ${appId} • Enhanced Bot v2.0 © ${currentYear} • Auto-deletes in 5min` 
  });
  
  embed.setTimestamp();
  
  if (gameInfo.screenshots && gameInfo.screenshots[0]) {
    embed.setImage(gameInfo.screenshots[0]);
  }
  
  return embed;
}

// ============================================
// COMMAND: GAME INFO
// ============================================

async function handleGameCommand(message, appId) {
  try {
    const loadingMsg = await message.reply(`${ICONS.info} Loading game info from Steam API...`);
    
    // Schedule deletion of loading message
    scheduleMessageDeletion(loadingMsg);
    
    const files = findFiles(appId);
    const hasFiles = files.lua.length > 0 || files.fix.length > 0 || files.onlineFix.length > 0;
    
    if (!hasFiles) {
      return loadingMsg.edit(
        `${ICONS.cross} No files found for AppID: \`${appId}\`\n` +
        `${ICONS.info} Tip: Use \`!search <game name>\` to find games.`
      );
    }
    
    const gameInfo = await getFullGameInfo(appId);
    
    if (!gameInfo) {
      return loadingMsg.edit(
        `${ICONS.cross} Cannot fetch info from Steam for AppID: \`${appId}\`\n` +
        `${ICONS.link} Link: https://store.steampowered.com/app/${appId}`
      );
    }
    
    const embed = await createGameEmbed(appId, gameInfo, files);
    
    // Create download buttons
    const rows = [];
    const row = new ActionRowBuilder();
    
    if (files.lua.length > 0) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`dl_lua_${appId}_0`)
          .setLabel(`📜 LUA SCRIPT`)
          .setStyle(ButtonStyle.Primary)
          .setEmoji('⬇️')
      );
    }
    
    if (files.fix.length > 0) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`dl_fix_${appId}_0`)
          .setLabel(`🔧 CRACK/FIX`)
          .setStyle(ButtonStyle.Success)
          .setEmoji('⬇️')
      );
    }
    
    if (files.onlineFix.length > 0) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`dl_online_${appId}_0`)
          .setLabel(`🌐 ONLINE-FIX`)
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('⬇️')
      );
    }
    
    if (row.components.length > 0) {
      rows.push(row);
    }
    
    const responseMsg = await loadingMsg.edit({
      content: null,
      embeds: [embed],
      components: rows,
    });
    
    // Schedule deletion of response message
    scheduleMessageDeletion(responseMsg);
    
    // Update stats
    database.stats.totalSearches++;
    if (!database.games[appId]) {
      database.games[appId] = {
        name: gameInfo.name,
        downloads: 0,
        lastAccessed: Date.now(),
      };
    }
    database.games[appId].lastAccessed = Date.now();
    saveDatabase();
    
    log('INFO', `Game displayed: ${gameInfo.name}`, {
      user: message.author.tag,
      drm: gameInfo.drm.type,
      size: gameInfo.sizeFormatted,
    });
    
  } catch (error) {
    log('ERROR', 'Error in handleGameCommand', { 
      appId, 
      error: error.message,
      stack: error.stack 
    });
    message.reply(`${ICONS.cross} Error occurred! Please try again later.`).catch(() => {});
  }
}

// ============================================
// COMMAND: SEARCH
// ============================================

async function searchGameByName(query) {
  try {
    const searchUrl = `https://steamcommunity.com/actions/SearchApps/${encodeURIComponent(query)}`;
    const response = await axios.get(searchUrl, { timeout: 10000 });
    
    if (response.data && response.data.length > 0) {
      return response.data.slice(0, 5).map(game => ({
        appId: game.appid,
        name: game.name,
      }));
    }
    
    return [];
  } catch (error) {
    log('ERROR', 'Failed to search games', { query, error: error.message });
    return [];
  }
}

async function handleSearchCommand(message, query) {
  try {
    const loadingMsg = await message.reply(`${ICONS.info} Searching...`);
    scheduleMessageDeletion(loadingMsg);
    
    const results = await searchGameByName(query);
    
    if (results.length === 0) {
      return loadingMsg.edit(`${ICONS.cross} No games found: "${query}"`);
    }
    
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(`${ICONS.game} Search Results: "${query}"`)
      .setDescription(`Found ${results.length} game(s). Use \`!<appid>\` to view details.`);
    
    results.forEach((game, index) => {
      embed.addFields({
        name: `${index + 1}. ${game.name}`,
        value: `AppID: \`${game.appId}\` • Command: \`!${game.appId}\``,
        inline: false
      });
    });
    
    embed.setFooter({ text: 'Click AppID to view full info • Auto-deletes in 5min' });
    
    await loadingMsg.edit({ embeds: [embed] });
    
    database.stats.totalSearches++;
    saveDatabase();
    
  } catch (error) {
    log('ERROR', 'Error in handleSearchCommand', { query, error: error.message });
    message.reply(`${ICONS.cross} Error occurred!`).catch(() => {});
  }
}

// ============================================
// OTHER COMMANDS
// ============================================

async function handleHelpCommand(message) {
  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle(`${ICONS.game} Discord Lua Bot - Enhanced v2.0`)
    .setDescription('Bot với nhiều tính năng mới: Auto-delete, Online-Fix, Expanded DRM database')
    .addFields(
      {
        name: `${ICONS.sparkles} Commands`,
        value: [
          `\`${CONFIG.COMMAND_PREFIX}<appid>\` - View full game info`,
          `\`${CONFIG.COMMAND_PREFIX}search <name>\` - Search games`,
          `\`${CONFIG.COMMAND_PREFIX}list\` - List available games`,
          `\`${CONFIG.COMMAND_PREFIX}help\` - Show this help`,
        ].join('\n')
      },
      {
        name: `${ICONS.fire} New Features v2.0`,
        value: [
          `${ICONS.check} Auto-delete messages after 5 minutes`,
          `${ICONS.check} Online-Fix integration`,
          `${ICONS.check} Expanded Denuvo database (60+ games)`,
          `${ICONS.check} Improved embed design`,
          `${ICONS.check} Better file detection`,
        ].join('\n')
      },
      {
        name: `${ICONS.info} Examples`,
        value: [
          '`!1623730` - Palworld',
          '`!2245450` - Black Myth: Wukong',
          '`!search tekken` - Search Tekken games',
        ].join('\n')
      }
    )
    .setFooter({ text: `Enhanced Bot v2.0 © ${new Date().getFullYear()} • Messages auto-delete in 5min` })
    .setTimestamp();
  
  if (isAdmin(message.author.id)) {
    embed.addFields({
      name: `${ICONS.warning} Admin Commands`,
      value: [
        '`!stats` - View statistics',
        '`!reload` - Reload database',
        '`!clearcache` - Clear cache',
        '`!toggleautodelete` - Toggle auto-delete',
      ].join('\n')
    });
  }
  
  const helpMsg = await message.reply({ embeds: [embed] });
  scheduleMessageDeletion(helpMsg);
}

async function handleListCommand(message) {
  const allGames = scanAllGames();
  
  if (allGames.length === 0) {
    return message.reply(`${ICONS.cross} No games available yet!`);
  }
  
  const embed = new EmbedBuilder()
    .setColor(0x2ECC71)
    .setTitle(`${ICONS.game} Available Games`)
    .setDescription(`${ICONS.fire} Total: ${allGames.length} game(s)`)
    .addFields({
      name: 'AppIDs',
      value: allGames.slice(0, 20).map(id => `\`${id}\``).join(', ') + 
             (allGames.length > 20 ? `\n... and ${allGames.length - 20} more games` : '')
    })
    .setFooter({ text: 'Use !<appid> to view details • Auto-deletes in 5min' });
  
  const listMsg = await message.reply({ embeds: [embed] });
  scheduleMessageDeletion(listMsg);
}

async function handleStatsCommand(message) {
  if (!isAdmin(message.author.id)) {
    return message.reply(`${ICONS.cross} Admin only!`);
  }
  
  const totalGames = Object.keys(database.games).length;
  const cachedGames = Object.keys(gameInfoCache).length;
  
  const embed = new EmbedBuilder()
    .setColor(0xFFAA00)
    .setTitle(`${ICONS.fire} Bot Statistics`)
    .addFields(
      { name: `${ICONS.game} Total Games`, value: `${totalGames}`, inline: true },
      { name: `${ICONS.size} Cached Games`, value: `${cachedGames}`, inline: true },
      { name: `${ICONS.download} Downloads`, value: `${database.stats.totalDownloads}`, inline: true },
      { name: `${ICONS.info} Searches`, value: `${database.stats.totalSearches}`, inline: true }
    )
    .setFooter({ text: `Bot Statistics • ${new Date().toLocaleDateString()}` })
    .setTimestamp();
  
  const statsMsg = await message.reply({ embeds: [embed] });
  scheduleMessageDeletion(statsMsg);
}

async function handleClearCacheCommand(message) {
  if (!isAdmin(message.author.id)) {
    return message.reply(`${ICONS.cross} Admin only!`);
  }
  
  gameInfoCache = {};
  saveGameInfoCache();
  
  const cacheMsg = await message.reply(`${ICONS.check} Cache cleared! All game data will be refreshed on next query.`);
  scheduleMessageDeletion(cacheMsg);
}

async function handleToggleAutoDeleteCommand(message) {
  if (!isAdmin(message.author.id)) {
    return message.reply(`${ICONS.cross} Admin only!`);
  }
  
  CONFIG.ENABLE_AUTO_DELETE = !CONFIG.ENABLE_AUTO_DELETE;
  
  const toggleMsg = await message.reply(
    `${ICONS.check} Auto-delete is now **${CONFIG.ENABLE_AUTO_DELETE ? 'ENABLED' : 'DISABLED'}**\n` +
    `${ICONS.info} Messages will ${CONFIG.ENABLE_AUTO_DELETE ? 'auto-delete after 5 minutes' : 'NOT auto-delete'}.`
  );
  
  if (CONFIG.ENABLE_AUTO_DELETE) {
    scheduleMessageDeletion(toggleMsg);
  }
}

// ============================================
// MESSAGE HANDLER
// ============================================

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(CONFIG.COMMAND_PREFIX)) return;
  
  const args = message.content.slice(CONFIG.COMMAND_PREFIX.length).trim().split(/ +/);
  const command = args[0].toLowerCase();
  
  try {
    // Help command
    if (command === 'help') {
      return handleHelpCommand(message);
    }
    
    // Search command
    if (command === 'search') {
      const query = args.slice(1).join(' ');
      if (!query) {
        const errorMsg = await message.reply(`${ICONS.cross} Usage: \`!search <game name>\``);
        scheduleMessageDeletion(errorMsg);
        return;
      }
      return handleSearchCommand(message, query);
    }
    
    // List command
    if (command === 'list') {
      return handleListCommand(message);
    }
    
    // Admin commands
    if (isAdmin(message.author.id)) {
      if (command === 'stats') {
        return handleStatsCommand(message);
      }
      
      if (command === 'reload') {
        loadDatabase();
        loadGameInfoCache();
        const reloadMsg = await message.reply(`${ICONS.check} Database and cache reloaded!`);
        scheduleMessageDeletion(reloadMsg);
        return;
      }
      
      if (command === 'clearcache') {
        return handleClearCacheCommand(message);
      }
      
      if (command === 'toggleautodelete') {
        return handleToggleAutoDeleteCommand(message);
      }
    }
    
    // Default: treat as AppID
    const appId = command.replace(/\D/g, ''); // Remove non-digits
    if (appId && appId.length >= 4) {
      return handleGameCommand(message, appId);
    }
    
    // Unknown command
    const unknownMsg = await message.reply(
      `${ICONS.cross} Unknown command! Use \`${CONFIG.COMMAND_PREFIX}help\` for help.`
    );
    scheduleMessageDeletion(unknownMsg);
    
  } catch (error) {
    log('ERROR', 'Error handling message', { 
      command: message.content, 
      error: error.message,
      stack: error.stack
    });
    
    const errorMsg = await message.reply(`${ICONS.cross} An error occurred! Please try again later.`);
    scheduleMessageDeletion(errorMsg);
  }
});

// ============================================
// BUTTON HANDLER (Download files)
// ============================================

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;
  
  const [action, type, appId, fileIdx] = interaction.customId.split('_');
  if (action !== 'dl') return;
  
  try {
    await interaction.deferReply({ ephemeral: true });
    
    const files = findFiles(appId);
    let fileToSend = null;
    
    const idx = parseInt(fileIdx);
    
    // Determine which file type to send
    if (type === 'lua' && files.lua[idx]) {
      fileToSend = files.lua[idx];
    } else if (type === 'fix' && files.fix[idx]) {
      fileToSend = files.fix[idx];
    } else if (type === 'online' && files.onlineFix[idx]) {
      fileToSend = files.onlineFix[idx];
    }
    
    if (!fileToSend || !fs.existsSync(fileToSend.path)) {
      return interaction.editReply({
        content: `${ICONS.cross} File not found!`,
        ephemeral: true
      });
    }
    
    // Check file size limit (Discord limit: 25MB for non-nitro)
    const sizeMB = fileToSend.size / (1024 * 1024);
    if (sizeMB > CONFIG.MAX_FILE_SIZE_MB) {
      return interaction.editReply({
        content: `${ICONS.cross} File too large: **${fileToSend.sizeFormatted}**\n` +
                 `${ICONS.info} Discord limit: ${CONFIG.MAX_FILE_SIZE_MB}MB\n` +
                 `${ICONS.warning} Please contact admin for alternative download method.`,
        ephemeral: true
      });
    }
    
    // Send file
    await interaction.editReply({
      content: `${ICONS.check} Sending **${fileToSend.name}** (${fileToSend.sizeFormatted})...\n` +
               `${ICONS.sparkles} Download started!`,
      files: [{ 
        attachment: fileToSend.path, 
        name: fileToSend.name 
      }],
      ephemeral: true
    });
    
    // Update download statistics
    database.stats.totalDownloads++;
    if (database.games[appId]) {
      database.games[appId].downloads = (database.games[appId].downloads || 0) + 1;
    }
    saveDatabase();
    
    log('INFO', 'File downloaded', { 
      appId, 
      fileName: fileToSend.name,
      fileType: type,
      fileSize: fileToSend.sizeFormatted,
      user: interaction.user.tag 
    });
    
  } catch (error) {
    log('ERROR', 'Error sending file', { 
      appId, 
      type,
      error: error.message,
      stack: error.stack
    });
    
    try {
      await interaction.editReply({
        content: `${ICONS.cross} Error sending file! Please try again later.`,
        ephemeral: true
      });
    } catch (e) {
      log('ERROR', 'Failed to send error message', { error: e.message });
    }
  }
});

// ============================================
// BOT READY EVENT
// ============================================

client.once('ready', () => {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 DISCORD LUA BOT - ENHANCED VERSION 2.0');
  console.log('   Multi-source data + Auto-delete + Online-Fix Integration');
  console.log('='.repeat(70));
  console.log(`✅ Logged in as: ${client.user.tag}`);
  console.log(`🎮 Bot ID: ${client.user.id}`);
  console.log(`📊 Command prefix: ${CONFIG.COMMAND_PREFIX}`);
  console.log(`🎯 Total available games: ${scanAllGames().length}`);
  console.log(`💾 Cached game info: ${Object.keys(gameInfoCache).length} games`);
  console.log(`🔄 Auto-delete: ${CONFIG.ENABLE_AUTO_DELETE ? 'ENABLED (5 min)' : 'DISABLED'}`);
  console.log(`📁 Folders:`);
  console.log(`   - Lua files: ${CONFIG.LUA_FILES_PATH}`);
  console.log(`   - Fix files: ${CONFIG.FIX_FILES_PATH}`);
  console.log(`   - Online-Fix: ${CONFIG.ONLINE_FIX_PATH}`);
  console.log('='.repeat(70) + '\n');
  
  // Set bot presence
  client.user.setPresence({
    activities: [{ 
      name: `${CONFIG.COMMAND_PREFIX}help | Enhanced v2.0 © ${new Date().getFullYear()}`,
      type: 0 // Playing
    }],
    status: 'online',
  });
  
  log('INFO', 'Bot started successfully', {
    totalGames: scanAllGames().length,
    cachedGames: Object.keys(gameInfoCache).length,
    autoDelete: CONFIG.ENABLE_AUTO_DELETE
  });
});

// ============================================
// ERROR HANDLERS
// ============================================

client.on('error', error => {
  console.error('❌ Discord client error:', error);
  log('ERROR', 'Discord client error', { 
    error: error.message,
    stack: error.stack 
  });
});

client.on('warn', warning => {
  console.warn('⚠️ Discord client warning:', warning);
  log('WARN', 'Discord client warning', { warning });
});

process.on('unhandledRejection', error => {
  console.error('❌ Unhandled promise rejection:', error);
  log('ERROR', 'Unhandled rejection', { 
    error: error.message,
    stack: error.stack 
  });
});

process.on('uncaughtException', error => {
  console.error('❌ Uncaught exception:', error);
  log('ERROR', 'Uncaught exception', { 
    error: error.message,
    stack: error.stack 
  });
});

process.on('SIGINT', () => {
  console.log('\n\n🛑 Gracefully shutting down bot...');
  console.log('💾 Saving database and cache...');
  
  saveDatabase();
  saveGameInfoCache();
  
  console.log('✅ Data saved successfully!');
  console.log('👋 Goodbye!\n');
  
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Received SIGTERM, shutting down...');
  saveDatabase();
  saveGameInfoCache();
  client.destroy();
  process.exit(0);
});

// ============================================
// START BOT
// ============================================

console.log('🚀 Starting Discord Lua Bot - Enhanced v2.0...\n');
console.log('📂 Initializing folders...');
initializeFolders();

console.log('💾 Loading database...');
loadDatabase();

console.log('🗄️ Loading game info cache...');
loadGameInfoCache();

console.log('🔐 Logging in to Discord...\n');

client.login(CONFIG.BOT_TOKEN).catch(error => {
  console.error('\n❌ FAILED TO LOGIN TO DISCORD!\n');
  console.error('Error:', error.message);
  console.error('\n💡 Troubleshooting tips:');
  console.error('   1. Check if BOT_TOKEN exists in .env file');
  console.error('   2. Verify the token is correct');
  console.error('   3. Make sure bot has proper permissions');
  console.error('   4. Check if bot is banned from the server\n');
  process.exit(1);
});

// ============================================
// HEALTH CHECK SERVER (for hosting services)
// ============================================

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    uptimeFormatted: formatUptime(process.uptime()),
    bot: {
      username: client.user?.tag || 'Not logged in',
      id: client.user?.id || 'N/A',
      status: client.user ? 'online' : 'offline'
    },
    stats: {
      totalGames: Object.keys(database.games).length,
      cachedGames: Object.keys(gameInfoCache).length,
      totalDownloads: database.stats.totalDownloads,
      totalSearches: database.stats.totalSearches,
    },
    config: {
      autoDelete: CONFIG.ENABLE_AUTO_DELETE,
      autoDeleteTimeout: CONFIG.AUTO_DELETE_TIMEOUT / 1000 + 's',
      cacheTimeout: CONFIG.CACHE_DURATION / 1000 / 60 + ' minutes'
    },
    timestamp: new Date().toISOString(),
    year: new Date().getFullYear(),
  });
});

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Discord Lua Bot v2.0</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
        }
        .container {
          text-align: center;
          padding: 40px;
          background: rgba(0,0,0,0.3);
          border-radius: 20px;
          backdrop-filter: blur(10px);
        }
        h1 { font-size: 3em; margin: 0; }
        p { font-size: 1.2em; opacity: 0.9; }
        .status { 
          display: inline-block;
          padding: 10px 20px;
          background: #00ff00;
          color: #000;
          border-radius: 20px;
          font-weight: bold;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🎮 Discord Lua Bot v2.0</h1>
        <p>Enhanced with Auto-Delete & Online-Fix</p>
        <div class="status">✅ Bot is running!</div>
        <p style="margin-top: 30px; opacity: 0.7;">
          © ${new Date().getFullYear()} • Uptime: ${formatUptime(process.uptime())}
        </p>
      </div>
    </body>
    </html>
  `);
});

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  
  return parts.join(' ');
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Health check server running on port ${PORT}`);
  console.log(`🌐 Access at: http://localhost:${PORT}`);
  console.log(`📊 Health endpoint: http://localhost:${PORT}/health\n`);
});
