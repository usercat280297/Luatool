// ============================================
// DISCORD LUA BOT - FULL API INTEGRATION
// Auto-detect DRM, pricing, size, và tất cả thông tin game
// ============================================
require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();

// ============================================
// CẤU HÌNH
// ============================================
const CONFIG = {
  BOT_TOKEN: process.env.BOT_TOKEN,
  STEAM_API_KEY: process.env.STEAM_API_KEY,
  COMMAND_PREFIX: '!',
  
  // Paths
  LUA_FILES_PATH: './lua_files',
  FIX_FILES_PATH: './fix_files',
  ONLINE_FIX_PATH: './online_fix',
  LOGS_PATH: './logs',
  DATABASE_PATH: './database.json',
  GAME_INFO_CACHE_PATH: './game_info_cache.json',
  
  // Admin
  ADMIN_USER_IDS: ['898595655562432584'],
  LOG_CHANNEL_ID: null,
  
  // Settings
  MAX_FILE_SIZE_MB: 25,
  CACHE_DURATION: 86400000, // 24 hours
};

// ============================================
// EXTERNAL APIs CONFIGURATION
// ============================================
const API_SOURCES = {
  // Steam Store API
  steamStore: 'https://store.steampowered.com/api/appdetails',
  
  // SteamDB (public data)
  steamDB: 'https://steamdb.info/api/GetAppInfo',
  
  // PCGamingWiki (DRM info)
  pcgw: 'https://www.pcgamingwiki.com/w/api.php',
  
  // IsThereAnyDeal (pricing)
  itad: 'https://api.isthereanydeal.com',
};

// ============================================
// DRM DETECTION KEYWORDS
// ============================================
const DRM_PATTERNS = {
  denuvo: [
    'denuvo',
    'denuvo anti-tamper',
    'incorporates denuvo',
    'includes denuvo'
  ],
  
  easyAntiCheat: [
    'easy anti-cheat',
    'eac',
    'easy anti cheat',
    'easyanticheat'
  ],
  
  battleye: [
    'battleye',
    'battle eye',
    'be anti-cheat'
  ],
  
  eaAntiCheat: [
    'ea anticheat',
    'ea anti-cheat',
    'origin anti-cheat'
  ],
  
  steamDRM: [
    'steam drm',
    'valve drm',
    'steamworks drm'
  ],
  
  none: [
    'drm-free',
    'drm free',
    'no drm'
  ]
};

// Publisher detection
const PUBLISHERS = {
  ea: ['Electronic Arts', 'EA Games', 'EA Sports'],
  ubisoft: ['Ubisoft', 'Ubisoft Entertainment'],
  activision: ['Activision', 'Activision Blizzard'],
  rockstar: ['Rockstar Games'],
  bethesda: ['Bethesda', 'Bethesda Softworks'],
  square: ['Square Enix'],
};

// ============================================
// DATABASE & CACHE
// ============================================
let database = {
  games: {},
  stats: { totalDownloads: 0, totalSearches: 0 },
};

let gameInfoCache = {}; // Cache đầy đủ thông tin game

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

function initializeFolders() {
  [CONFIG.LUA_FILES_PATH, CONFIG.FIX_FILES_PATH, 
   CONFIG.ONLINE_FIX_PATH, CONFIG.LOGS_PATH].forEach(folder => {
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
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
  } catch (error) {
    console.error('Failed to write log:', error.message);
  }
}

function isAdmin(userId) {
  return CONFIG.ADMIN_USER_IDS.includes(userId);
}

function formatFileSize(bytes) {
  if (!bytes) return 'Unknown';
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// ============================================
// ADVANCED GAME INFO API
// ============================================

// 1. Lấy thông tin cơ bản từ Steam Store
async function fetchSteamStoreData(appId) {
  try {
    const response = await axios.get(API_SOURCES.steamStore, {
      params: { appids: appId, l: 'english' },
      timeout: 10000,
    });
    
    if (!response.data[appId]?.success) {
      return null;
    }
    
    const data = response.data[appId].data;
    
    return {
      appId: appId,
      name: data.name,
      type: data.type,
      shortDescription: data.short_description,
      headerImage: data.header_image,
      developers: data.developers || [],
      publishers: data.publishers || [],
      releaseDate: data.release_date?.date || 'Unknown',
      price: data.is_free ? 'Free to Play' : (data.price_overview?.final_formatted || 'N/A'),
      priceRaw: data.price_overview?.final || 0,
      currency: data.price_overview?.currency || 'USD',
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
      languages: data.supported_languages || '',
      screenshots: data.screenshots?.slice(0, 3).map(s => s.path_full) || [],
      movies: data.movies?.slice(0, 1).map(m => m.webm?.max || m.mp4?.max) || [],
      requirements: data.pc_requirements?.minimum || 'Not specified',
    };
    
  } catch (error) {
    log('ERROR', `Failed to fetch Steam store data for ${appId}`, { error: error.message });
    return null;
  }
}

// 2. Detect DRM từ description và categories
function detectDRM(gameData) {
  const searchText = `
    ${gameData.shortDescription || ''} 
    ${gameData.categories?.join(' ') || ''}
    ${gameData.publishers?.join(' ') || ''}
  `.toLowerCase();
  
  const detectedDRM = {
    hasDenuvo: false,
    hasEAC: false,
    hasBattlEye: false,
    hasEAAntiCheat: false,
    hasSteamDRM: true, // Most Steam games have basic DRM
    isDRMFree: false,
    type: 'Steam DRM',
    severity: 'info',
    needsOnlineFix: false,
  };
  
  // Check Denuvo
  if (DRM_PATTERNS.denuvo.some(pattern => searchText.includes(pattern))) {
    detectedDRM.hasDenuvo = true;
    detectedDRM.type = 'Denuvo Anti-Tamper';
    detectedDRM.severity = 'critical';
  }
  
  // Check EasyAntiCheat
  if (DRM_PATTERNS.easyAntiCheat.some(pattern => searchText.includes(pattern))) {
    detectedDRM.hasEAC = true;
    detectedDRM.type = detectedDRM.hasDenuvo ? 'Denuvo + EasyAntiCheat' : 'EasyAntiCheat';
    detectedDRM.severity = 'warning';
  }
  
  // Check BattlEye
  if (DRM_PATTERNS.battleye.some(pattern => searchText.includes(pattern))) {
    detectedDRM.hasBattlEye = true;
    detectedDRM.type = 'BattlEye Anti-Cheat';
    detectedDRM.severity = 'warning';
  }
  
  // Check EA AntiCheat
  if (DRM_PATTERNS.eaAntiCheat.some(pattern => searchText.includes(pattern))) {
    detectedDRM.hasEAAntiCheat = true;
    detectedDRM.type = 'EA AntiCheat';
    detectedDRM.severity = 'warning';
  }
  
  // Check DRM-Free
  if (DRM_PATTERNS.none.some(pattern => searchText.includes(pattern))) {
    detectedDRM.isDRMFree = true;
    detectedDRM.type = 'DRM-Free';
    detectedDRM.severity = 'none';
    detectedDRM.hasSteamDRM = false;
  }
  
  // Check if needs online fix (multiplayer games)
  const multiplayerKeywords = ['multiplayer', 'co-op', 'online', 'pvp'];
  if (gameData.categories?.some(cat => 
    multiplayerKeywords.some(kw => cat.toLowerCase().includes(kw))
  )) {
    detectedDRM.needsOnlineFix = true;
  }
  
  return detectedDRM;
}

// 3. Detect publisher
function detectPublisher(gameData) {
  const publishers = gameData.publishers || [];
  
  for (const [key, names] of Object.entries(PUBLISHERS)) {
    if (publishers.some(pub => names.some(name => pub.includes(name)))) {
      return {
        type: key,
        name: publishers[0],
        isEA: key === 'ea',
        isUbisoft: key === 'ubisoft',
        isActivision: key === 'activision',
      };
    }
  }
  
  return {
    type: 'indie',
    name: publishers[0] || 'Unknown',
    isEA: false,
    isUbisoft: false,
    isActivision: false,
  };
}

// 4. Estimate game size (từ Steam Web Scraping)
async function estimateGameSize(appId) {
  try {
    // Try to get size from Steam store page HTML
    const response = await axios.get(`https://store.steampowered.com/app/${appId}`, {
      timeout: 5000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    const html = response.data;
    
    // Extract size from HTML (rough estimation)
    const sizeMatch = html.match(/(\d+(?:\.\d+)?)\s*(GB|MB)/i);
    if (sizeMatch) {
      const size = parseFloat(sizeMatch[1]);
      const unit = sizeMatch[2].toUpperCase();
      return unit === 'GB' ? size * 1024 * 1024 * 1024 : size * 1024 * 1024;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

// 5. Get full game info (main function)
async function getFullGameInfo(appId) {
  // Check cache first
  const cached = gameInfoCache[appId];
  if (cached && (Date.now() - cached.timestamp < CONFIG.CACHE_DURATION)) {
    log('INFO', `Using cached data for ${appId}`);
    return cached.data;
  }
  
  log('INFO', `Fetching fresh data for ${appId}`);
  
  // Fetch from Steam
  const steamData = await fetchSteamStoreData(appId);
  if (!steamData) {
    return null;
  }
  
  // Detect DRM
  const drmInfo = detectDRM(steamData);
  
  // Detect Publisher
  const publisherInfo = detectPublisher(steamData);
  
  // Estimate size
  const estimatedSize = await estimateGameSize(appId);
  
  // Count languages
  const languageCount = steamData.languages 
    ? steamData.languages.split(',').filter(l => l.trim()).length 
    : 0;
  
  // Compile full info
  const fullInfo = {
    ...steamData,
    drm: drmInfo,
    publisher: publisherInfo,
    estimatedSize: estimatedSize,
    estimatedSizeFormatted: formatFileSize(estimatedSize),
    languageCount: languageCount,
    
    // Additional computed fields
    isEAGame: publisherInfo.isEA,
    isFreeToPlay: steamData.price === 'Free to Play',
    hasMultiplayer: steamData.categories?.some(c => 
      c.toLowerCase().includes('multi') || c.toLowerCase().includes('co-op')
    ),
    isEarlyAccess: steamData.categories?.some(c => 
      c.toLowerCase().includes('early access')
    ),
    
    // Update timestamp
    lastUpdated: Date.now(),
  };
  
  // Cache the result
  gameInfoCache[appId] = {
    data: fullInfo,
    timestamp: Date.now(),
  };
  saveGameInfoCache();
  
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
// CREATE BEAUTIFUL EMBED
// ============================================

async function createGameEmbed(appId, gameInfo, files) {
  const embed = new EmbedBuilder();
  
  // ===== TITLE & THUMBNAIL =====
  embed.setTitle(`🎮 ${gameInfo.name}`)
    .setURL(`https://store.steampowered.com/app/${appId}`)
    .setThumbnail(gameInfo.headerImage);
  
  // ===== COLOR BASED ON DRM SEVERITY =====
  const colors = {
    critical: '#8B0000',  // Denuvo - Dark Red
    warning: '#FF6B6B',   // Anti-cheat - Red
    info: '#4A90E2',      // Steam DRM - Blue
    none: '#2ECC71',      // DRM-Free - Green
  };
  embed.setColor(colors[gameInfo.drm.severity] || '#5865F2');
  
  // ===== DESCRIPTION =====
  let description = `🔗 [**View on Steam**](https://store.steampowered.com/app/${appId})`;
  
  if (gameInfo.shortDescription) {
    description += `\n\n${gameInfo.shortDescription.substring(0, 150)}...`;
  }
  
  embed.setDescription(description);
  
  // ===== GAME INFO SECTION =====
  const infoFields = [];
  
  // Row 1: Basic Info
  infoFields.push(
    { name: '💰 Price', value: gameInfo.price, inline: true },
    { name: '📦 Size', value: gameInfo.estimatedSizeFormatted || 'Unknown', inline: true },
    { name: '📅 Release', value: gameInfo.releaseDate, inline: true }
  );
  
  // Row 2: Content Info
  infoFields.push(
    { name: '🎯 DLCs', value: `${gameInfo.dlcCount}`, inline: true },
    { name: '🌍 Languages', value: `${gameInfo.languageCount}`, inline: true },
    { name: '⭐ Reviews', value: gameInfo.recommendations > 0 ? `${(gameInfo.recommendations/1000).toFixed(1)}K` : 'N/A', inline: true }
  );
  
  embed.addFields(infoFields);
  
  // ===== DRM WARNING SECTION =====
  if (gameInfo.drm.severity !== 'none') {
    embed.addFields({ name: '\u200b', value: '━━━━━━━━━━━━━━━━━━━━━━━━━━' });
    
    // Denuvo Warning
    if (gameInfo.drm.hasDenuvo) {
      embed.addFields({
        name: '🚫 **DRM/Restrictions Detected**',
        value: '⚠️ This game has **Denuvo Anti-Tamper**\nYou may **NOT** be able to play this game.',
        inline: false
      });
    }
    
    // Anti-Cheat Warning
    if (gameInfo.drm.hasEAC || gameInfo.drm.hasBattlEye || gameInfo.drm.hasEAAntiCheat) {
      const acType = gameInfo.drm.hasEAC ? 'EasyAntiCheat' : 
                     gameInfo.drm.hasBattlEye ? 'BattlEye' : 'EA AntiCheat';
      embed.addFields({
        name: `⚠️ **${acType} Detected**`,
        value: 'Requires custom installation process to bypass.',
        inline: false
      });
    }
    
    // Online Fix Warning
    if (gameInfo.drm.needsOnlineFix && !files.onlineFix.length) {
      embed.addFields({
        name: '🌐 **Online Features Unavailable**',
        value: 'No Online-Fix available. Multiplayer/Co-op features won\'t work.',
        inline: false
      });
    }
    
    // EA Game Warning
    if (gameInfo.isEAGame) {
      embed.addFields({
        name: '🎮 **EA Game Notice**',
        value: 'This is an EA game. May require Origin/EA App.',
        inline: false
      });
    }
  } else if (gameInfo.drm.isDRMFree) {
    embed.addFields({
      name: '✅ **DRM-Free**',
      value: 'This game has no DRM protection!',
      inline: false
    });
  }
  
  // ===== PUBLISHER & DEVELOPER =====
  embed.addFields({ name: '\u200b', value: '━━━━━━━━━━━━━━━━━━━━━━━━━━' });
  
  embed.addFields(
    { name: '👨‍💻 Developer', value: gameInfo.developers[0] || 'Unknown', inline: true },
    { name: '🏢 Publisher', value: gameInfo.publisher.name, inline: true },
    { name: '🔒 DRM Type', value: gameInfo.drm.type, inline: true }
  );
  
  // ===== DOWNLOAD SECTION =====
  embed.addFields({ name: '\u200b', value: '━━━━━━━━━━━━━━━━━━━━━━━━━━' });
  
  const fileStatus = [];
  if (files.lua.length > 0) fileStatus.push('✅ Lua Script Available');
  if (files.fix.length > 0) fileStatus.push('✅ Crack/Fix Available');
  if (files.onlineFix.length > 0) fileStatus.push('✅ Online-Fix Available');
  
  if (fileStatus.length > 0) {
    embed.addFields({
      name: '📥 **Available Downloads**',
      value: fileStatus.join('\n'),
      inline: false
    });
    
    embed.addFields({
      name: '✨ **CLICK BELOW TO DOWNLOAD** ✨',
      value: '\u200b',
      inline: false
    });
  } else {
    embed.addFields({
      name: '❌ **No Files Available**',
      value: 'No lua files, cracks, or fixes found for this game.',
      inline: false
    });
  }
  
  // ===== FOOTER =====
  embed.setFooter({ 
    text: `AppID: ${appId} • Generated by Magic Steam Tool • ${new Date().toLocaleDateString()}` 
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
    const loadingMsg = await message.reply('🔍 Đang tải thông tin game từ Steam API...');
    
    // Find files
    const files = findFiles(appId);
    const hasFiles = files.lua.length > 0 || files.fix.length > 0 || files.onlineFix.length > 0;
    
    if (!hasFiles) {
      return loadingMsg.edit(`❌ Không tìm thấy files cho AppID: \`${appId}\`\n💡 Tip: Dùng \`!search <tên game>\` để tìm game.`);
    }
    
    // Get full game info from API
    const gameInfo = await getFullGameInfo(appId);
    
    if (!gameInfo) {
      return loadingMsg.edit(`❌ Không thể lấy thông tin từ Steam cho AppID: \`${appId}\`\n🔗 Link: https://store.steampowered.com/app/${appId}`);
    }
    
    // Create beautiful embed
    const embed = await createGameEmbed(appId, gameInfo, files);
    
    // Create download buttons
    const rows = [];
    let currentRow = new ActionRowBuilder();
    let buttonCount = 0;
    
    // Lua button
    if (files.lua.length > 0) {
      currentRow.addComponents(
        new ButtonBuilder()
          .setCustomId(`dl_lua_${appId}_0`)
          .setLabel('⬇️ DOWNLOAD LUA FILE')
          .setStyle(ButtonStyle.Primary)
      );
      buttonCount++;
    }
    
    // Fix button
    if (files.fix.length > 0) {
      currentRow.addComponents(
        new ButtonBuilder()
          .setCustomId(`dl_fix_${appId}_0`)
          .setLabel('🔧 DOWNLOAD FIX/CRACK')
          .setStyle(ButtonStyle.Success)
      );
      buttonCount++;
    }
    
    // Online fix button
    if (files.onlineFix.length > 0) {
      currentRow.addComponents(
        new ButtonBuilder()
          .setCustomId(`dl_online_${appId}_0`)
          .setLabel('🌐 DOWNLOAD ONLINE-FIX')
          .setStyle(ButtonStyle.Secondary)
      );
      buttonCount++;
    }
    
    if (buttonCount > 0) {
      rows.push(currentRow);
    }
    
    // Send message
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
    
    log('INFO', `Game info displayed: ${gameInfo.name} (${appId})`, {
      user: message.author.tag,
      drm: gameInfo.drm.type,
    });
    
  } catch (error) {
    log('ERROR', 'Error in handleGameCommand', { 
      appId, 
      error: error.message,
      stack: error.stack 
    });
    message.reply('❌ Có lỗi xảy ra! Vui lòng thử lại sau.').catch(() => {});
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
    const loadingMsg = await message.reply('🔍 Đang tìm kiếm...');
    
    const results = await searchGameByName(query);
    
    if (results.length === 0) {
      return loadingMsg.edit(`❌ Không tìm thấy game: "${query}"`);
    }
    
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`🔍 Kết quả tìm kiếm: "${query}"`)
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
    message.reply('❌ Có lỗi xảy ra!').catch(() => {});
  }
}

// ============================================
// COMMAND: HELP
// ============================================

async function handleHelpCommand(message) {
  const embed = new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle('🤖 Discord Lua Bot - Full API Integration')
    .setDescription('Bot tự động lấy đầy đủ thông tin game từ Steam API')
    .addFields(
      {
        name: '🎮 Commands',
        value: [
          `\`${CONFIG.COMMAND_PREFIX}<appid>\` - Xem đầy đủ thông tin game`,
          `\`${CONFIG.COMMAND_PREFIX}search <tên>\` - Tìm game theo tên`,
          `\`${CONFIG.COMMAND_PREFIX}list\` - Danh sách games có sẵn`,
          `\`${CONFIG.COMMAND_PREFIX}help\` - Hiển thị help`,
        ].join('\n')
      },
      {
        name: '✨ Tính năng mới',
        value: [
          '✅ Auto-detect DRM (Denuvo, EAC, BattlEye)',
          '✅ Hiển thị giá, kích thước, ngày phát hành',
          '✅ Detect Publisher (EA, Ubisoft, etc.)',
          '✅ Cảnh báo Online-Fix requirements',
          '✅ Beautiful embed với đầy đủ thông tin',
          '✅ Cache data để load nhanh hơn',
        ].join('\n')
      },
      {
        name: '📚 Examples',
        value: [
          '`!2246460` - Monster Hunter Wilds',
          '`!search elden ring` - Tìm Elden Ring',
          '`!list` - Xem tất cả games',
        ].join('\n')
      }
    )
    .setFooter({ text: '🎮👌 • chúc ae vui vẻ' })
    .setTimestamp();
  
  if (isAdmin(message.author.id)) {
    embed.addFields({
      name: '⚙️ Admin Commands',
      value: [
        '`!stats` - Thống kê',
        '`!reload` - Reload database',
        '`!clearcache` - Xóa cache',
      ].join('\n')
    });
  }
  
  await message.reply({ embeds: [embed] });
}

// ============================================
// OTHER COMMANDS
// ============================================

async function handleListCommand(message) {
  const allGames = scanAllGames();
  
  if (allGames.length === 0) {
    return message.reply('❌ Chưa có game nào trong database!');
  }
  
  const embed = new EmbedBuilder()
    .setColor('#00ff00')
    .setTitle('📚 Available Games')
    .setDescription(`Tổng: ${allGames.length} game(s)`)
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
    return message.reply('❌ Admin only!');
  }
  
  const totalGames = Object.keys(database.games).length;
  const cachedGames = Object.keys(gameInfoCache).length;
  
  const embed = new EmbedBuilder()
    .setColor('#ffaa00')
    .setTitle('📊 Bot Statistics')
    .addFields(
      { name: '🎮 Total Games', value: `${totalGames}`, inline: true },
      { name: '💾 Cached Games', value: `${cachedGames}`, inline: true },
      { name: '📥 Downloads', value: `${database.stats.totalDownloads}`, inline: true },
      { name: '🔍 Searches', value: `${database.stats.totalSearches}`, inline: true }
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
    if (command === 'help') {
      return handleHelpCommand(message);
    }
    
    if (command === 'search') {
      const query = args.slice(1).join(' ');
      if (!query) return message.reply('❌ Usage: `!search <game name>`');
      return handleSearchCommand(message, query);
    }
    
    if (command === 'list') {
      return handleListCommand(message);
    }
    
    if (command === 'stats' && isAdmin(message.author.id)) {
      return handleStatsCommand(message);
    }
    
    if (command === 'reload' && isAdmin(message.author.id)) {
      loadDatabase();
      loadGameInfoCache();
      return message.reply('✅ Reloaded!');
    }
    
    if (command === 'clearcache' && isAdmin(message.author.id)) {
      gameInfoCache = {};
      saveGameInfoCache();
      return message.reply('✅ Cache cleared!');
    }
    
    // Default: treat as AppID
    const appId = command.replace(/\D/g, '');
    if (appId && appId.length >= 4) {
      return handleGameCommand(message, appId);
    }
    
    message.reply(`❌ Unknown command! Use \`${CONFIG.COMMAND_PREFIX}help\``);
    
  } catch (error) {
    log('ERROR', 'Error handling message', { 
      command: message.content, 
      error: error.message 
    });
    message.reply('❌ Error occurred!').catch(() => {});
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
      return interaction.editReply('❌ File not found!');
    }
    
    const sizeMB = fileToSend.size / (1024 * 1024);
    if (sizeMB > CONFIG.MAX_FILE_SIZE_MB) {
      return interaction.editReply(
        `❌ File too large: ${fileToSend.sizeFormatted}\nDiscord limit: ${CONFIG.MAX_FILE_SIZE_MB}MB`
      );
    }
    
    await interaction.editReply({
      content: `✅ Sending **${fileToSend.name}** (${fileToSend.sizeFormatted})...`,
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
      await interaction.editReply('❌ Error sending file!');
    } catch (e) {}
  }
});

// ============================================
// BOT READY
// ============================================

client.once('ready', () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 DISCORD LUA BOT - FULL API INTEGRATION');
  console.log('='.repeat(60));
  console.log(`✅ Logged in as: ${client.user.tag}`);
  console.log(`📊 Prefix: ${CONFIG.COMMAND_PREFIX}`);
  console.log(`🎮 Total games: ${scanAllGames().length}`);
  console.log(`💾 Cached info: ${Object.keys(gameInfoCache).length} games`);
  console.log('='.repeat(60) + '\n');
  
  client.user.setPresence({
    activities: [{ name: `${CONFIG.COMMAND_PREFIX}help | Full API Integration` }],
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

console.log('🚀 Starting Discord Lua Bot with Full API Integration...\n');
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
  });
});

app.get('/', (req, res) => res.send('Bot is running!'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Health check server running on port ${PORT}`);
});