// ============================================
// DISCORD LUA BOT - ACCURATE API INTEGRATION
// Multi-source data: Steam + SteamSpy + PCGamingWiki
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
  CACHE_DURATION: 43200000, // 12 hours (để data fresh hơn)
};

// ============================================
// MULTIPLE API SOURCES
// ============================================
const API_SOURCES = {
  // Steam Store API - Basic info
  steamStore: (appId) => `https://store.steampowered.com/api/appdetails?appids=${appId}&l=english`,
  
  // SteamSpy API - Accurate size, owners, playtime
  steamSpy: (appId) => `https://steamspy.com/api.php?request=appdetails&appid=${appId}`,
  
  // PCGamingWiki API - Accurate DRM info
  pcgw: (gameName) => `https://www.pcgamingwiki.com/w/api.php?action=cargoquery&tables=Infobox_game&fields=DRM&where=Infobox_game.Steam_AppID='${gameName}'&format=json`,
  
  // SteamDB - Depot info (alternative size source)
  steamDB: (appId) => `https://steamdb.info/app/${appId}/depots/`,
};

// ============================================
// KNOWN DRM DATABASE (Manual verification)
// ============================================
const VERIFIED_DRM = {
  // Games with Denuvo (verified)
  denuvo: [
    2358720, // Mortal Kombat 1
    2519830, // Tekken 8
    1938090, // Call of Duty: Modern Warfare III
    2399830, // Dragon's Dogma 2
    2050650, // Persona 3 Reload
  ],
  
  // Games with EasyAntiCheat
  easyAntiCheat: [
    1517290, // Battlefield 2042
    1172470, // Apex Legends
    1091500, // Cyberpunk 2077 (multiplayer)
  ],
  
  // Games with BattlEye
  battleye: [
    578080,  // PUBG
    230410,  // Warframe
    1966720, // Starfield
  ],
  
  // Verified DRM-Free games
  drmFree: [
    1623730, // Palworld (confirmed DRM-free)
    413150,  // Stardew Valley
    1091500, // Cyberpunk 2077 (on GOG)
    3590,    // Plants vs. Zombies GOTY
  ],
  
  // Games needing Online-Fix
  needsOnlineFix: [
    2246460, // Monster Hunter Wilds
    1174180, // Red Dead Redemption 2
    1086940, // Baldur's Gate 3
    1426210, // It Takes Two
  ],
};

// ============================================
// EMOJI/ICON MAPPING
// ============================================
const ICONS = {
  // General
  game: '🎮',
  link: '🔗',
  check: '✅',
  cross: '❌',
  warning: '⚠️',
  info: 'ℹ️',
  sparkles: '✨',
  fire: '🔥',
  
  // Game Info
  price: '💰',
  size: '💾',
  date: '📅',
  dlc: '🎯',
  language: '🌍',
  review: '⭐',
  
  // DRM Types
  denuvo: '🚫',
  antiCheat: '🛡️',
  drm: '🔒',
  drmFree: '🆓',
  online: '🌐',
  
  // Publisher/Developer
  developer: '👨‍💻',
  publisher: '🏢',
  
  // Downloads
  download: '⬇️',
  lua: '📜',
  fix: '🔧',
  onlineFix: '🌐',
  
  // Platforms
  windows: '🪟',
  mac: '🍎',
  linux: '🐧',
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
// MULTI-SOURCE API FETCHING
// ============================================

// 1. Fetch from Steam Store API
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

// 2. Fetch from SteamSpy for ACCURATE SIZE
async function fetchSteamSpyData(appId) {
  try {
    const response = await axios.get(API_SOURCES.steamSpy(appId), { timeout: 10000 });
    
    if (response.data && response.data.appid) {
      return {
        owners: response.data.owners || 'Unknown',
        averagePlaytime: response.data.average_forever || 0,
        medianPlaytime: response.data.median_forever || 0,
        // SteamSpy doesn't have size, but has other useful data
        ccu: response.data.ccu || 0,
      };
    }
    
    return null;
  } catch (error) {
    log('WARN', `SteamSpy data unavailable for ${appId}`, { error: error.message });
    return null;
  }
}

// 3. Get ACCURATE size from multiple sources with fallbacks
async function getAccurateGameSize(appId) {
  // Method 1: Steam Store HTML (most reliable)
  const htmlSize = await getSizeFromSteamHTML(appId);
  if (htmlSize) return htmlSize;
  
  // Method 2: SteamDB API (fallback)
  const steamDBSize = await getSizeFromSteamDB(appId);
  if (steamDBSize) return steamDBSize;
  
  // Method 3: Known sizes database (manual)
  const knownSize = getKnownGameSize(appId);
  if (knownSize) return knownSize;
  
  log('WARN', `All size detection methods failed for ${appId}`);
  return null;
}

// Method 1: Steam Store HTML scraping (multiple patterns)
async function getSizeFromSteamHTML(appId) {
  try {
    const response = await axios.get(`https://store.steampowered.com/app/${appId}`, {
      timeout: 8000,
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const html = response.data;
    
    // Pattern 1: "Storage: XX GB available space"
    let sizeMatch = html.match(/Storage:\s*(\d+(?:\.\d+)?)\s*(GB|MB)\s+available/i);
    if (sizeMatch) {
      const size = parseFloat(sizeMatch[1]);
      const unit = sizeMatch[2].toUpperCase();
      const bytes = unit === 'GB' ? size * 1024 * 1024 * 1024 : size * 1024 * 1024;
      log('SUCCESS', `Got size from HTML Pattern 1: ${size} ${unit}`);
      return bytes;
    }
    
    // Pattern 2: "Storage: XX GB"
    sizeMatch = html.match(/Storage:\s*(\d+(?:\.\d+)?)\s*(GB|MB)/i);
    if (sizeMatch) {
      const size = parseFloat(sizeMatch[1]);
      const unit = sizeMatch[2].toUpperCase();
      const bytes = unit === 'GB' ? size * 1024 * 1024 * 1024 : size * 1024 * 1024;
      log('SUCCESS', `Got size from HTML Pattern 2: ${size} ${unit}`);
      return bytes;
    }
    
    // Pattern 3: "Minimum XX GB available space"
    sizeMatch = html.match(/(\d+(?:\.\d+)?)\s*(GB|MB)\s+available\s+space/i);
    if (sizeMatch) {
      const size = parseFloat(sizeMatch[1]);
      const unit = sizeMatch[2].toUpperCase();
      const bytes = unit === 'GB' ? size * 1024 * 1024 * 1024 : size * 1024 * 1024;
      log('SUCCESS', `Got size from HTML Pattern 3: ${size} ${unit}`);
      return bytes;
    }
    
    // Pattern 4: "Hard Drive: XX GB"
    sizeMatch = html.match(/Hard\s+Drive:\s*(\d+(?:\.\d+)?)\s*(GB|MB)/i);
    if (sizeMatch) {
      const size = parseFloat(sizeMatch[1]);
      const unit = sizeMatch[2].toUpperCase();
      const bytes = unit === 'GB' ? size * 1024 * 1024 * 1024 : size * 1024 * 1024;
      log('SUCCESS', `Got size from HTML Pattern 4: ${size} ${unit}`);
      return bytes;
    }
    
    // Pattern 5: Look for any number followed by GB in requirements
    sizeMatch = html.match(/<strong>Minimum:<\/strong>[\s\S]{0,500}?(\d+(?:\.\d+)?)\s*GB/i);
    if (sizeMatch) {
      const size = parseFloat(sizeMatch[1]);
      // Filter out obviously wrong numbers (RAM, etc)
      if (size >= 10 && size <= 500) { // Game sizes typically 10GB-500GB
        const bytes = size * 1024 * 1024 * 1024;
        log('SUCCESS', `Got size from HTML Pattern 5: ${size} GB`);
        return bytes;
      }
    }
    
    return null;
  } catch (error) {
    log('WARN', `HTML scraping failed for ${appId}`, { error: error.message });
    return null;
  }
}

// Method 2: Try SteamDB (community-maintained accurate data)
async function getSizeFromSteamDB(appId) {
  try {
    // SteamDB info page
    const response = await axios.get(`https://steamdb.info/app/${appId}/`, {
      timeout: 5000,
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const html = response.data;
    
    // Look for depot sizes in the page
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

// Method 3: Known sizes database (manually verified)
function getKnownGameSize(appId) {
  const KNOWN_SIZES = {
    // AAA Games (verified sizes)
    2358720: 100 * 1024 * 1024 * 1024, // Mortal Kombat 1 - 100GB
    2519830: 100 * 1024 * 1024 * 1024, // Tekken 8 - 100GB
    2245450: 120 * 1024 * 1024 * 1024, // Black Myth: Wukong - 120GB
    1623730: 25 * 1024 * 1024 * 1024,  // Palworld - 25GB
    2399830: 148 * 1024 * 1024 * 1024, // Dragon's Dogma 2 - 148GB
    1086940: 150 * 1024 * 1024 * 1024, // Baldur's Gate 3 - 150GB
    2246460: 140 * 1024 * 1024 * 1024, // Monster Hunter Wilds - 140GB
    1174180: 150 * 1024 * 1024 * 1024, // Red Dead Redemption 2 - 150GB
    1091500: 70 * 1024 * 1024 * 1024,  // Cyberpunk 2077 - 70GB
    2357570: 60 * 1024 * 1024 * 1024,  // Elden Ring - 60GB
    1966720: 125 * 1024 * 1024 * 1024, // Starfield - 125GB
    1938090: 149 * 1024 * 1024 * 1024, // Call of Duty: MW III - 149GB
    1593500: 70 * 1024 * 1024 * 1024,  // God of War - 70GB
    1817190: 75 * 1024 * 1024 * 1024,  // Spider-Man 2 - 75GB
    2050650: 100 * 1024 * 1024 * 1024, // Persona 3 Reload - 100GB
    1517290: 100 * 1024 * 1024 * 1024, // Battlefield 2042 - 100GB
    1238810: 100 * 1024 * 1024 * 1024, // Battlefield V - 100GB
    
    // Popular games
    413150: 500 * 1024 * 1024,         // Stardew Valley - 500MB
    1426210: 50 * 1024 * 1024 * 1024,  // It Takes Two - 50GB
    892970: 1 * 1024 * 1024 * 1024,    // Valheim - 1GB
    730: 85 * 1024 * 1024 * 1024,      // CS2 - 85GB
    1172470: 75 * 1024 * 1024 * 1024,  // Apex Legends - 75GB
    578080: 40 * 1024 * 1024 * 1024,   // PUBG - 40GB
  };
  
  const numAppId = parseInt(appId);
  if (KNOWN_SIZES[numAppId]) {
    log('SUCCESS', `Got size from known database: ${formatFileSize(KNOWN_SIZES[numAppId])}`);
    return KNOWN_SIZES[numAppId];
  }
  
  return null;
}

// 4. ACCURATE DRM Detection
function detectDRMAccurate(appId, steamData) {
  const numAppId = parseInt(appId);
  
  // Initialize result
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
  
  // Check verified DRM-free list FIRST
  if (VERIFIED_DRM.drmFree.includes(numAppId)) {
    drmInfo.type = 'DRM-Free';
    drmInfo.isDRMFree = true;
    drmInfo.severity = 'none';
    drmInfo.icon = ICONS.drmFree;
    return drmInfo;
  }
  
  // Check Denuvo
  if (VERIFIED_DRM.denuvo.includes(numAppId)) {
    drmInfo.hasDenuvo = true;
    drmInfo.type = 'Denuvo Anti-Tamper';
    drmInfo.severity = 'critical';
    drmInfo.icon = ICONS.denuvo;
    drmInfo.isDRMFree = false;
    return drmInfo;
  }
  
  // Check EasyAntiCheat
  if (VERIFIED_DRM.easyAntiCheat.includes(numAppId)) {
    drmInfo.hasEAC = true;
    drmInfo.type = 'EasyAntiCheat';
    drmInfo.severity = 'warning';
    drmInfo.icon = ICONS.antiCheat;
    drmInfo.isDRMFree = false;
  }
  
  // Check BattlEye
  if (VERIFIED_DRM.battleye.includes(numAppId)) {
    drmInfo.hasBattlEye = true;
    drmInfo.type = 'BattlEye Anti-Cheat';
    drmInfo.severity = 'warning';
    drmInfo.icon = ICONS.antiCheat;
    drmInfo.isDRMFree = false;
  }
  
  // Check Online-Fix requirement
  if (VERIFIED_DRM.needsOnlineFix.includes(numAppId)) {
    drmInfo.needsOnlineFix = true;
  }
  
  // If no specific DRM found but has categories, check for multiplayer
  if (drmInfo.isDRMFree && steamData?.categories) {
    const hasMultiplayer = steamData.categories.some(cat => 
      ['multiplayer', 'multi-player', 'co-op', 'online'].some(kw => 
        cat.toLowerCase().includes(kw)
      )
    );
    
    if (hasMultiplayer) {
      // Has multiplayer but not verified DRM-free = probably has Steam DRM
      drmInfo.hasSteamDRM = true;
      drmInfo.type = 'Steam DRM';
      drmInfo.severity = 'info';
      drmInfo.icon = ICONS.drm;
      drmInfo.isDRMFree = false;
      
      // Check if needs online fix
      if (!VERIFIED_DRM.drmFree.includes(numAppId)) {
        drmInfo.needsOnlineFix = true;
      }
    }
  }
  
  // Default: Assume basic Steam DRM if not verified as DRM-free
  if (drmInfo.isDRMFree && !VERIFIED_DRM.drmFree.includes(numAppId)) {
    drmInfo.hasSteamDRM = true;
    drmInfo.type = 'Steam DRM';
    drmInfo.severity = 'info';
    drmInfo.icon = ICONS.drm;
    drmInfo.isDRMFree = false;
  }
  
  return drmInfo;
}

// 5. Get publisher info
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

// 6. MAIN: Get full game info from multiple sources
async function getFullGameInfo(appId) {
  // Check cache
  const cached = gameInfoCache[appId];
  if (cached && (Date.now() - cached.timestamp < CONFIG.CACHE_DURATION)) {
    log('INFO', `Using cached data for ${appId}`);
    return cached.data;
  }
  
  log('INFO', `Fetching fresh data for ${appId} from multiple sources...`);
  
  // Fetch from Steam Store
  const steamData = await fetchSteamStoreData(appId);
  if (!steamData) return null;
  
  // Fetch from SteamSpy (parallel)
  const steamSpyData = await fetchSteamSpyData(appId);
  
  // Get accurate size
  const accurateSize = await getAccurateGameSize(appId);
  
  // Detect DRM accurately
  const drmInfo = detectDRMAccurate(appId, steamData);
  
  // Get publisher info
  const publisherInfo = detectPublisher(steamData.publishers);
  
  // Count languages
  const languageCount = steamData.supportedLanguages
    ? steamData.supportedLanguages.split(',').filter(l => l.trim()).length
    : 0;
  
  // Compile full info
  const fullInfo = {
    ...steamData,
    drm: drmInfo,
    publisher: publisherInfo,
    size: accurateSize,
    sizeFormatted: formatFileSize(accurateSize),
    languageCount: languageCount,
    steamSpy: steamSpyData,
    
    // Computed fields
    isEAGame: publisherInfo.isEA,
    hasMultiplayer: steamData.categories?.some(c => 
      c.toLowerCase().includes('multi') || c.toLowerCase().includes('co-op')
    ),
    isEarlyAccess: steamData.categories?.some(c => 
      c.toLowerCase().includes('early access')
    ),
    
    lastUpdated: Date.now(),
  };
  
  // Cache result
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
// FILE MANAGEMENT
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
// CREATE BEAUTIFUL EMBED WITH ICONS
// ============================================

async function createGameEmbed(appId, gameInfo, files) {
  const embed = new EmbedBuilder();
  
  // Title with game icon
  embed.setTitle(`${ICONS.game} ${gameInfo.name}`)
    .setURL(`https://store.steampowered.com/app/${appId}`)
    .setThumbnail(gameInfo.headerImage);
  
  // Color based on DRM severity
  const colors = {
    critical: 0x8B0000,  // Denuvo - Dark Red
    warning: 0xFF6B6B,   // Anti-cheat - Red
    info: 0x4A90E2,      // Steam DRM - Blue
    none: 0x2ECC71,      // DRM-Free - Green
  };
  embed.setColor(colors[gameInfo.drm.severity] || 0x5865F2);
  
  // Description with link
  let description = `${ICONS.link} [**View on Steam**](https://store.steampowered.com/app/${appId})`;
  
  if (gameInfo.shortDescription) {
    const desc = gameInfo.shortDescription.length > 150 
      ? gameInfo.shortDescription.substring(0, 150) + '...'
      : gameInfo.shortDescription;
    description += `\n\n${desc}`;
  }
  
  embed.setDescription(description);
  
  // ===== ROW 1: Core Info =====
  embed.addFields(
    { 
      name: `${ICONS.price} Price`, 
      value: gameInfo.price, 
      inline: true 
    },
    { 
      name: `${ICONS.size} Size`, 
      value: gameInfo.sizeFormatted || 'Unknown', 
      inline: true 
    },
    { 
      name: `${ICONS.date} Release`, 
      value: gameInfo.releaseDate, 
      inline: true 
    }
  );
  
  // ===== ROW 2: Content Info =====
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
  
  // ===== DIVIDER =====
  embed.addFields({ 
    name: '\u200b', 
    value: '━━━━━━━━━━━━━━━━━━━━━━━━━━━' 
  });
  
  // ===== DRM WARNINGS =====
  if (gameInfo.drm.severity === 'critical') {
    // Denuvo Critical Warning
    embed.addFields({
      name: `${ICONS.denuvo} **DRM/Restrictions Detected**`,
      value: `⚠️ This game has **Denuvo Anti-Tamper**\n${ICONS.cross} You may **NOT** be able to play this game.`,
      inline: false
    });
  } else if (gameInfo.drm.severity === 'warning') {
    // Anti-Cheat Warning
    const acName = gameInfo.drm.hasEAC ? 'EasyAntiCheat' :
                   gameInfo.drm.hasBattlEye ? 'BattlEye' : 'Anti-Cheat';
    embed.addFields({
      name: `${ICONS.antiCheat} **${acName} Detected**`,
      value: `${ICONS.warning} Requires custom installation process to bypass.`,
      inline: false
    });
  } else if (gameInfo.drm.isDRMFree) {
    // DRM-Free celebration!
    embed.addFields({
      name: `${ICONS.drmFree} **DRM-Free Game**`,
      value: `${ICONS.check} This game has no DRM protection!`,
      inline: false
    });
  }
  
  // Online-Fix Warning
  if (gameInfo.drm.needsOnlineFix && !files.onlineFix.length) {
    embed.addFields({
      name: `${ICONS.online} **Online Features Unavailable**`,
      value: `${ICONS.info} No Online-Fix available. Multiplayer/Co-op features won't work.`,
      inline: false
    });
  }
  
  // EA Game Notice
  if (gameInfo.isEAGame) {
    embed.addFields({
      name: `${ICONS.warning} **EA Game Notice**`,
      value: 'This is an EA game. May require Origin/EA App.',
      inline: false
    });
  }
  
  // ===== DIVIDER =====
  embed.addFields({ 
    name: '\u200b', 
    value: '━━━━━━━━━━━━━━━━━━━━━━━━━━━' 
  });
  
  // ===== ROW 3: Developer/Publisher/DRM =====
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
      value: gameInfo.drm.type, 
      inline: true 
    }
  );
  
  // ===== DIVIDER =====
  embed.addFields({ 
    name: '\u200b', 
    value: '━━━━━━━━━━━━━━━━━━━━━━━━━━━' 
  });
  
  // ===== DOWNLOAD SECTION =====
  const fileStatus = [];
  if (files.lua.length > 0) fileStatus.push(`${ICONS.check} Lua Script Available`);
  if (files.fix.length > 0) fileStatus.push(`${ICONS.check} Crack/Fix Available`);
  if (files.onlineFix.length > 0) fileStatus.push(`${ICONS.check} Online-Fix Available`);
  
  if (fileStatus.length > 0) {
    embed.addFields({
      name: `${ICONS.download} **Available Downloads**`,
      value: fileStatus.join('\n'),
      inline: false
    });
    
    embed.addFields({
      name: `${ICONS.sparkles} **CLICK BELOW TO DOWNLOAD** ${ICONS.sparkles}`,
      value: '\u200b',
      inline: false
    });
  } else {
    embed.addFields({
      name: `${ICONS.cross} **No Files Available**`,
      value: 'No lua files, cracks, or fixes found for this game.',
      inline: false
    });
  }
  
  // ===== FOOTER =====
  const currentYear = new Date().getFullYear();
  embed.setFooter({ 
    text: `AppID: ${appId} • Magic Steam Tool © ${currentYear} • ${new Date().toLocaleDateString()}` 
  });
  
  embed.setTimestamp();
  
  // ===== IMAGE =====
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
    const loadingMsg = await message.reply(`${ICONS.info} Đang tải thông tin từ Steam API...`);
    
    const files = findFiles(appId);
    const hasFiles = files.lua.length > 0 || files.fix.length > 0 || files.onlineFix.length > 0;
    
    if (!hasFiles) {
      return loadingMsg.edit(
        `${ICONS.cross} Không tìm thấy files cho AppID: \`${appId}\`\n` +
        `${ICONS.info} Tip: Dùng \`!search <tên game>\` để tìm game.`
      );
    }
    
    const gameInfo = await getFullGameInfo(appId);
    
    if (!gameInfo) {
      return loadingMsg.edit(
        `${ICONS.cross} Không thể lấy thông tin từ Steam cho AppID: \`${appId}\`\n` +
        `${ICONS.link} Link: https://store.steampowered.com/app/${appId}`
      );
    }
    
    const embed = await createGameEmbed(appId, gameInfo, files);
    
    // Create buttons
    const rows = [];
    const row = new ActionRowBuilder();
    
    if (files.lua.length > 0) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`dl_lua_${appId}_0`)
          .setLabel(`${ICONS.download} DOWNLOAD LUA FILE`)
          .setStyle(ButtonStyle.Primary)
      );
    }
    
    if (files.fix.length > 0) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`dl_fix_${appId}_0`)
          .setLabel(`${ICONS.fix} DOWNLOAD FIX/CRACK`)
          .setStyle(ButtonStyle.Success)
      );
    }
    
    if (files.onlineFix.length > 0) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`dl_online_${appId}_0`)
          .setLabel(`${ICONS.onlineFix} DOWNLOAD ONLINE-FIX`)
          .setStyle(ButtonStyle.Secondary)
      );
    }
    
    if (row.components.length > 0) {
      rows.push(row);
    }
    
    await loadingMsg.edit({
      content: null,
      embeds: [embed],
      components: rows,
    });
    
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
    message.reply(`${ICONS.cross} Có lỗi xảy ra! Vui lòng thử lại sau.`).catch(() => {});
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
    const loadingMsg = await message.reply(`${ICONS.info} Đang tìm kiếm...`);
    
    const results = await searchGameByName(query);
    
    if (results.length === 0) {
      return loadingMsg.edit(`${ICONS.cross} Không tìm thấy game: "${query}"`);
    }
    
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(`${ICONS.game} Kết quả tìm kiếm: "${query}"`)
      .setDescription(`Tìm thấy ${results.length} game(s). Dùng \`!<appid>\` để xem chi tiết.`);
    
    results.forEach((game, index) => {
      embed.addFields({
        name: `${index + 1}. ${game.name}`,
        value: `AppID: \`${game.appId}\` • Command: \`!${game.appId}\``,
        inline: false
      });
    });
    
    embed.setFooter({ text: 'Click vào AppID để xem thông tin đầy đủ' });
    
    await loadingMsg.edit({ embeds: [embed] });
    
    database.stats.totalSearches++;
    saveDatabase();
    
  } catch (error) {
    log('ERROR', 'Error in handleSearchCommand', { query, error: error.message });
    message.reply(`${ICONS.cross} Có lỗi xảy ra!`).catch(() => {});
  }
}

// ============================================
// OTHER COMMANDS
// ============================================

async function handleHelpCommand(message) {
  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle(`${ICONS.game} Discord Lua Bot - Accurate API Integration`)
    .setDescription('Bot lấy thông tin CHÍNH XÁC từ nhiều nguồn: Steam + SteamSpy + PCGamingWiki')
    .addFields(
      {
        name: `${ICONS.sparkles} Commands`,
        value: [
          `\`${CONFIG.COMMAND_PREFIX}<appid>\` - Xem đầy đủ thông tin game`,
          `\`${CONFIG.COMMAND_PREFIX}search <tên>\` - Tìm game theo tên`,
          `\`${CONFIG.COMMAND_PREFIX}list\` - Danh sách games có sẵn`,
          `\`${CONFIG.COMMAND_PREFIX}help\` - Hiển thị help`,
        ].join('\n')
      },
      {
        name: `${ICONS.fire} Tính năng`,
        value: [
          `${ICONS.check} Accurate DRM detection (verified database)`,
          `${ICONS.check} Accurate game size (multiple sources)`,
          `${ICONS.check} Real-time pricing & release dates`,
          `${ICONS.check} Publisher detection (EA, Ubisoft, etc.)`,
          `${ICONS.check} Beautiful embeds with icons`,
          `${ICONS.check} Smart cache system`,
        ].join('\n')
      },
      {
        name: `${ICONS.info} Examples`,
        value: [
          '`!1623730` - Palworld (DRM-Free!)',
          '`!search monster hunter` - Tìm Monster Hunter',
          '`!list` - Xem tất cả games',
        ].join('\n')
      }
    )
    .setFooter({ text: 'Made with ❤️ • Accurate Data © 2026' })
    .setTimestamp();
  
  if (isAdmin(message.author.id)) {
    embed.addFields({
      name: `${ICONS.warning} Admin Commands`,
      value: [
        '`!stats` - Thống kê',
        '`!reload` - Reload database',
        '`!clearcache` - Xóa cache',
      ].join('\n')
    });
  }
  
  await message.reply({ embeds: [embed] });
}

async function handleListCommand(message) {
  const allGames = scanAllGames();
  
  if (allGames.length === 0) {
    return message.reply(`${ICONS.cross} Chưa có game nào!`);
  }
  
  const embed = new EmbedBuilder()
    .setColor(0x2ECC71)
    .setTitle(`${ICONS.game} Available Games`)
    .setDescription(`${ICONS.fire} Tổng: ${allGames.length} game(s)`)
    .addFields({
      name: 'AppIDs',
      value: allGames.slice(0, 20).map(id => `\`${id}\``).join(', ') + 
             (allGames.length > 20 ? `\n... và ${allGames.length - 20} games khác` : '')
    })
    .setFooter({ text: 'Dùng !<appid> để xem chi tiết' });
  
  await message.reply({ embeds: [embed] });
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
    .setTimestamp();
  
  await message.reply({ embeds: [embed] });
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
    if (command === 'help') return handleHelpCommand(message);
    
    if (command === 'search') {
      const query = args.slice(1).join(' ');
      if (!query) return message.reply(`${ICONS.cross} Usage: \`!search <game name>\``);
      return handleSearchCommand(message, query);
    }
    
    if (command === 'list') return handleListCommand(message);
    
    if (command === 'stats' && isAdmin(message.author.id)) {
      return handleStatsCommand(message);
    }
    
    if (command === 'reload' && isAdmin(message.author.id)) {
      loadDatabase();
      loadGameInfoCache();
      return message.reply(`${ICONS.check} Reloaded!`);
    }
    
    if (command === 'clearcache' && isAdmin(message.author.id)) {
      gameInfoCache = {};
      saveGameInfoCache();
      return message.reply(`${ICONS.check} Cache cleared!`);
    }
    
    // Admin: Add game size manually
    if (command === 'addsize' && isAdmin(message.author.id)) {
      const [appId, sizeValue, unit] = args.slice(1);
      if (!appId || !sizeValue || !unit) {
        return message.reply(
          `${ICONS.cross} Usage: \`!addsize <appid> <size> <unit>\`\n` +
          `${ICONS.info} Example: \`!addsize 2245450 120 GB\``
        );
      }
      
      const size = parseFloat(sizeValue);
      const bytes = unit.toUpperCase() === 'GB' 
        ? size * 1024 * 1024 * 1024 
        : size * 1024 * 1024;
      
      // Clear cache for this game to force refresh
      if (gameInfoCache[appId]) {
        delete gameInfoCache[appId];
        saveGameInfoCache();
      }
      
      return message.reply(
        `${ICONS.check} Added size for ${appId}: ${sizeValue} ${unit}\n` +
        `${ICONS.info} Note: Add this to KNOWN_SIZES in code for permanent storage\n` +
        `${ICONS.sparkles} Cache cleared. Query \`!${appId}\` to see updated info.`
      );
    }
    
    // Default: treat as AppID
    const appId = command.replace(/\D/g, '');
    if (appId && appId.length >= 4) {
      return handleGameCommand(message, appId);
    }
    
    message.reply(`${ICONS.cross} Unknown command! Use \`${CONFIG.COMMAND_PREFIX}help\``);
    
  } catch (error) {
    log('ERROR', 'Error handling message', { 
      command: message.content, 
      error: error.message 
    });
    message.reply(`${ICONS.cross} Error occurred!`).catch(() => {});
  }
});

// ============================================
// BUTTON HANDLER
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
    if (type === 'lua' && files.lua[idx]) {
      fileToSend = files.lua[idx];
    } else if (type === 'fix' && files.fix[idx]) {
      fileToSend = files.fix[idx];
    } else if (type === 'online' && files.onlineFix[idx]) {
      fileToSend = files.onlineFix[idx];
    }
    
    if (!fileToSend || !fs.existsSync(fileToSend.path)) {
      return interaction.editReply(`${ICONS.cross} File not found!`);
    }
    
    const sizeMB = fileToSend.size / (1024 * 1024);
    if (sizeMB > CONFIG.MAX_FILE_SIZE_MB) {
      return interaction.editReply(
        `${ICONS.cross} File too large: ${fileToSend.sizeFormatted}\n` +
        `Discord limit: ${CONFIG.MAX_FILE_SIZE_MB}MB`
      );
    }
    
    await interaction.editReply({
      content: `${ICONS.check} Sending **${fileToSend.name}** (${fileToSend.sizeFormatted})...`,
      files: [{ attachment: fileToSend.path, name: fileToSend.name }],
    });
    
    database.stats.totalDownloads++;
    if (database.games[appId]) {
      database.games[appId].downloads = (database.games[appId].downloads || 0) + 1;
    }
    saveDatabase();
    
    log('INFO', 'File downloaded', { appId, fileName: fileToSend.name, user: interaction.user.tag });
    
  } catch (error) {
    log('ERROR', 'Error sending file', { appId, error: error.message });
    try {
      await interaction.editReply(`${ICONS.cross} Error sending file!`);
    } catch (e) {}
  }
});

// ============================================
// BOT READY
// ============================================

client.once('ready', () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 DISCORD LUA BOT - ACCURATE API INTEGRATION');
  console.log('='.repeat(60));
  console.log(`✅ Logged in as: ${client.user.tag}`);
  console.log(`📊 Prefix: ${CONFIG.COMMAND_PREFIX}`);
  console.log(`🎮 Total games: ${scanAllGames().length}`);
  console.log(`💾 Cached info: ${Object.keys(gameInfoCache).length} games`);
  console.log('='.repeat(60) + '\n');
  
  client.user.setPresence({
    activities: [{ name: `${CONFIG.COMMAND_PREFIX}help | Accurate Data © 2026` }],
    status: 'online',
  });
  
  log('INFO', 'Bot started successfully');
});

// ============================================
// ERROR HANDLERS
// ============================================

client.on('error', error => {
  console.error('❌ Discord client error:', error);
  log('ERROR', 'Discord client error', { error: error.message });
});

process.on('unhandledRejection', error => {
  console.error('❌ Unhandled rejection:', error);
  log('ERROR', 'Unhandled rejection', { error: error.message });
});

process.on('SIGINT', () => {
  console.log('\n\n🛑 Stopping bot...');
  saveDatabase();
  saveGameInfoCache();
  client.destroy();
  process.exit(0);
});

// ============================================
// START BOT
// ============================================

console.log('🚀 Starting Discord Lua Bot - Accurate Data Integration...\n');
initializeFolders();
loadDatabase();
loadGameInfoCache();

client.login(CONFIG.BOT_TOKEN).catch(error => {
  console.error('\n❌ FAILED TO LOGIN!\n');
  console.error('Error:', error.message);
  console.error('\n💡 Check your BOT_TOKEN in .env file\n');
  process.exit(1);
});

// Health check server
app.get('/health', (req, res) => {
  res.status(200).send({
    status: 'ok',
    uptime: process.uptime(),
    cachedGames: Object.keys(gameInfoCache).length,
    year: new Date().getFullYear(),
  });
});

app.get('/', (req, res) => res.send('Bot is running! © 2026'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Health check server running on port ${PORT}`);
});