// ============================================
// DISCORD LUA BOT - ENHANCED VERSION 2.0
// Multi-source data + Auto-delete + Online-Fix
// ============================================
require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ApplicationCommandOptionType, ActivityType, PermissionFlagsBits } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { execFile } = require('child_process');
const { promisify } = require('util');
const express = require('express');
const app = express();
const execFileAsync = promisify(execFile);

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseBoolean(value, fallback) {
  if (typeof value !== 'string') return fallback;
  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return fallback;
}

function getGameTitleStatusIcon(hasManifest) {
  return hasManifest
    ? (process.env.GAME_TITLE_ICON_OK || '<a:blackverified:1471752403421237360>')
    : (process.env.GAME_TITLE_ICON_MISSING || '<:xicon:1471753191564640437>');
}

// Prefer a persistent data root when running on cloud platforms.
const DATA_ROOT = process.env.BOT_DATA_DIR
  || process.env.RENDER_DISK_MOUNT_PATH
  || path.join(__dirname, '..');

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
  BOT_TOKEN: process.env.BOT_TOKEN,
  STEAM_API_KEY: process.env.STEAM_API_KEY,
  STEAMGRIDDB_API_KEY: process.env.STEAMGRIDDB_API_KEY,
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  GITHUB_REPO_OWNER: process.env.GITHUB_REPO_OWNER,
  GITHUB_REPO_NAME: process.env.GITHUB_REPO_NAME,
  COMMAND_PREFIX: '!',
  
  // FIXED: Correct paths from src/ directory
  LUA_FILES_PATH: path.join(__dirname, '../lua_files'),
  FIX_FILES_PATH: path.join(__dirname, '../fix_files'),
  ONLINE_FIX_PATH: path.join(__dirname, '../online_fix'),
  LOGS_PATH: path.join(__dirname, '../logs'),
  DATABASE_PATH: path.join(DATA_ROOT, 'database.json'),
  DATABASE_BACKUP_PATH: path.join(DATA_ROOT, 'database.backup.json'),
  GAME_INFO_CACHE_PATH: path.join(DATA_ROOT, 'game_info_cache.json'),
  
  ADMIN_USER_IDS: ['898595655562432584'],
  MAX_FILE_SIZE_MB: 25,
  GITHUB_CONTENTS_SAFE_LIMIT_MB: parsePositiveInt(process.env.GITHUB_CONTENTS_SAFE_LIMIT_MB, 70),
  GITHUB_UPLOAD_TIMEOUT_MS: parsePositiveInt(process.env.GITHUB_UPLOAD_TIMEOUT_MS, 120000),
  GITHUB_UPLOAD_MAX_RETRIES: parsePositiveInt(process.env.GITHUB_UPLOAD_MAX_RETRIES, 6),
  GITHUB_UPLOAD_RETRY_DELAY_MS: parsePositiveInt(process.env.GITHUB_UPLOAD_RETRY_DELAY_MS, 4000),
  DISABLE_DIRECT_DOWNLOAD_FALLBACK: parseBoolean(process.env.DISABLE_DIRECT_DOWNLOAD_FALLBACK, false),
  PUBLIC_BASE_URL: (process.env.PUBLIC_BASE_URL || process.env.RENDER_EXTERNAL_URL || '').replace(/\/+$/, ''),
  DIRECT_DOWNLOAD_TTL_MINUTES: parsePositiveInt(process.env.DIRECT_DOWNLOAD_TTL_MINUTES, 360),
  CACHE_DURATION: 0, // Always fetch fresh data
  ENABLE_DAILY_DOWNLOAD_LIMIT: parseBoolean(process.env.ENABLE_DAILY_DOWNLOAD_LIMIT, true),
  MAX_DAILY_DOWNLOADS_PER_USER: parsePositiveInt(process.env.MAX_DAILY_DOWNLOADS_PER_USER, 25),
  DAILY_LIMIT_TIMEZONE: process.env.DAILY_LIMIT_TIMEZONE || 'Asia/Ho_Chi_Minh',
  REGISTER_GLOBAL_SLASH_COMMAND: parseBoolean(process.env.REGISTER_GLOBAL_SLASH_COMMAND, false),
  REGISTER_GUILD_SLASH_COMMAND: parseBoolean(process.env.REGISTER_GUILD_SLASH_COMMAND, true),
  GEN_PROCESSING_DELAY_MS: Math.min(
    Math.max(parsePositiveInt(process.env.GEN_PROCESSING_DELAY_MS, 3500), 3000),
    4000
  ),
  
  // AUTO-DELETE: Messages auto-delete after 5 minutes
  AUTO_DELETE_TIMEOUT: 5 * 60 * 1000, // 5 minutes
  ENABLE_AUTO_DELETE: true,
};

// ============================================
// AGGRESSIVE DEDUPLICATION SYSTEM
// ============================================
const MESSAGE_PROCESSING_TIMEOUT = 2000; // 2 seconds
const processed_messages = new Set(); // Track processed message IDs
const processing_commands = new Map(); // Track commands being processed
const DUPLICATE_THRESHOLD = 500; // ms between same command

function isMessageAlreadyProcessed(messageId) {
  return processed_messages.has(messageId);
}

function markMessageProcessed(messageId) {
  processed_messages.add(messageId);
  // Clean up old entries after 10 seconds
  setTimeout(() => {
    processed_messages.delete(messageId);
  }, 10000);
}

function isDuplicateCommand(userId, command) {
  const key = `${userId}:${command}`;
  const lastTime = processing_commands.get(key);
  
  if (lastTime && Date.now() - lastTime < DUPLICATE_THRESHOLD) {
    return true; // Duplicate command
  }
  
  processing_commands.set(key, Date.now());
  return false;
}

// ============================================
// DEDUPLICATION SYSTEM - Prevent duplicate messages
// ============================================
const messageProcessingSet = new Set();
const MESSAGE_DEDUP_TIMEOUT = 2000; // 2 seconds

// ============================================
// BOT VERSION & INSTANCE TRACKING
// ============================================
const BOT_VERSION = '2.0.0';
const BOT_INSTANCE_ID = Math.random().toString(36).substring(7);
const MESSAGE_HANDLERS = new Set(); // Track processed messages to prevent duplicates
const PROCESS_TIMEOUT = 1000; // 1 second timeout for message processing

console.log(`🚀 BOT INSTANCE: ${BOT_INSTANCE_ID} (v${BOT_VERSION})`);


// ============================================
// EXPANDED DRM DATABASE (2024-2025 Games)
// ============================================

const DENUVO_GAMES = require('../data/denuvo_data');

// Extract IDs from DENUVO_GAMES
const DENUVO_IDS = DENUVO_GAMES.map(game => game.id);

const VERIFIED_DRM = {
  // ⚠️ DENUVO GAMES - EXPANDED LIST (Automatically populated)
  denuvo: [
    ...DENUVO_IDS,
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
    3949040, // RV There Yet?
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

let database = { games: {}, stats: { totalDownloads: 0, totalSearches: 0 }, userDailyDownloads: {} };
let gameInfoCache = {};
let gameNamesIndex = {}; // Game names index
let gameNamesCache = {}; // Large local game name cache
let searchableGameList = []; // Unified game list for autocomplete + slash resolution
const temporaryDownloads = new Map(); // token -> { filePath, fileName, expiresAt }

const GEN_SLASH_COMMAND = {
  name: 'gen',
  description: 'Generate manifest files for a game',
  // Restrict to guild install/context to avoid duplicate command variants in client picker.
  integration_types: [0], // 0 = GUILD_INSTALL
  contexts: [0], // 0 = GUILD
  dm_permission: false,
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: 'appid',
      description: 'The Steam App ID or game name',
      required: true,
      autocomplete: true
    }
  ]
};

const AUTOCOMPLETE_LIMIT = 25;
const AUTOCOMPLETE_CACHE_TTL = 60 * 1000;
const autocompleteCache = new Map();

const POPULAR_APP_IDS = [
  '730', '570', '578080', '1172470', '271590',
  '252490', '4000', '431960', '1091500', '1245620',
  '1174180', '413150', '892970', '1086940', '367520'
];

const enableMessageContentIntent = String(process.env.ENABLE_MESSAGE_CONTENT_INTENT || '').toLowerCase() === 'true';

const requestedIntents = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
];

// Message content is privileged; keep it opt-in for stable Render deploys.
if (enableMessageContentIntent) {
  requestedIntents.push(GatewayIntentBits.MessageContent);
}

const client = new Client({ intents: requestedIntents });

function ensureDatabaseSchema() {
  if (!database || typeof database !== 'object') {
    database = {};
  }
  
  if (!database.games || typeof database.games !== 'object') {
    database.games = {};
  }
  
  if (!database.stats || typeof database.stats !== 'object') {
    database.stats = {};
  }
  
  database.stats.totalDownloads = Number.isFinite(database.stats.totalDownloads)
    ? database.stats.totalDownloads
    : 0;
  database.stats.totalSearches = Number.isFinite(database.stats.totalSearches)
    ? database.stats.totalSearches
    : 0;
  
  if (!database.userDailyDownloads || typeof database.userDailyDownloads !== 'object') {
    database.userDailyDownloads = {};
  }
}

function getDailyDateKey(timestamp = Date.now()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: CONFIG.DAILY_LIMIT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(new Date(timestamp));
}

function getNextDailyResetUnix(timestamp = Date.now()) {
  const currentKey = getDailyDateKey(timestamp);
  
  // Scan minute-by-minute to support timezone and DST boundaries safely.
  // Upper bound 48h is enough even on odd timezone transitions.
  for (let minute = 1; minute <= (48 * 60); minute++) {
    const probe = timestamp + (minute * 60 * 1000);
    if (getDailyDateKey(probe) !== currentKey) {
      return Math.floor(probe / 1000);
    }
  }
  
  // Fallback (should never happen)
  return Math.floor((timestamp + 24 * 60 * 60 * 1000) / 1000);
}

function getDailyDownloadQuota(userId, timestamp = Date.now()) {
  ensureDatabaseSchema();
  
  if (!CONFIG.ENABLE_DAILY_DOWNLOAD_LIMIT || CONFIG.MAX_DAILY_DOWNLOADS_PER_USER <= 0) {
    return {
      enabled: false,
      used: 0,
      remaining: Number.POSITIVE_INFINITY,
      limit: 0,
      dateKey: getDailyDateKey(timestamp),
    };
  }
  
  const dateKey = getDailyDateKey(timestamp);
  const userEntry = database.userDailyDownloads[userId];
  const usedToday = userEntry && userEntry.dateKey === dateKey
    ? Math.max(Number(userEntry.count) || 0, 0)
    : 0;
  const remaining = Math.max(CONFIG.MAX_DAILY_DOWNLOADS_PER_USER - usedToday, 0);
  
  return {
    enabled: true,
    used: usedToday,
    remaining,
    limit: CONFIG.MAX_DAILY_DOWNLOADS_PER_USER,
    dateKey,
  };
}

function consumeDailyDownloadQuota(userId, timestamp = Date.now()) {
  ensureDatabaseSchema();
  
  const quota = getDailyDownloadQuota(userId, timestamp);
  if (!quota.enabled) return quota;
  
  database.userDailyDownloads[userId] = {
    dateKey: quota.dateKey,
    count: quota.used + 1,
  };
  
  return {
    ...quota,
    used: quota.used + 1,
    remaining: Math.max(quota.remaining - 1, 0),
  };
}

function formatDailyQuotaRemaining(quota) {
  if (!quota?.enabled) return null;
  return `You have ${quota.remaining}/${quota.limit} downloads remaining today.`;
}

function registerSuccessfulDownload({ appId, gameName, fileType, fileName, fileSize, user }) {
  ensureDatabaseSchema();
  
  database.stats.totalDownloads += 1;
  
  if (!database.games[appId]) {
    database.games[appId] = {
      name: gameName || `App ${appId}`,
      downloads: 0,
      lastAccessed: Date.now(),
    };
  }
  
  const gameEntry = database.games[appId];
  if (gameName) {
    gameEntry.name = gameName;
  }
  gameEntry.downloads = (gameEntry.downloads || 0) + 1;
  gameEntry.lastAccessed = Date.now();
  
  const quota = consumeDailyDownloadQuota(user.id);
  saveDatabase();
  
  log('INFO', 'File downloaded', {
    appId,
    gameName: gameName || `App ${appId}`,
    fileName: fileName || 'N/A',
    fileType,
    fileSize: fileSize || 'N/A',
    user: user.tag
  });
  
  return quota;
}

async function sendDailyQuotaRemaining(interaction, quota) {
  const quotaMessage = formatDailyQuotaRemaining(quota);
  if (!quotaMessage) return;
  
  try {
    await interaction.followUp({
      content: quotaMessage,
      ephemeral: true
    });
  } catch (error) {
    log('WARN', 'Failed to send daily quota follow-up', {
      user: interaction.user?.tag,
      error: error.message
    });
  }
}

function initializeFolders() {
  [CONFIG.LUA_FILES_PATH, CONFIG.FIX_FILES_PATH, 
   CONFIG.ONLINE_FIX_PATH, CONFIG.LOGS_PATH,
   path.dirname(CONFIG.DATABASE_PATH),
   path.dirname(CONFIG.GAME_INFO_CACHE_PATH)].forEach(folder => {
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
  });
}

function safeReadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJsonAtomic(filePath, data) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const tempPath = `${filePath}.tmp`;
  const payload = JSON.stringify(data, null, 2);
  fs.writeFileSync(tempPath, payload, 'utf8');
  fs.renameSync(tempPath, filePath);
}
function loadDatabase() {
  let loaded = null;
  let loadedFromBackup = false;
  
  if (fs.existsSync(CONFIG.DATABASE_PATH)) {
    try {
      loaded = safeReadJson(CONFIG.DATABASE_PATH);
      console.log('✅ Loaded database');
    } catch (error) {
      console.error('❌ Error loading primary database:', error.message);
    }
  }
  
  if (!loaded && fs.existsSync(CONFIG.DATABASE_BACKUP_PATH)) {
    try {
      loaded = safeReadJson(CONFIG.DATABASE_BACKUP_PATH);
      loadedFromBackup = true;
      console.log('✅ Recovered database from backup');
    } catch (error) {
      console.error('❌ Error loading backup database:', error.message);
    }
  }
  
  if (loaded && typeof loaded === 'object') {
    database = loaded;
  } else {
    database = {};
    console.warn('⚠️ Using a new empty database in memory.');
  }
  
  ensureDatabaseSchema();
  
  if (loadedFromBackup) {
    saveDatabase();
  }
}

function saveDatabase() {
  try {
    ensureDatabaseSchema();
    writeJsonAtomic(CONFIG.DATABASE_PATH, database);
    writeJsonAtomic(CONFIG.DATABASE_BACKUP_PATH, database);
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
  
  const gameIndexPath = path.join(__dirname, '../game_names_index.json');
  const gameNamesCachePath = path.join(__dirname, '../gameNamesCache.json');
  
  // Load compact game names index
  if (fs.existsSync(gameIndexPath)) {
    try {
      gameNamesIndex = JSON.parse(fs.readFileSync(gameIndexPath, 'utf8'));
      console.log(`✅ Loaded ${Object.keys(gameNamesIndex).length} game names from index`);
    } catch (error) {
      console.error('❌ Error loading game names index:', error);
    }
  }
  
  // Load large game names cache for autocomplete
  if (fs.existsSync(gameNamesCachePath)) {
    try {
      gameNamesCache = JSON.parse(fs.readFileSync(gameNamesCachePath, 'utf8'));
      console.log(`✅ Loaded ${Object.keys(gameNamesCache).length} game names from cache`);
    } catch (error) {
      console.error('❌ Error loading game names cache:', error);
    }
  }
  
  rebuildSearchableGameList();
}

function rebuildSearchableGameList() {
  const merged = new Map();
  
  const upsertEntry = (appId, name) => {
    if (!appId || !name) return;
    const id = String(appId).trim();
    const displayName = String(name).replace(/\s+/g, ' ').trim();
    if (!id || !displayName) return;
    
    if (!merged.has(id)) {
      merged.set(id, { appId: id, name: displayName });
      return;
    }
    
    const existing = merged.get(id);
    if (displayName.length > existing.name.length) {
      merged.set(id, { appId: id, name: displayName });
    }
  };
  
  for (const [appId, name] of Object.entries(gameNamesCache || {})) {
    upsertEntry(appId, name);
  }
  
  for (const [appId, name] of Object.entries(gameNamesIndex || {})) {
    upsertEntry(appId, name);
  }
  
  for (const [appId, cacheEntry] of Object.entries(gameInfoCache || {})) {
    const cachedName = cacheEntry?.data?.name;
    if (cachedName) {
      upsertEntry(appId, cachedName);
    }
  }
  
  for (const game of DENUVO_GAMES) {
    upsertEntry(game.id, game.name);
  }
  
  searchableGameList = Array.from(merged.values());
  log('INFO', 'Rebuilt searchable game cache', { totalGames: searchableGameList.length });
}

function getGameNameById(appId) {
  const id = String(appId || '').trim();
  if (!id) return null;
  return gameNamesCache[id] || gameNamesIndex[id] || gameInfoCache[id]?.data?.name || null;
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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const archiveCommandCache = new Map();

async function commandExists(commandName) {
  if (archiveCommandCache.has(commandName)) {
    return archiveCommandCache.get(commandName);
  }
  
  const checker = process.platform === 'win32' ? 'where.exe' : 'which';
  
  try {
    await execFileAsync(checker, [commandName], { timeout: 5000 });
    archiveCommandCache.set(commandName, true);
    return true;
  } catch (_) {
    archiveCommandCache.set(commandName, false);
    return false;
  }
}

function countManifestEntries(entryList = []) {
  return entryList.reduce((total, entry) => {
    const normalized = String(entry || '').trim().toLowerCase();
    return normalized.endsWith('.manifest') ? total + 1 : total;
  }, 0);
}

function countManifestFilesInDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) return 0;
  
  let total = 0;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      total += countManifestFilesInDirectory(fullPath);
      continue;
    }
    
    if (entry.isFile() && entry.name.toLowerCase().endsWith('.manifest')) {
      total += 1;
    }
  }
  
  return total;
}

async function listArchiveEntriesWith7z(filePath) {
  if (!(await commandExists('7z'))) return null;
  
  const { stdout } = await execFileAsync('7z', ['l', '-slt', filePath], {
    timeout: 45000,
    maxBuffer: 20 * 1024 * 1024
  });
  
  const rawEntries = stdout
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.startsWith('Path = '))
    .map(line => line.slice('Path = '.length).trim())
    .filter(Boolean);
  
  const archiveBasename = path.basename(filePath).toLowerCase();
  const entries = rawEntries.filter((entry, index) => {
    const normalized = entry.toLowerCase();
    if (index === 0 && (normalized === archiveBasename || normalized === filePath.toLowerCase())) {
      return false;
    }
    return true;
  });
  
  return { entries, method: 'list-7z' };
}

async function listArchiveEntriesWithUnzip(filePath) {
  if (!(await commandExists('unzip'))) return null;
  
  const { stdout } = await execFileAsync('unzip', ['-Z1', filePath], {
    timeout: 45000,
    maxBuffer: 20 * 1024 * 1024
  });
  
  const entries = stdout
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
  
  return { entries, method: 'list-unzip' };
}

async function listArchiveEntriesWithUnrar(filePath) {
  if (!(await commandExists('unrar'))) return null;
  
  const { stdout } = await execFileAsync('unrar', ['lb', filePath], {
    timeout: 45000,
    maxBuffer: 20 * 1024 * 1024
  });
  
  const entries = stdout
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
  
  return { entries, method: 'list-unrar' };
}

async function listArchiveEntries(filePath) {
  const ext = path.extname(filePath || '').toLowerCase();
  
  try {
    if (ext === '.zip') {
      return (await listArchiveEntriesWithUnzip(filePath)) || (await listArchiveEntriesWith7z(filePath));
    }
    
    if (ext === '.rar') {
      return (await listArchiveEntriesWithUnrar(filePath)) || (await listArchiveEntriesWith7z(filePath));
    }
    
    if (ext === '.7z') {
      return await listArchiveEntriesWith7z(filePath);
    }
  } catch (error) {
    log('WARN', 'Archive list inspection failed', {
      filePath,
      ext,
      error: error.message
    });
  }
  
  return null;
}

async function extractArchiveAndCountManifests(filePath) {
  const ext = path.extname(filePath || '').toLowerCase();
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'manifest-inspect-'));
  let extractor = null;
  
  try {
    if (ext === '.zip') {
      if (await commandExists('unzip')) {
        extractor = 'unzip';
        await execFileAsync('unzip', ['-qq', '-o', filePath, '-d', tempDir], {
          timeout: 60000,
          maxBuffer: 20 * 1024 * 1024
        });
      } else if (await commandExists('7z')) {
        extractor = '7z';
        await execFileAsync('7z', ['x', '-y', `-o${tempDir}`, filePath], {
          timeout: 60000,
          maxBuffer: 20 * 1024 * 1024
        });
      }
    } else if (ext === '.rar') {
      if (await commandExists('unrar')) {
        extractor = 'unrar';
        await execFileAsync('unrar', ['x', '-o+', '-inul', filePath, tempDir], {
          timeout: 60000,
          maxBuffer: 20 * 1024 * 1024
        });
      } else if (await commandExists('7z')) {
        extractor = '7z';
        await execFileAsync('7z', ['x', '-y', `-o${tempDir}`, filePath], {
          timeout: 60000,
          maxBuffer: 20 * 1024 * 1024
        });
      }
    } else if (ext === '.7z' && await commandExists('7z')) {
      extractor = '7z';
      await execFileAsync('7z', ['x', '-y', `-o${tempDir}`, filePath], {
        timeout: 60000,
        maxBuffer: 20 * 1024 * 1024
      });
    }
    
    if (!extractor) return null;
    
    return {
      manifestCount: countManifestFilesInDirectory(tempDir),
      method: `extract-${extractor}`,
      uncertain: false
    };
  } catch (error) {
    log('WARN', 'Archive extraction inspection failed', {
      filePath,
      ext,
      error: error.message
    });
    return null;
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (_) {}
  }
}

function fallbackBinaryManifestScan(filePath) {
  try {
    const binary = fs.readFileSync(filePath).toString('latin1').toLowerCase();
    const matches = binary.match(/\.manifest\b/g);
    return matches ? matches.length : 0;
  } catch (_) {
    return 0;
  }
}

async function inspectArchiveManifestCount(filePath) {
  const ext = path.extname(filePath || '').toLowerCase();
  if (!['.zip', '.rar', '.7z'].includes(ext)) {
    return null;
  }
  
  const listed = await listArchiveEntries(filePath);
  if (listed) {
    return {
      manifestCount: countManifestEntries(listed.entries),
      method: listed.method,
      uncertain: false
    };
  }
  
  const extracted = await extractArchiveAndCountManifests(filePath);
  if (extracted) {
    return extracted;
  }
  
  return {
    manifestCount: fallbackBinaryManifestScan(filePath),
    method: 'binary-fallback',
    uncertain: true
  };
}

// Get file size from URL using HTTP HEAD request
async function getFileSizeFromUrl(url) {
  try {
    const response = await axios.head(url, {
      timeout: 10000,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const contentLength = response.headers['content-length'];
    if (contentLength) {
      return parseInt(contentLength);
    }
    
    return null;
  } catch (error) {
    // If HEAD fails, try GET with range request
    try {
      const response = await axios.get(url, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Range': 'bytes=0-0'
        },
        maxRedirects: 5,
        validateStatus: (status) => status === 206 || status === 200
      });
      
      const contentLength = response.headers['content-length'] || 
                           response.headers['content-range']?.match(/\/(\d+)/)?.[1];
      if (contentLength) {
        return parseInt(contentLength);
      }
    } catch (err) {
      log('WARN', `Failed to get file size from URL: ${url}`, { error: err.message });
    }
    
    return null;
  }
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

function sanitizeNameForChoice(name) {
  return String(name || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncateChoiceName(name, appId) {
  const normalized = sanitizeNameForChoice(name);
  const suffix = ` (${appId})`;
  const maxNameLength = 100 - suffix.length;
  
  if (normalized.length <= maxNameLength) {
    return `${normalized}${suffix}`;
  }
  
  return `${normalized.slice(0, maxNameLength - 3)}...${suffix}`;
}

function calculateMatchScore(query, candidate) {
  const normalizedQuery = normalizeGameName(query);
  const normalizedCandidate = normalizeGameName(candidate);
  
  if (!normalizedQuery || !normalizedCandidate) return 0;
  if (normalizedCandidate === normalizedQuery) return 100;
  if (normalizedCandidate.startsWith(normalizedQuery)) return 90;
  if (normalizedCandidate.includes(normalizedQuery)) return 75;
  
  const queryTokens = String(query).toLowerCase().split(/\s+/).filter(Boolean);
  const candidateText = String(candidate).toLowerCase();
  if (queryTokens.length === 0) return 0;
  
  const matchedTokens = queryTokens.filter(token => candidateText.includes(token)).length;
  if (matchedTokens === 0) return 0;
  
  const coverage = matchedTokens / queryTokens.length;
  return Math.floor(50 + coverage * 20);
}

function toUniqueGames(candidates = []) {
  const deduped = new Map();
  
  for (const item of candidates) {
    if (!item?.appId || !item?.name) continue;
    const appId = String(item.appId).trim();
    const name = sanitizeNameForChoice(item.name);
    if (!appId || !name) continue;
    
    if (!deduped.has(appId)) {
      deduped.set(appId, { appId, name, score: item.score || 0 });
      continue;
    }
    
    const existing = deduped.get(appId);
    const nextScore = Math.max(existing.score || 0, item.score || 0);
    if (name.length > existing.name.length) {
      deduped.set(appId, { appId, name, score: nextScore });
    } else {
      existing.score = nextScore;
    }
  }
  
  return Array.from(deduped.values());
}

function getPopularAutocompleteGames(limit = AUTOCOMPLETE_LIMIT) {
  const games = POPULAR_APP_IDS.map(appId => {
    const name = getGameNameById(appId);
    if (!name) return null;
    return { appId, name, score: 100 };
  }).filter(Boolean);
  
  if (games.length >= limit) {
    return games.slice(0, limit);
  }
  
  const existingIds = new Set(games.map(game => game.appId));
  for (const game of searchableGameList) {
    if (existingIds.has(game.appId)) continue;
    games.push({ appId: game.appId, name: game.name, score: 50 });
    if (games.length >= limit) break;
  }
  
  return games;
}

function searchLocalGames(query, limit = AUTOCOMPLETE_LIMIT) {
  const input = String(query || '').trim();
  if (!input) {
    return getPopularAutocompleteGames(limit);
  }
  
  const isNumericQuery = /^\d+$/.test(input);
  const results = [];
  
  for (const game of searchableGameList) {
    let score = 0;
    
    if (isNumericQuery) {
      if (game.appId === input) {
        score = 120;
      } else if (game.appId.startsWith(input)) {
        score = 100;
      } else {
        score = calculateMatchScore(input, game.name);
      }
    } else {
      score = calculateMatchScore(input, game.name);
    }
    
    if (score > 0) {
      results.push({
        appId: game.appId,
        name: game.name,
        score
      });
    }
  }
  
  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.name.length !== b.name.length) return a.name.length - b.name.length;
    return a.appId.localeCompare(b.appId);
  });
  
  return toUniqueGames(results).slice(0, limit);
}

async function fetchSteamSuggestions(query, limit = AUTOCOMPLETE_LIMIT) {
  if (!query || query.length < 2) return [];
  
  try {
    const steamResults = await Promise.race([
      searchSteamStore(query),
      new Promise(resolve => setTimeout(() => resolve([]), 2200))
    ]);
    
    return toUniqueGames(
      (steamResults || []).map(item => ({
        appId: item.appId,
        name: item.name,
        score: calculateMatchScore(query, item.name)
      }))
    ).slice(0, limit);
  } catch (error) {
    log('WARN', 'Steam autocomplete fallback failed', { query, error: error.message });
    return [];
  }
}

async function getAutocompleteGames(query, limit = AUTOCOMPLETE_LIMIT) {
  const key = String(query || '').trim().toLowerCase();
  const cached = autocompleteCache.get(key);
  if (cached && (Date.now() - cached.timestamp < AUTOCOMPLETE_CACHE_TTL)) {
    return cached.results.slice(0, limit);
  }
  
  const localGames = searchLocalGames(query, limit);
  let merged = localGames;
  
  if (localGames.length < Math.min(8, limit) && key.length >= 2) {
    const steamGames = await fetchSteamSuggestions(key, limit);
    merged = toUniqueGames([...localGames, ...steamGames])
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, limit);
  }
  
  autocompleteCache.set(key, { timestamp: Date.now(), results: merged });
  return merged;
}

async function resolveAppIdInput(input) {
  const rawInput = String(input || '').trim();
  if (!rawInput) {
    return { appId: null, reason: 'EMPTY', suggestions: [] };
  }
  
  if (/^\d{1,10}$/.test(rawInput)) {
    return { appId: rawInput, reason: 'APPID' };
  }
  
  const embeddedAppId = rawInput.match(/\b(\d{4,10})\b/);
  if (embeddedAppId) {
    return { appId: embeddedAppId[1], reason: 'EMBEDDED_APPID' };
  }
  
  const candidates = await getAutocompleteGames(rawInput, 10);
  if (candidates.length === 0) {
    return { appId: null, reason: 'NOT_FOUND', suggestions: [] };
  }
  
  const normalizedInput = normalizeGameName(rawInput);
  const exactMatch = candidates.find(item => normalizeGameName(item.name) === normalizedInput);
  if (exactMatch) {
    return {
      appId: exactMatch.appId,
      reason: 'EXACT_NAME',
      resolvedName: exactMatch.name
    };
  }
  
  const best = candidates[0];
  const second = candidates[1];
  const bestScore = best?.score || 0;
  const secondScore = second?.score || 0;
  
  if (bestScore >= 90 || (bestScore >= 75 && (bestScore - secondScore) >= 12)) {
    return {
      appId: best.appId,
      reason: 'BEST_MATCH',
      resolvedName: best.name
    };
  }
  
  return {
    appId: null,
    reason: 'AMBIGUOUS',
    suggestions: candidates.slice(0, 5)
  };
}

function createInteractionMessageProxy(interaction) {
  return {
    author: interaction.user,
    channelId: interaction.channelId,
    isInteractionProxy: true,
    canEmbed: interaction.appPermissions
      ? interaction.appPermissions.has(PermissionFlagsBits.EmbedLinks)
      : null,
    async reply(payload) {
      const options = typeof payload === 'string' ? { content: payload } : payload;
      return interaction.editReply(options);
    }
  };
}

// ============================================
// AUTO-DELETE FUNCTION
// ============================================
function scheduleMessageDeletion(message) {
  if (!CONFIG.ENABLE_AUTO_DELETE || !message) return;
  
  const timeout = setTimeout(async () => {
    try {
      if (message.deletable) {
        await message.delete();
        log('INFO', 'Auto-deleted message', { 
          messageId: message.id,
          author: message.author?.tag || 'bot',
          age: '5 minutes'
        });
      }
    } catch (error) {
      log('WARN', 'Failed to auto-delete message', { 
        messageId: message.id,
        error: error.message 
      });
    }
  }, CONFIG.AUTO_DELETE_TIMEOUT);
  
  // Store timeout ID for potential manual cleanup
  if (!message.deleteTimeout) {
    message.deleteTimeout = timeout;
  }
}

// Auto-delete for interaction replies
async function scheduleInteractionDeletion(interaction, replyOptions) {
  if (!CONFIG.ENABLE_AUTO_DELETE) {
    return interaction.editReply(replyOptions);
  }
  
  try {
    const reply = await interaction.editReply(replyOptions);
    
    // Schedule deletion
    const timeout = setTimeout(async () => {
      try {
        if (reply && reply.deletable) {
          await reply.delete();
          log('INFO', 'Auto-deleted interaction reply', { 
            messageId: reply.id,
            user: interaction.user.tag,
            age: '5 minutes'
          });
        }
      } catch (error) {
        log('WARN', 'Failed to auto-delete interaction reply', { 
          error: error.message 
        });
      }
    }, CONFIG.AUTO_DELETE_TIMEOUT);
    
    return reply;
  } catch (error) {
    log('ERROR', 'scheduleInteractionDeletion failed', {
      error: error.message,
      user: interaction.user.tag
    });
    throw error;
  }
}

function getDirectDownloadExpiryMs() {
  return CONFIG.DIRECT_DOWNLOAD_TTL_MINUTES * 60 * 1000;
}

function createTemporaryDownloadLink(filePath, fileName) {
  if (!CONFIG.PUBLIC_BASE_URL) return null;
  if (!fs.existsSync(filePath)) return null;
  
  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = Date.now() + getDirectDownloadExpiryMs();
  
  temporaryDownloads.set(token, {
    filePath,
    fileName,
    expiresAt
  });
  
  return `${CONFIG.PUBLIC_BASE_URL}/download/${token}`;
}

function cleanupExpiredTemporaryDownloads() {
  const now = Date.now();
  for (const [token, entry] of temporaryDownloads.entries()) {
    if (!entry || entry.expiresAt <= now) {
      temporaryDownloads.delete(token);
    }
  }
}

setInterval(cleanupExpiredTemporaryDownloads, 10 * 60 * 1000).unref();

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
      dlcAppIds: Array.isArray(data.dlc) ? data.dlc.map(id => String(id)) : [],
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

async function fetchSteamDlcForApp(appId) {
  try {
    const response = await axios.get(
      `https://store.steampowered.com/api/dlcforapp/?appid=${appId}&l=english&cc=us`,
      {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );
    
    if (!response?.data || response.data.status !== 1) return null;
    
    const dlcList = Array.isArray(response.data.dlc) ? response.data.dlc : [];
    return {
      count: dlcList.length,
      items: dlcList
    };
  } catch (error) {
    log('WARN', `Steam DLC endpoint unavailable for ${appId}`, { error: error.message });
    return null;
  }
}

function normalizeDlcCount(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}

function resolveAccurateDlcInfo({ steamStoreData, steamDlcData, steamDBInfo }) {
  const candidates = [
    { source: 'steam-store-appdetails', count: normalizeDlcCount(steamStoreData?.dlcCount) },
    { source: 'steam-store-dlcforapp', count: normalizeDlcCount(steamDlcData?.count) },
    { source: 'steamdb', count: normalizeDlcCount(steamDBInfo?.dlcCount) }
  ];
  
  candidates.sort((a, b) => b.count - a.count);
  const best = candidates[0] || { source: 'fallback', count: 0 };
  
  return {
    count: best.count,
    source: best.source,
    sources: candidates
  };
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

// Get game info from SteamDB.info (name, size, last update)
async function getGameInfoFromSteamDB(appId) {
  try {
    const response = await axios.get(`https://steamdb.info/app/${appId}/`, {
      timeout: 10000,
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const html = response.data;
    const info = {};
    
    // Extract game name
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) {
      info.name = titleMatch[1].replace(/\s*-\s*SteamDB.*$/i, '').trim();
    }
    
    // Extract last update date
    const updateMatch = html.match(/Last\s+Update[:\s]+<time[^>]*datetime="([^"]+)"/i) ||
                       html.match(/Updated[:\s]+<time[^>]*datetime="([^"]+)"/i) ||
                       html.match(/"last_updated"[:\s]+"([^"]+)"/i);
    if (updateMatch) {
      const date = new Date(updateMatch[1]);
      info.lastUpdate = date.toLocaleDateString('vi-VN');
    }
    
    // Extract size
    const sizePatterns = [
      /Download\s+Size[:\s]+(\d+(?:\.\d+)?)\s*(GB|MB)/i,
      /Disk\s+Space[:\s]+(\d+(?:\.\d+)?)\s*(GB|MB)/i,
    ];
    
    for (const pattern of sizePatterns) {
      const sizeMatch = html.match(pattern);
      if (sizeMatch) {
        const size = parseFloat(sizeMatch[1]);
        const unit = sizeMatch[2].toUpperCase();
        if (size > 0 && size < 1000) {
          info.size = unit === 'GB' ? size * 1024 * 1024 * 1024 : size * 1024 * 1024;
          break;
        }
      }
    }
    
    return Object.keys(info).length > 0 ? info : null;
  } catch (error) {
    log('WARN', `Failed to get info from SteamDB for ${appId}`, { error: error.message });
    return null;
  }
}

// Legacy function for backward compatibility
async function getGameNameFromSteamDB(appId) {
  try {
    const response = await axios.get(`https://steamdb.info/app/${appId}/`, {
      timeout: 10000,
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const html = response.data;
    
    // Extract game name from title tag or header
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) {
      // Remove "- SteamDB" and other noise from title
      let gameName = titleMatch[1]
        .replace(/\s*-\s*SteamDB.*$/i, '')
        .replace(/\s*\..*$/i, '')
        .trim();
      
      if (gameName && gameName.length > 2) {
        log('SUCCESS', `Got game name from SteamDB: ${gameName}`);
        return gameName;
      }
    }
    
    // Try to extract from h1 header
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (h1Match) {
      const gameName = h1Match[1].trim();
      if (gameName && gameName.length > 2) {
        log('SUCCESS', `Got game name from SteamDB h1: ${gameName}`);
        return gameName;
      }
    }
    
    return null;
  } catch (error) {
    log('WARN', `Failed to get game name from SteamDB for ${appId}`, { error: error.message });
    return null;
  }
}

async function getAccurateGameSize(appId) {
  // Try all methods in parallel
  const [steamDBSize, htmlSize, knownSize] = await Promise.all([
    getSizeFromSteamDB(appId),
    getSizeFromSteamHTML(appId),
    Promise.resolve(getKnownGameSize(appId))
  ]);
  
  // Return first valid size
  const size = steamDBSize || htmlSize || knownSize;
  
  if (!size) {
    log('WARN', `All size detection methods failed for ${appId}`);
  }
  
  return size;
}

// Helper to get name from DENUVO_GAMES
function getDenuvoGameName(appId) {
  const game = DENUVO_GAMES.find(g => g.id === parseInt(appId));
  return game ? game.name : null;
}

// Try to fetch game name from Steam Store HTML (robust fallback)
async function getGameNameFromSteamHTML(appId) {
  try {
    const response = await axios.get(`https://store.steampowered.com/app/${appId}`, {
      timeout: 8000,
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    const html = response.data;
    // Prefer og:title
    const ogMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
    if (ogMatch && ogMatch[1]) {
      const name = ogMatch[1].trim();
      if (name.length > 2) return name;
    }
    // Fallback: title tag
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      return titleMatch[1].replace(/\s*on Steam.*$/i, '').trim();
    }
    return null;
  } catch (error) {
    log('WARN', `Failed to get name from Steam HTML for ${appId}`, { error: error.message });
    return null;
  }
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
      timeout: 8000,
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const html = response.data;
    
    // Try multiple patterns for size
    const patterns = [
      /Download\s+Size[:\s]+(\d+(?:\.\d+)?)\s*(GB|MB)/i,
      /Disk\s+Space[:\s]+(\d+(?:\.\d+)?)\s*(GB|MB)/i,
      /<td>Size<\/td>\s*<td[^>]*>(\d+(?:\.\d+)?)\s*(GB|MB)/i,
      /"size"[:\s]+"(\d+(?:\.\d+)?)\s*(GB|MB)"/i
    ];
    
    for (const pattern of patterns) {
      const sizeMatch = html.match(pattern);
      if (sizeMatch) {
        const size = parseFloat(sizeMatch[1]);
        const unit = sizeMatch[2].toUpperCase();
        if (size > 0 && size < 1000) {
          const bytes = unit === 'GB' ? size * 1024 * 1024 * 1024 : size * 1024 * 1024;
          log('SUCCESS', `Got size from SteamDB: ${size} ${unit}`);
          return bytes;
        }
      }
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

function getManifestFileMeta(fileName) {
  const ext = path.extname(fileName || '').toLowerCase();
  
  if (ext === '.lua') {
    return {
      kind: 'lua',
      label: 'Lua Script',
      emoji: '📜',
      shortType: 'lua',
      instruction:
        '```\n1. Download the Lua file\n2. Place it in your game directory\n3. Use with your Lua loader\n4. Launch the game\n```'
    };
  }
  
  if (ext === '.zip' || ext === '.rar' || ext === '.7z') {
    return {
      kind: 'archive',
      label: 'Manifest Package',
      emoji: '📦',
      shortType: ext.replace('.', '').toUpperCase(),
      instruction:
        '```\n1. Download the archive package\n2. Extract all files\n3. Copy manifests to the correct game folder\n4. Replace files if asked\n```'
    };
  }
  
  return {
    kind: 'file',
    label: 'Manifest File',
    emoji: '📁',
    shortType: ext ? ext.replace('.', '').toUpperCase() : 'FILE',
    instruction:
      '```\n1. Download the file\n2. Place it in your game directory\n3. Start the game\n```'
  };
}

function buildManifestSummaryLines({ gameInfo, appId, files, canEmbed }) {
  const lines = [];
  const primaryManifest = files.lua?.[0];
  
  lines.push(`📦 Here are your manifest files for **${gameInfo.name}**`);
  
  if (primaryManifest) {
    const meta = getManifestFileMeta(primaryManifest.name);
    lines.push(`✅ Primary file: \`${primaryManifest.name}\` (${primaryManifest.sizeFormatted}) • ${meta.label}`);
  } else {
    lines.push('⚠️ No local manifest file found yet.');
  }
  
  lines.push(`🆔 App ID: \`${appId}\``);
  
  if (canEmbed === false) {
    lines.push(`${ICONS.warning} Missing permission: **Embed Links**. Showing text + buttons only.`);
  }
  
  return lines;
}

async function getFullGameInfo(appId, forceRefresh = false) {
  const cached = gameInfoCache[appId];
  if (!forceRefresh && cached && (Date.now() - cached.timestamp < CONFIG.CACHE_DURATION)) {
    log('INFO', `Using cached data for ${appId}`);
    return cached.data;
  }
  
  log('INFO', `Fetching fresh data for ${appId} from multiple sources...`);
  
  const [steamData, steamDBInfo, steamSpyData, steamDlcData] = await Promise.all([
    fetchSteamStoreData(appId),
    scrapeSteamDB(appId),
    fetchSteamSpyData(appId),
    fetchSteamDlcForApp(appId)
  ]);
  
  if (!steamData && !steamDBInfo) return null;
  
  const accurateSize = steamDBInfo?.size || await getAccurateGameSize(appId);
  const drmInfo = detectDRMAccurate(appId, steamData || {});
  const publisherInfo = detectPublisher(steamData?.publishers || [steamDBInfo?.publisher]);
  const dlcInfo = resolveAccurateDlcInfo({
    steamStoreData: steamData,
    steamDlcData,
    steamDBInfo
  });
  
  const languageCount = steamData?.supportedLanguages
    ? steamData.supportedLanguages.split(',').filter(l => l.trim()).length
    : 0;
  
  const fullInfo = {
    ...steamData,
    name: steamDBInfo?.name || steamData?.name || getDenuvoGameName(appId),
    developers: steamData?.developers || [steamDBInfo?.developer || 'Unknown'],
    drm: drmInfo,
    publisher: publisherInfo,
    size: accurateSize,
    sizeFormatted: steamDBInfo?.sizeFormatted || formatFileSize(accurateSize),
    sizeType: steamDBInfo?.sizeType,
    dlcCount: dlcInfo.count,
    dlcSource: dlcInfo.source,
    dlcSources: dlcInfo.sources,
    dlcItems: steamDlcData?.items || [],
    languageCount: languageCount,
    steamSpy: steamSpyData,
    lastUpdate: steamDBInfo?.lastUpdate || steamData?.releaseDate,
    rating: steamDBInfo?.rating,
    reviewCount: steamDBInfo?.reviewCount,
    
    isEAGame: publisherInfo.isEA,
    hasMultiplayer: steamData?.categories?.some(c => 
      c.toLowerCase().includes('multi') || c.toLowerCase().includes('co-op')
    ),
    isEarlyAccess: steamData?.categories?.some(c => 
      c.toLowerCase().includes('early access')
    ),
    
    lastUpdated: Date.now(),
  };
  
  gameInfoCache[appId] = {
    data: fullInfo,
    timestamp: Date.now(),
  };

  if (fullInfo.name) {
    const normalizedAppId = String(appId);
    gameNamesIndex[normalizedAppId] = fullInfo.name;

    const existingEntry = searchableGameList.find(item => item.appId === normalizedAppId);
    if (existingEntry) {
      existingEntry.name = fullInfo.name;
    } else {
      searchableGameList.push({ appId: normalizedAppId, name: fullInfo.name });
    }
  }

  saveGameInfoCache();
  
  log('SUCCESS', `Got full info for ${fullInfo.name || appId}`, {
    size: fullInfo.sizeFormatted,
    drm: drmInfo.type,
    price: steamData?.price || 'N/A',
    dlcCount: fullInfo.dlcCount,
    dlcSource: fullInfo.dlcSource
  });
  
  return fullInfo;
}

// ============================================
// FILE MANAGEMENT - ENHANCED WITH ONLINE-FIX
// ============================================

// Smart name matching function
function normalizeGameName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove special characters
    .replace(/\s+/g, ''); // Remove spaces
}

/* DEPRECATED: Folder scanning logic removed
function findOnlineFixByGameName(gameName) {
  // ...
}
function calculateMatchScore(gameName, fileName) {
  // ...
}
*/

function findFiles(appId, gameName = null) {
  const result = { lua: [], fix: [], onlineFix: [] };
  
  // Find manifest files in priority order: archive first, then lua.
  const luaPatterns = [
    path.join(CONFIG.LUA_FILES_PATH, `${appId}.zip`),
    path.join(CONFIG.LUA_FILES_PATH, `${appId}.rar`),
    path.join(CONFIG.LUA_FILES_PATH, `${appId}.7z`),
    path.join(CONFIG.LUA_FILES_PATH, appId, `${appId}.zip`),
    path.join(CONFIG.LUA_FILES_PATH, appId, `${appId}.rar`),
    path.join(CONFIG.LUA_FILES_PATH, appId, `${appId}.7z`),
    path.join(CONFIG.LUA_FILES_PATH, `${appId}.lua`),
    path.join(CONFIG.LUA_FILES_PATH, appId, `${appId}.lua`),
    path.join(CONFIG.LUA_FILES_PATH, appId, 'game.lua'),
  ];
  
  for (const filePath of luaPatterns) {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      result.lua.push({
        path: filePath,
        name: path.basename(filePath),
        size: stats.size,
        sizeFormatted: formatFileSize(stats.size),
      });
    }
  }
  
  // Find Fix files
  const fixPatterns = [
    path.join(CONFIG.FIX_FILES_PATH, `${appId}.rar`),
    path.join(CONFIG.FIX_FILES_PATH, `${appId}.zip`),
    path.join(CONFIG.FIX_FILES_PATH, `${appId}.7z`),
  ];
  
  for (const filePath of fixPatterns) {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      result.fix.push({
        path: filePath,
        name: path.basename(filePath),
        size: stats.size,
        sizeFormatted: formatFileSize(stats.size),
      });
    }
  }
  
  // Find Online-Fix files from folder
  // Pattern: APPID-online-fix.zip or APPID-onlinefix.zip or online-fix-APPID.zip
  if (fs.existsSync(CONFIG.ONLINE_FIX_PATH)) {
    try {
      const onlineFixFiles = fs.readdirSync(CONFIG.ONLINE_FIX_PATH);
      
      for (const file of onlineFixFiles) {
        // Check if filename contains AppID and online-fix keyword
        const containsAppId = file.includes(appId);
        const isOnlineFix = file.toLowerCase().includes('online-fix') || file.toLowerCase().includes('onlinefix');
        
        if (containsAppId && isOnlineFix) {
          const filePath = path.join(CONFIG.ONLINE_FIX_PATH, file);
          const stats = fs.statSync(filePath);
          result.onlineFix.push({
            path: filePath,
            name: file,
            size: stats.size,
            sizeFormatted: formatFileSize(stats.size),
          });
        }
      }
    } catch (err) {
      // Silently skip if online_fix folder doesn't exist or error reading
      log('DEBUG', `Online-Fix folder error for ${appId}`, { error: err.message });
    }
  }
  
  return result;
}

function scanAllGames() {
  const games = new Map(); // AppID -> count of files
  
  function scanFolder(folder) {
    if (!fs.existsSync(folder)) return;
    fs.readdirSync(folder).forEach(item => {
      const parsed = path.parse(item);
      const baseName = parsed.name;
      let appId = null;
      
      // Primary: accept exact numeric file/folder names (e.g. 10.lua, 730.lua, 1245620.lua)
      if (/^\d{1,10}$/.test(baseName)) {
        appId = baseName;
      } else {
        // Fallback: extract long numeric IDs embedded in names (avoid short false positives like "fc26")
        const embedded = baseName.match(/(?:^|[^0-9])(\d{6,10})(?:[^0-9]|$)/);
        if (embedded) {
          appId = embedded[1];
        }
      }
      
      if (!appId) return;
      games.set(appId, (games.get(appId) || 0) + 1);
    });
  }
  
  scanFolder(CONFIG.LUA_FILES_PATH);
  scanFolder(CONFIG.FIX_FILES_PATH);
  // scanFolder(CONFIG.ONLINE_FIX_PATH); // Deprecated
  
  // Return array of AppIDs (unique games count) sorted
  // But also track total files count for logging
  const uniqueGames = Array.from(games.keys()).sort();
  const totalFiles = Array.from(games.values()).reduce((a, b) => a + b, 0);
  
  // Store for use in logging
  global.gameStats = {
    uniqueGames: uniqueGames.length,
    totalFiles: totalFiles
  };
  
  return uniqueGames;
}

// ============================================
// IMPROVED EMBED CREATION
// ============================================
const { createBeautifulGameEmbed } = require('./embed_styles');
const { scrapeSteamDB } = require('./steamdb_scraper');
const { backupToGitHub } = require('../scripts/git_backup');
const CRACK_LINKS = require('../data/crack_links');
const ONLINE_FIX_LINKS = require('../data/online_fix_links');

async function createGameEmbed(appId, gameInfo, files, links = {}) {
  // Use new beautiful embed
  return createBeautifulGameEmbed(appId, gameInfo, files, links);
}

// Legacy embed function (backup)
async function createGameEmbedLegacy(appId, gameInfo, files) {
  const embed = new EmbedBuilder();
  
  // Dynamic color based on DRM severity
  const colors = {
    critical: 0xFF0000,  // Denuvo - Red
    warning: 0xFFA500,   // Anti-cheat - Orange
    info: 0x4A90E2,      // Steam DRM - Blue
    none: 0x00FF00,      // DRM-Free - Green
  };
  embed.setColor(colors[gameInfo.drm.severity] || 0x5865F2);
  
  // Title with game name
  embed.setTitle(`${getGameTitleStatusIcon(files.lua.length > 0)} ${gameInfo.name}`);
  if (parseBoolean(process.env.EMBED_GAME_TITLE_LINK_ENABLED, true)) {
    embed.setURL(`https://store.steampowered.com/app/${appId}`);
  }
  
  // Thumbnail
  if (gameInfo.headerImage) {
    embed.setThumbnail(gameInfo.headerImage);
  }
  
  // Short description in a compact format
  let description = '';
  if (gameInfo.shortDescription) {
    const desc = gameInfo.shortDescription.length > 200 
      ? gameInfo.shortDescription.substring(0, 200) + '...'
      : gameInfo.shortDescription;
    description = `${desc}\n\n`;
  }
  
  // Links in description
  description += `[🔗 Steam Store](https://store.steampowered.com/app/${appId}) | [📊 SteamDB](https://steamdb.info/app/${appId})`;
  embed.setDescription(description);
  
  // ═══ GAME INFO - Compact Layout ═══
  // Row 1: Price | Size
  const priceDisplay = gameInfo.isFree ? '🆓 Free' : gameInfo.price;
  const sizeDisplay = gameInfo.sizeFormatted || 'N/A';
  
  const updateDate = gameInfo.lastUpdate || gameInfo.releaseDate || 'N/A';
  
  embed.addFields(
    { name: '💰 Giá', value: priceDisplay, inline: true },
    { name: '💾 Dung lượng', value: sizeDisplay, inline: true },
    { name: '🔄 Cập nhật', value: updateDate, inline: true }
  );
  
  // Row 2: DLC | Language | Rating
  embed.addFields(
    { name: '🎯 DLC', value: `${gameInfo.dlcCount}`, inline: true },
    { name: '🌍 Ngôn ngữ', value: `${gameInfo.languageCount}`, inline: true },
    { name: '⭐ Đánh giá', value: `${formatNumber(gameInfo.recommendations)}`, inline: true }
  );
  
  // Row 3: Developer | Publisher | DRM
  const devName = (gameInfo.developers[0] || 'Unknown').substring(0, 25);
  const pubName = gameInfo.publisher.name.substring(0, 25);
  const drmBadge = gameInfo.drm.isDRMFree ? '✅ Không DRM' : `${gameInfo.drm.icon} ${gameInfo.drm.type}`;
  
  embed.addFields(
    { name: '👨‍💻 Dev', value: devName, inline: true },
    { name: '🏢 Pub', value: pubName, inline: true },
    { name: '🔐 DRM', value: drmBadge, inline: true }
  );
  
  // ═══ DRM WARNING SECTION ═══
  if (gameInfo.drm.severity === 'critical') {
    embed.addFields({
      name: '⚠️ DENUVO - CÓ THỂ KHÓ CHƠI',
      value: 
        '❌ Game này có **DENUVO** - bảo vệ rất mạnh\n' +
        '⏳ Có thể chưa bị crack hoặc crack chưa ổn định\n' +
        '⚠️ Chỉ tải nếu bạn chắc chắn đã có crack!',
      inline: false
    });
  } else if (gameInfo.drm.severity === 'warning') {
    const acName = gameInfo.drm.hasEAC ? 'EasyAntiCheat' :
                   gameInfo.drm.hasBattlEye ? 'BattlEye' : 'Anti-Cheat';
    embed.addFields({
      name: `🛡️ ${acName} - CẦN FIX ĐẶC BIỆT`,
      value: 
        `Game dùng **${acName}** - cần bypass riêng\n` +
        `Tải **Crack/Fix** để có thể chơi online/co-op`,
      inline: false
    });
  } else if (gameInfo.drm.isDRMFree) {
    embed.addFields({
      name: '✅ DRM-FREE - CHƠI ĐƯỢC NGAY',
      value: 
        '🎉 Game **KHÔNG CÓ BẢO VỆ DRM**\n' +
        '✨ Tải game, giải nén, chơi luôn!',
      inline: false
    });
  }
  
  // ═══ FILE STATUS ═══
  const hasMultiplayerFeatures = gameInfo.hasMultiplayer || 
                                  gameInfo.drm.needsOnlineFix ||
                                  gameInfo.categories?.some(c => 
                                    c.toLowerCase().includes('multi') || 
                                    c.toLowerCase().includes('co-op'));
  
  let fileInfo = [];
  if (files.lua.length > 0) fileInfo.push('✅ **Lua** - ' + files.lua[0].sizeFormatted);
  if (files.fix.length > 0) fileInfo.push('✅ **Crack/Fix** - ' + files.fix[0].sizeFormatted);
  if (files.onlineFix.length > 0) {
    fileInfo.push('✅ **Online-Fix** - ' + files.onlineFix[0].sizeFormatted);
  } else if (hasMultiplayerFeatures) {
    fileInfo.push('⚠️ **Online-Fix** - Chưa có');
  }
  
  if (fileInfo.length > 0) {
    embed.addFields({
      name: '📦 FILE CÓ SẴN',
      value: fileInfo.join('\n'),
      inline: false
    });
  }
  
  // EA Game Notice - inline
  if (gameInfo.isEAGame) {
    embed.addFields({
      name: '⚙️ EA GAME',
      value: 'Cần Origin/EA App',
      inline: true
    });
  }
  
  // Early Access Notice - inline
  if (gameInfo.isEarlyAccess) {
    embed.addFields({
      name: '🚧 EARLY ACCESS',
      value: 'Game chưa hoàn thành',
      inline: true
    });
  }
  
  embed.setFooter({
    text: `App ID: ${appId} | Cập nhật: ${new Date().toLocaleDateString('vi-VN')}`,
    iconURL: 'https://steampowered-a.akamaihd.net/steamcommunity/public/images/clans/39049585/5371505ff1c79c7db43dccf05fe86b1933203ce3.png'
  });
  
  return embed;
}

// ============================================
// COMMAND: GAME INFO
// ============================================

async function handleGameCommand(message, appId) {
  try {
    const isInteractionFlow = Boolean(message.isInteractionProxy);
    const loadingMsg = await message.reply(`🔍 **Searching for AppID: ${appId}...**`);
    scheduleMessageDeletion(loadingMsg);
    
    // STEP 1: Get info from SteamDB first
    if (!isInteractionFlow) {
      await loadingMsg.edit(`📊 **Scanning SteamDB...**`);
    }
    const steamDBInfo = await scrapeSteamDB(appId);
    
    if (!isInteractionFlow && steamDBInfo?.name) {
      await loadingMsg.edit(`✅ **Found: ${steamDBInfo.name}**\n⏳ Fetching details...`);
    }
    
    // STEP 2: Get info from Steam API
    let gameInfo = await getFullGameInfo(appId);
    
    if (!gameInfo) {
      const steamDBName = await getGameNameFromSteamDB(appId);
      const denuvoName = getDenuvoGameName(appId);
      const gameName = steamDBName || denuvoName || `App ${appId}`;
      
      if (!steamDBName && !denuvoName) {
        if (!isInteractionFlow) {
          await loadingMsg.edit(
            `${ICONS.warning} Cannot fetch full info from Steam for AppID: \`${appId}\`\n` +
            `${ICONS.link} Link: https://store.steampowered.com/app/${appId}\n` +
            `${ICONS.link} SteamDB: https://steamdb.info/app/${appId}/\n` +
            `➡️ Continuing with minimal data to show available downloads`
          );
        }
      } else if (!isInteractionFlow) {
        await loadingMsg.edit(`✅ **Found: ${gameName}**\n⏳ Preparing details...`);
      }
      
      gameInfo = {
        name: gameName,
        headerImage: null,
        price: 'Unknown',
        sizeFormatted: 'Unknown',
        releaseDate: 'Unknown',
        dlcCount: 0,
        languageCount: 0,
        recommendations: 0,
        developers: ['Unknown'],
        publishers: ['Unknown'],
        shortDescription: 'Game information (minimal mode)',
        categories: [],
        drm: {
          type: 'Unknown',
          severity: 'info',
          icon: ICONS.info,
          isDRMFree: false,
          needsOnlineFix: false,
        },
        publisher: { name: 'Unknown', isEA: false },
      };
      
      log('INFO', `Using minimal data for ${appId}: ${gameName}`);
    }
    
    // Now find files with game name for smart Online-Fix search
    const files = findFiles(appId, gameInfo.name);
    
    // Check for direct crack link
    const crackLink = CRACK_LINKS[appId];
    // Check for direct online-fix link
    const onlineFixLink = ONLINE_FIX_LINKS[appId];

    // DEBUG: Log what we found
    log('INFO', `Resources check for ${appId}`, {
      lua: files.lua.length,
      fix: files.fix.length,
      onlineFile: files.onlineFix.length,
      crackLink: !!crackLink,
      onlineLink: !!onlineFixLink
    });

    const hasManifestFiles = files.lua.length > 0;
    
    if (!hasManifestFiles) {
      const failEmbed = new EmbedBuilder()
        .setColor(0xED4245)
        .setTitle(`${getGameTitleStatusIcon(false)} Manifest Generation Failed: App ${appId}`)
        .setDescription('Manifest files for this game are not available in our database.')
        .addFields(
          {
            name: 'Links',
            value: `[Steam Store](https://store.steampowered.com/app/${appId})\n[SteamDB](https://steamdb.info/app/${appId})`,
            inline: false
          },
          {
            name: 'App ID',
            value: `\`${appId}\``,
            inline: false
          }
        );
      
      return loadingMsg.edit({
        content: '❌ Manifest files for this game were not found, suggesting it\'s not in our database. Please request to add the game.',
        embeds: [failEmbed],
        components: []
      });
    }
    
    const embed = await createGameEmbed(appId, gameInfo, files, { onlineFixLink, crackLink, autoPatch: database.games[appId]?.autoPatch });
    
    // Create download buttons (Single Row for cleaner layout)
    const rows = [];
    const row = new ActionRowBuilder();
    const primaryManifest = files.lua[0];
    const primaryManifestMeta = primaryManifest ? getManifestFileMeta(primaryManifest.name) : null;
    
    // GIF URLs for buttons
    const gifUrls = {
      lua: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaDB1anh5dGRqOThzcWtuMzltcGdrdGtkbWtmNDN4OHp2d3NieW8zbCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/EnrH0xdlmT5uBZ9BCe/giphy.gif",
      onlineFix: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaDB1anh5dGRqOThzcWtuMzltcGdrdGtkbWtmNDN4OHp2d3NieW8zbCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/YO7P8VC7nlQlO/giphy.gif",
      crack: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaDB1anh5dGRqOThzcWtuMzltcGdrdGtkbWtmNDN4OHp2d3NieW8zbCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3o6ZtpgLSKicg4p1i8/giphy.gif"
    };
    
    // 1. Download manifest (archive preferred, then lua)
    if (files.lua.length > 0) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`dl_lua_${appId}_0`)
          .setLabel(
            primaryManifestMeta?.kind === 'archive'
              ? `Get Package (${primaryManifest.sizeFormatted})`
              : `Get Lua (${primaryManifest.sizeFormatted})`
          )
          .setStyle(ButtonStyle.Primary)
          .setEmoji(primaryManifestMeta?.emoji || '📦')
      );
    }
    
    // 2. Download Online-Fix (Link)
    if (onlineFixLink) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`dl_online_${appId}`)
          .setLabel('Online-Fix')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🌐')
      );
    }

    // 3. Download Crack (Link) - Single button with all links inside
    // IMPORTANT: Only create ONE button, even if there are multiple links
    // Fix: Explicit check for FC 26 Showcase or existing crackLink
    if ((crackLink || appId === '3629260') && !row.components.some(btn => btn.data.custom_id?.includes('dl_crack'))) {
      const crackLinks = Array.isArray(crackLink) ? crackLink : (crackLink ? [crackLink] : []);
      
      // Fallback for FC 26 Showcase if not in CRACK_LINKS but requested
      if (appId === '3629260' && crackLinks.length === 0) {
          // Check if link exists in data file, if not add fallback
          // This ensures the button appears even if CRACK_LINKS wasn't updated in memory yet
          const hardcodedLink = "https://huggingface.co/datasets/MangaVNteam/Assassin-Creed-Odyssey-Crack/resolve/main/EA%20SPORTS%20FC%E2%84%A2%2026%20SHOWCASE.zip?download=true";
          crackLinks.push(hardcodedLink);
      }

      if (crackLinks.length > 0) {
        // Create only ONE button for all crack links
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`dl_crack_${appId}_0`)
            .setLabel(`Bypass${crackLinks.length > 1 ? ` (${crackLinks.length})` : ''}`)
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🛠️')
        );
        
        log('INFO', `Created crack button for ${appId}`, { 
          linksCount: crackLinks.length,
          buttonId: `dl_crack_${appId}_0`
        });
      }
    }

    // 4. Download Crack (File) - REMOVED per user request
    /*
    if (files.fix.length > 0) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`dl_fix_${appId}_0`)
          .setLabel(`Download Crack (${files.fix[0].sizeFormatted})`)
          .setStyle(ButtonStyle.Success)
          .setEmoji('🔧')
      );
    }
    */
    
    // Add row if it has components
    if (row.components.length > 0) rows.push(row);
    
    const responsePayload = {
      content: null,
      embeds: [embed],
      components: rows,
    };
    
    if (message.canEmbed === false) {
      responsePayload.content = `${ICONS.warning} Missing permission: **Embed Links**.`;
      responsePayload.embeds = [];
    }
    
    const responseMsg = await loadingMsg.edit(responsePayload);
    
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
// COMMAND: SEARCH - STEAM API REAL-TIME
// ============================================
const { searchSteamStore } = require('./steam_search');
const { fetchLuaFromOpenCloud } = require('./openlua_scraper');
const { getGameGrid } = require('./steamgriddb_api');

async function handleFetchLuaCommand(message) {
  if (!isAdmin(message.author.id)) {
    const msg = await message.reply(`${ICONS.cross} Only admins can use this command.`);
    scheduleMessageDeletion(msg);
    return;
  }

  const args = message.content.split(/\s+/);
  const appId = args[1];
  const gameName = args.slice(2).join(' ');

  if (!appId) {
    const msg = await message.reply(`${ICONS.info} Usage: \`!fetchlua <appid> [game name]\``);
    scheduleMessageDeletion(msg);
    return;
  }

  const loadingMsg = await message.reply(`${ICONS.sparkles} Searching OpenLua for **${appId}**...`);

  try {
    const result = await fetchLuaFromOpenCloud(appId, gameName);

    if (result.success) {
      await loadingMsg.edit(`${ICONS.check} **Success!** Downloaded Lua for \`${appId}\`.\n📂 Saved to: \`lua_files/${appId}.lua\``);
    } else {
      await loadingMsg.edit(`${ICONS.cross} **Failed:** ${result.error}`);
    }
  } catch (error) {
    await loadingMsg.edit(`${ICONS.cross} **Error:** ${error.message}`);
  }
  
  scheduleMessageDeletion(loadingMsg, 10000); // Keep result longer
}

async function searchGameByName(query) {
  try {
    // Search directly from Steam Store API
    const steamResults = await searchSteamStore(query);
    
    if (steamResults.length > 0) {
      return steamResults.slice(0, 20).map(game => ({
        appId: game.appId,
        name: game.name,
        matchScore: 90
      }));
    }
    
    // Fallback: search in local files
    const normalizedQuery = normalizeGameName(query);
    const allGames = scanAllGames();
    const matches = [];
    
    for (const appId of allGames) {
      let gameName = gameNamesIndex[appId] || gameInfoCache[appId]?.data?.name;
      
      if (!gameName && matches.length < 20) {
        // Try Steam Store HTML first (less likely to be blocked than SteamDB)
        gameName = await getGameNameFromSteamHTML(appId) || await getGameNameFromSteamDB(appId);
        if (gameName) {
          gameNamesIndex[appId] = gameName;
        }
      }
      
      if (gameName) {
        const normalizedName = normalizeGameName(gameName);
        if (normalizedName.includes(normalizedQuery)) {
          matches.push({
            appId,
            name: gameName,
            matchScore: calculateMatchScore(normalizedQuery, normalizedName)
          });
        }
      }
      
      if (matches.length >= 20) break;
    }
    
    matches.sort((a, b) => b.matchScore - a.matchScore);
    return matches;
    
  } catch (error) {
    log('ERROR', 'Failed to search games', { query, error: error.message });
    return [];
  }
}

async function handleSearchCommand(message, query) {
  try {
    const loadingMsg = await message.reply(`${ICONS.info} Searching on Steam...`);
    scheduleMessageDeletion(loadingMsg);
    
    const results = await searchGameByName(query);
    
    if (results.length === 0) {
      const embedNotFound = new EmbedBuilder()
        .setColor(0xE74C3C) // Red color
        .setTitle(`${ICONS.cross} Game Not Found`)
        .setDescription(`Could not find game "**${query}**" in the system.\n\n**Suggestions:**\n• Check the spelling of the game name\n• Use fewer keywords (e.g. "tekken" instead of "tekken 8 deluxe edition")\n• Try searching by AppID if you know it`)
        .setFooter({ text: 'Auto-deletes in 5min' });
      
      return loadingMsg.edit({ content: null, embeds: [embedNotFound] });
    }
    
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(`${ICONS.game} Search Results: "**${query}**"`)
      .setDescription(`Found ${results.length} game(s). Use \`!${CONFIG.COMMAND_PREFIX}<appid>\` to view details.`);
    
    // Show results in pages if too many
    const maxDisplay = 10; // Giảm xuống 10 để hiển thị ảnh đẹp hơn
    const displayResults = results.slice(0, maxDisplay);
  
    const denuvoSet = new Set(DENUVO_GAMES.map(g => String(g.id)));
    
    // Nếu chỉ có 1 kết quả, hiển thị dạng Large Embed
    if (displayResults.length === 1) {
      const game = displayResults[0];
      const isDenuvo = denuvoSet.has(String(game.appId));
      const drmTag = isDenuvo ? ' • ⚠️ **Denuvo Anti-Tamper**' : '';
      
      const hasLua = fs.existsSync(path.join(CONFIG.LUA_FILES_PATH, `${game.appId}.lua`));
      const hasOnlineFix = ONLINE_FIX_LINKS[game.appId] || fs.existsSync(path.join(CONFIG.ONLINE_FIX_PATH, `${game.appId}-online-fix.zip`));
      const hasCrack = CRACK_LINKS[game.appId];
      
      let statusIcons = [];
      if (hasLua) statusIcons.push('📜 Lua');
      if (hasOnlineFix) statusIcons.push('🌐 Online-Fix');
      if (hasCrack) statusIcons.push('🔥 Crack');
      const statusText = statusIcons.length > 0 ? `\n   ${statusIcons.join(' • ')}` : '';

      // Try SteamGridDB first, fallback to Steam Header
      let imageUrl = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appId}/header.jpg`;
      try {
        const gridUrl = await getGameGrid(game.appId);
        if (gridUrl) imageUrl = gridUrl;
      } catch (e) { /* ignore */ }

      embed.setThumbnail(imageUrl);
      embed.addFields({
        name: `1. ${game.name}${isDenuvo ? ' [DRM]' : ''}`,
        value: `AppID: \`${game.appId}\` • Command: \`!${game.appId}\`${drmTag}${statusText}`,
        inline: false
      });
    } else {
      // Hiển thị danh sách nhiều game
      // Discord không hỗ trợ ảnh cho từng field, nên ta chỉ có thể hiển thị text
      // Tuy nhiên, ta có thể set ảnh Thumbnail là game đầu tiên để đẹp hơn
      
      // Try SteamGridDB for first game
      let firstGameImage = `https://cdn.cloudflare.steamstatic.com/steam/apps/${displayResults[0].appId}/header.jpg`;
      try {
        const gridUrl = await getGameGrid(displayResults[0].appId);
        if (gridUrl) firstGameImage = gridUrl;
      } catch (e) { /* ignore */ }
      
      embed.setThumbnail(firstGameImage);
      
      displayResults.forEach((game, index) => {
        const isDenuvo = denuvoSet.has(String(game.appId));
        const drmTag = isDenuvo ? ' • ⚠️ **Denuvo Anti-Tamper**' : '';
        
        const hasLua = fs.existsSync(path.join(CONFIG.LUA_FILES_PATH, `${game.appId}.lua`));
        const hasOnlineFix = ONLINE_FIX_LINKS[game.appId] || fs.existsSync(path.join(CONFIG.ONLINE_FIX_PATH, `${game.appId}-online-fix.zip`));
        const hasCrack = CRACK_LINKS[game.appId];
        
        let statusIcons = [];
        if (hasLua) statusIcons.push('📜');
        if (hasOnlineFix) statusIcons.push('🌐');
        if (hasCrack) statusIcons.push('🔥');
        
        const statusText = statusIcons.length > 0 ? ` [${statusIcons.join(' ')}]` : '';
  
        embed.addFields({
          name: `${index + 1}. ${game.name}`,
          value: `🆔 \`${game.appId}\`${statusText}${isDenuvo ? ' ⚠️ Denuvo' : ''} • \`!${game.appId}\``,
          inline: false
        });
      });
    }
    
    if (results.length > maxDisplay) {
      embed.addFields({
        name: '📋 More Results',
        value: `... and ${results.length - maxDisplay} more games. Refine your search for better results.`,
        inline: false
      });
    }
    
    const warningEmbeds = [];
    displayResults.forEach((game) => {
      const isDenuvo = denuvoSet.has(String(game.appId));
      if (!isDenuvo) return;
      const panel = new EmbedBuilder()
        .setColor(0xE74C3C)
        .setTitle('🔐 DRM/Restrictions detected')
        .setDescription(
          `**${game.name}**\n` +
          'Denuvo Anti-Tamper detected\n' +
          (/\bEA\b|\bEA SPORTS\b|Electronic Arts/i.test(game.name) ? 'EA App\n' : '') +
          'You may NOT be able to play this game. [More info](https://store.steampowered.com/app/' + game.appId + ')'
        )
        .setThumbnail(`https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appId}/capsule_184x69.jpg`);
      warningEmbeds.push(panel);
    });
    
    embed.setFooter({ text: 'Click AppID to view full info • Auto-deletes in 5min' });
    
    await loadingMsg.edit({ embeds: [embed, ...warningEmbeds] });
    
    database.stats.totalSearches++;
    saveDatabase();
    
    log('INFO', 'Search completed', { query, resultsCount: results.length });
    
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
    .setDescription('Bot with new features: Auto-delete, Online-Fix, Expanded DRM database')
    .addFields(
      {
        name: `${ICONS.sparkles} Commands`,
        value: [
          '`/gen appid:<id-or-name>` - Default slash command',
          `\`${CONFIG.COMMAND_PREFIX}<appid>\` - View full game info`,
          `\`${CONFIG.COMMAND_PREFIX}search <name>\` - Search games`,
          `\`${CONFIG.COMMAND_PREFIX}refresh <appid>\` - Refresh game info`,
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
        '`!collectlua` - Collect new Lua files',
        '`!backup` - Backup project to GitHub',
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
  
  const allGames = scanAllGames();
  const uniqueGames = global.gameStats?.uniqueGames || allGames.length;
  const totalFiles = global.gameStats?.totalFiles || 'N/A';
  const cachedGames = Object.keys(gameInfoCache).length;
  
  const embed = new EmbedBuilder()
    .setColor(0xFFAA00)
    .setTitle(`📊 BOT STATISTICS`)
    .addFields(
      { name: '🎮 Unique Games', value: `${uniqueGames}`, inline: true },
      { name: '📁 Total Files', value: `${totalFiles}`, inline: true },
      { name: '💾 Cached Info', value: `${cachedGames}`, inline: true },
      { name: '⬇️ Downloads', value: `${database.stats.totalDownloads}`, inline: true },
      { name: '🔍 Searches', value: `${database.stats.totalSearches}`, inline: true },
      { name: '⏱️ Uptime', value: `${Math.floor(process.uptime() / 3600)}h`, inline: true }
    )
    .setFooter({ 
      text: `Updated: ${new Date().toLocaleString('en-US')}`,
      iconURL: client.user?.avatarURL()
    })
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

async function handleRefreshCommand(message, appId) {
  try {
    const loadingMsg = await message.reply(`${ICONS.info} Refreshing info from SteamDB...`);
    scheduleMessageDeletion(loadingMsg);
    
    // Force refresh from SteamDB
    const gameInfo = await getFullGameInfo(appId, true);
    
    if (!gameInfo) {
      return loadingMsg.edit(`${ICONS.cross} Cannot fetch new info for AppID: \`${appId}\``);
    }
    
    const refreshMsg = await loadingMsg.edit(
      `${ICONS.check} **Info updated successfully!**\n\n` +
      `${ICONS.game} Game: **${gameInfo.name}**\n` +
      `${ICONS.size} Size: **${gameInfo.sizeFormatted || 'Unknown'}**\n` +
      `${ICONS.price} Price: **${gameInfo.price}**\n` +
      `${ICONS.info} Use \`!${appId}\` to view details`
    );
    scheduleMessageDeletion(refreshMsg);
    
  } catch (error) {
    log('ERROR', 'Error in handleRefreshCommand', { appId, error: error.message });
    message.reply(`${ICONS.cross} Error refreshing info!`).catch(() => {});
  }
}

async function handleCollectLuaCommand(message) {
  if (!isAdmin(message.author.id)) {
    return message.reply(`${ICONS.cross} Admin only!`);
  }
  
  try {
    const loadingMsg = await message.reply(
      `${ICONS.info} **Collecting Lua files from multiple sources...**\n\n` +
      `${ICONS.sparkles} Sources: GitHub, Gists, Known Repos\n` +
      `${ICONS.warning} This process may take a few minutes...`
    );
    scheduleMessageDeletion(loadingMsg);
    
    // Import collector
    const { collectAllSources } = require('./lua_collector');
    
    // Run collection
    const startTime = Date.now();
    await collectAllSources();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    // Count total files
    const allGames = scanAllGames();
    
    const resultMsg = await loadingMsg.edit(
      `${ICONS.check} **Collection complete!**\n\n` +
      `${ICONS.fire} Total games: **${allGames.length}**\n` +
      `${ICONS.info} Duration: **${duration}s**\n` +
      `${ICONS.sparkles} Use \`!list\` to view list`
    );
    scheduleMessageDeletion(resultMsg);
    
  } catch (error) {
    log('ERROR', 'Error in handleCollectLuaCommand', { error: error.message });
    message.reply(`${ICONS.cross} Error collecting Lua files!`).catch(() => {});
  }
}

async function handleBackupCommand(message) {
  if (!isAdmin(message.author.id)) {
    return message.reply(`${ICONS.cross} Admin only!`);
  }

  const loadingMsg = await message.reply(`${ICONS.info} **Starting backup to GitHub...** ⏳`);
  
  try {
    const success = await backupToGitHub();
    
    if (success) {
      await loadingMsg.edit(`${ICONS.check} **Backup successful!** Project source code pushed to GitHub.`);
    } else {
      await loadingMsg.edit(`${ICONS.cross} **Backup failed!** Check console logs for details.`);
    }
  } catch (error) {
    log('ERROR', 'Backup command failed', { error: error.message });
    await loadingMsg.edit(`${ICONS.cross} **Backup failed:** ${error.message}`);
  }
  
  scheduleMessageDeletion(loadingMsg);
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

async function handleGenAutocomplete(interaction) {
  const focused = interaction.options.getFocused(true);
  if (focused.name !== 'appid') {
    return interaction.respond([]);
  }
  
  const matches = await getAutocompleteGames(focused.value, AUTOCOMPLETE_LIMIT);
  const choices = matches.slice(0, AUTOCOMPLETE_LIMIT).map(item => ({
    name: truncateChoiceName(item.name, item.appId),
    value: item.appId
  }));
  
  await interaction.respond(choices);
}

function buildSlashValidationErrorEmbed(rawInput, resolution) {
  const embed = new EmbedBuilder()
    .setColor(0xED4245)
    .setTitle('Game not found')
    .setDescription(
      rawInput
        ? `Could not resolve \`${rawInput}\` to a valid game.\nUse the autocomplete list for exact results.`
        : 'You must fill the `appid` field with a Steam App ID or game name.'
    );
  
  if (resolution?.suggestions?.length) {
    const suggestionLines = resolution.suggestions
      .slice(0, 5)
      .map((game, idx) => `${idx + 1}. ${game.name} (\`${game.appId}\`)`);
    
    embed.addFields({
      name: 'Did you mean',
      value: suggestionLines.join('\n').slice(0, 1024),
      inline: false
    });
  }
  
  embed.setFooter({ text: 'Tip: type /gen then use autocomplete for appid.' });
  return embed;
}

function buildProcessingEmbed(displayName, appId) {
  return new EmbedBuilder()
    .setColor(0x00B8D9)
    .setTitle('⏳ Processing...')
    .setDescription(
      `**${displayName}** (Game ID: \`${appId}\`)\n\n` +
      'Generating files, please wait...\n' +
      'This may take a few seconds depending on game size.'
    )
    .setFooter({ text: 'Solus Gen • Preparing accurate game data & manifests' });
}

async function handleGenSlashCommand(interaction) {
  const rawInput = interaction.options.getString('appid', true).trim();
  
  // Acknowledge early to avoid 3s interaction timeout on slow/network paths.
  await interaction.deferReply();
  
  if (!rawInput) {
    return interaction.editReply({
      embeds: [buildSlashValidationErrorEmbed(rawInput)],
    });
  }
  
  const resolution = await resolveAppIdInput(rawInput);
  if (!resolution.appId) {
    return interaction.editReply({
      embeds: [buildSlashValidationErrorEmbed(rawInput, resolution)],
    });
  }

  log('INFO', 'Slash /gen request resolved', {
    user: interaction.user.tag,
    input: rawInput,
    appId: resolution.appId,
    reason: resolution.reason
  });
  
  const resolvedName = resolution.resolvedName || getGameNameById(resolution.appId) || `App ${resolution.appId}`;
  await interaction.editReply({
    embeds: [buildProcessingEmbed(resolvedName, resolution.appId)],
    content: null,
    components: []
  });
  
  await sleep(CONFIG.GEN_PROCESSING_DELAY_MS);
  
  const proxyMessage = createInteractionMessageProxy(interaction);
  await handleGameCommand(proxyMessage, resolution.appId);
}

async function upsertApplicationCommand(commandManager, commandData) {
  const commands = await commandManager.fetch();
  const sameName = commands.filter(cmd => cmd.name === commandData.name);
  
  if (sameName.length > 0) {
    // Keep one canonical command, update it, and delete stale duplicates.
    const canonical = sameName[0];
    await canonical.edit(commandData);
    
    const duplicates = sameName.slice(1);
    for (const duplicate of duplicates) {
      try {
        await duplicate.delete();
      } catch (error) {
        log('WARN', 'Failed to delete duplicate slash command', {
          commandName: duplicate.name,
          commandId: duplicate.id,
          error: error.message
        });
      }
    }
    
    return duplicates.length > 0 ? 'updated+deduplicated' : 'updated';
  }
  
  await commandManager.create(commandData);
  return 'created';
}

async function deleteCommandsByName(commandManager, commandName) {
  const commands = await commandManager.fetch();
  const matches = commands.filter(cmd => cmd.name === commandName);
  
  for (const command of matches) {
    try {
      await command.delete();
    } catch (error) {
      log('WARN', 'Failed to delete slash command', {
        commandName: command.name,
        commandId: command.id,
        error: error.message
      });
    }
  }
  
  return matches.length;
}

async function registerSlashCommandForGuild(guild) {
  try {
    const result = await upsertApplicationCommand(guild.commands, GEN_SLASH_COMMAND);
    log('INFO', `Slash command ${result} for guild`, { guildId: guild.id, guildName: guild.name });
    return { ok: true, guildId: guild.id };
  } catch (error) {
    log('WARN', 'Failed to register slash command for guild', {
      guildId: guild.id,
      guildName: guild.name,
      error: error.message
    });
    return { ok: false, guildId: guild.id, error: error.message };
  }
}

async function registerSlashCommands() {
  if (!client.application) {
    log('WARN', 'Cannot register slash commands: client.application missing');
    return;
  }
  
  if (CONFIG.REGISTER_GLOBAL_SLASH_COMMAND) {
    try {
      const globalResult = await upsertApplicationCommand(client.application.commands, GEN_SLASH_COMMAND);
      log('INFO', `Global slash command ${globalResult}`, { command: GEN_SLASH_COMMAND.name });
    } catch (error) {
      log('WARN', 'Failed to register global slash command', { error: error.message });
    }
  } else {
    try {
      const deleted = await deleteCommandsByName(client.application.commands, GEN_SLASH_COMMAND.name);
      if (deleted > 0) {
        log('INFO', 'Removed global slash commands to avoid duplicates', {
          command: GEN_SLASH_COMMAND.name,
          deleted
        });
      }
    } catch (error) {
      log('WARN', 'Failed to cleanup global slash commands', { error: error.message });
    }
  }
  
  let guilds = [];
  let successful = 0;
  
  if (CONFIG.REGISTER_GUILD_SLASH_COMMAND) {
    guilds = Array.from(client.guilds.cache.values());
    const guildResults = await Promise.all(guilds.map(registerSlashCommandForGuild));
    successful = guildResults.filter(item => item.ok).length;
  }
  
  log('INFO', 'Slash command registration finished', {
    globalEnabled: CONFIG.REGISTER_GLOBAL_SLASH_COMMAND,
    guildEnabled: CONFIG.REGISTER_GUILD_SLASH_COMMAND,
    guildTotal: guilds.length,
    guildSuccess: successful
  });
}

// ============================================
// MESSAGE HANDLER
// ============================================

client.on('messageCreate', async (message) => {
  try {
    console.log(`[DEBUG] messageCreate: author=${message.author?.tag || message.author?.id} id=${message.author?.id} channel=${message.channelId} content="${String(message.content).replace(/\n/g, ' ')}"`);
  } catch (e) { /* ignore logging errors */ }

  if (message.author.bot) return;
  if (!message.content.startsWith(CONFIG.COMMAND_PREFIX)) return;
  
  // ============================================
  // PREVENT DUPLICATE MESSAGE PROCESSING
  // ============================================
  const messageKey = `${message.id}-${message.channelId}`;
  
  if (MESSAGE_HANDLERS.has(messageKey)) {
    log('WARN', 'Duplicate message detected (ignored)', { messageId: message.id });
    return;
  }
  
  MESSAGE_HANDLERS.add(messageKey);
  
  // Auto-cleanup after timeout
  setTimeout(() => {
    MESSAGE_HANDLERS.delete(messageKey);
  }, PROCESS_TIMEOUT);
  
  const args = message.content.slice(CONFIG.COMMAND_PREFIX.length).trim().split(/ +/);
  const command = args[0].toLowerCase();
  
  try {
    // Help command
    if (command === 'help') {
      return handleHelpCommand(message);
    }
    
    // Search command (support alias 'seach')
    if (command === 'search' || command === 'seach') {
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
    
    // Refresh command (available to all users)
    if (command === 'refresh') {
      const appId = args[1];
      if (!appId || !/^\d{4,8}$/.test(appId)) {
        const errorMsg = await message.reply(`${ICONS.cross} Usage: \`!refresh <appid>\``);
        scheduleMessageDeletion(errorMsg);
        return;
      }
      return handleRefreshCommand(message, appId);
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
      
      if (command === 'collectlua') {
        return handleCollectLuaCommand(message);
      }
      
      if (command === 'backup') {
        return handleBackupCommand(message);
      }
      
      if (command === 'fetchlua') {
        return handleFetchLuaCommand(message);
      }
    }
    
    // Default: treat as AppID
    const appId = command.replace(/\D/g, ''); // Remove non-digits
    if (appId && appId.length >= 1 && /^\d+$/.test(appId)) {
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

client.on('interactionCreate', async (interaction) => {
  try {
    if (interaction.isAutocomplete()) {
      if (interaction.commandName === GEN_SLASH_COMMAND.name) {
        await handleGenAutocomplete(interaction);
      }
      return;
    }
    
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== GEN_SLASH_COMMAND.name) return;
    
    await handleGenSlashCommand(interaction);
  } catch (error) {
    log('ERROR', 'Slash command handler failed', {
      command: interaction.commandName,
      user: interaction.user?.tag,
      error: error.message
    });
    
    if (interaction.isAutocomplete()) {
      try { await interaction.respond([]); } catch (_) {}
      return;
    }
    
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: `${ICONS.cross} Failed to execute /gen. Please try again.`,
        ephemeral: true
      }).catch(() => {});
      return;
    }
    
    if (interaction.deferred && !interaction.replied) {
      await interaction.editReply({
        content: `${ICONS.cross} Failed to execute /gen. Please try again.`
      }).catch(() => {});
    }
  }
});

// ============================================
// BUTTON HANDLER (Download files)
// ============================================

async function uploadToGitHub(filePath, fileName) {
  // ============================================
  // VALIDATE GITHUB CREDENTIALS
  // ============================================
  if (!CONFIG.GITHUB_TOKEN || !CONFIG.GITHUB_REPO_OWNER || !CONFIG.GITHUB_REPO_NAME) {
    log('ERROR', 'GitHub credentials not configured!', {
      hasToken: !!CONFIG.GITHUB_TOKEN,
      hasOwner: !!CONFIG.GITHUB_REPO_OWNER,
      hasRepo: !!CONFIG.GITHUB_REPO_NAME
    });
    return null;
  }
  
  // Validate file exists
  if (!fs.existsSync(filePath)) {
    log('ERROR', 'File not found for upload', { filePath, fileName });
    return null;
  }

  const fileContent = fs.readFileSync(filePath);
  const base64Content = fileContent.toString('base64');
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const githubPath = `online-fix/${sanitizedFileName}`;
  const maxAttempts = Math.max(CONFIG.GITHUB_UPLOAD_MAX_RETRIES, 1);
  
  log('INFO', 'Starting GitHub upload', { 
    fileName, 
    sanitizedFileName,
    fileSizeBytes: fileContent.length,
    fileSizeMB: (fileContent.length / (1024 * 1024)).toFixed(2),
    repo: `${CONFIG.GITHUB_REPO_OWNER}/${CONFIG.GITHUB_REPO_NAME}`,
    maxAttempts,
    timeoutMs: CONFIG.GITHUB_UPLOAD_TIMEOUT_MS
  });
  
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      let sha = null;
      
      try {
        const checkResponse = await axios.get(
          `https://api.github.com/repos/${CONFIG.GITHUB_REPO_OWNER}/${CONFIG.GITHUB_REPO_NAME}/contents/${githubPath}`,
          {
            headers: {
              Authorization: `token ${CONFIG.GITHUB_TOKEN}`,
              'User-Agent': 'Discord-Lua-Bot/2.0',
              'Accept': 'application/vnd.github.v3+json'
            },
            timeout: CONFIG.GITHUB_UPLOAD_TIMEOUT_MS,
          }
        );
        sha = checkResponse.data.sha;
      } catch (error) {
        if (error.response?.status === 404) {
          // File not found means create new file, which is valid.
        } else if (error.response?.status === 401) {
          log('ERROR', 'GitHub authentication failed! Token may be invalid or expired', { 
            error: error.message,
            hint: 'Check your GITHUB_TOKEN in .env file'
          });
          return null;
        } else {
          throw error;
        }
      }
      
      const payload = {
        message: `[Bot] Upload ${sanitizedFileName} via Discord`,
        content: base64Content,
        branch: 'main',
      };
      
      if (sha) {
        payload.sha = sha;
      }
      
      const response = await axios.put(
        `https://api.github.com/repos/${CONFIG.GITHUB_REPO_OWNER}/${CONFIG.GITHUB_REPO_NAME}/contents/${githubPath}`,
        payload,
        {
          headers: {
            Authorization: `token ${CONFIG.GITHUB_TOKEN}`,
            'User-Agent': 'Discord-Lua-Bot/2.0',
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          timeout: CONFIG.GITHUB_UPLOAD_TIMEOUT_MS,
        }
      );
      
      if (response.status === 200 || response.status === 201) {
        const downloadUrl = `https://raw.githubusercontent.com/${CONFIG.GITHUB_REPO_OWNER}/${CONFIG.GITHUB_REPO_NAME}/main/${githubPath}`;
        log('SUCCESS', 'Uploaded to GitHub', { 
          fileName, 
          downloadUrl,
          responseStatus: response.status,
          attempt
        });
        return downloadUrl;
      }
      
      throw new Error(`Unexpected GitHub status: ${response.status}`);
    } catch (error) {
      lastError = error;
      const isLast = attempt >= maxAttempts;
      log(isLast ? 'ERROR' : 'WARN', 'GitHub upload attempt failed', {
        fileName,
        attempt,
        maxAttempts,
        error: error.message,
        code: error.code,
        status: error.response?.status
      });
      
      if (!isLast) {
        await sleep(CONFIG.GITHUB_UPLOAD_RETRY_DELAY_MS);
      }
    }
  }
  
  log('ERROR', 'Failed to upload to GitHub after all retries', { 
    fileName,
    attempts: maxAttempts,
    error: lastError?.message,
    code: lastError?.code,
    status: lastError?.response?.status,
    statusText: lastError?.response?.statusText,
    responseData: lastError?.response?.data,
    hint: 'Check GitHub token, repo exists, rate limits, and payload size'
  });
  
  return null;
}

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;
  
  const [action, rawType, appId, fileIdx] = interaction.customId.split('_');
  let type = rawType;
  if (action !== 'dl') return;
  
  try {
    const quotaBeforeDownload = getDailyDownloadQuota(interaction.user.id);
    if (quotaBeforeDownload.enabled && quotaBeforeDownload.remaining <= 0) {
      const resetUnix = getNextDailyResetUnix();
      return interaction.reply({
        content:
          `Daily download limit reached (${quotaBeforeDownload.limit}/${quotaBeforeDownload.limit}).\n` +
          `Try again <t:${resetUnix}:R> (reset at 00:00 ${CONFIG.DAILY_LIMIT_TIMEZONE}).`,
        ephemeral: true
      });
    }

    // Handle Direct Crack Link
    if (type === 'crack') {
      const crackLink = CRACK_LINKS[appId];
      if (!crackLink) {
        return interaction.reply({
          content: '❌ **Link does not exist or has been deleted!**',
          ephemeral: true
        });
      }

      const gameInfo = await getFullGameInfo(appId);
      let requirements = 'Extract and overwrite game folder.';
      
      if (gameInfo) {
        if (gameInfo.publisher?.isUbisoft || gameInfo.name.toLowerCase().includes('assassin') || gameInfo.name.toLowerCase().includes('ubisoft')) {
          requirements = '🛠️ **Requirement:** Install **Ubisoft Connect** and login with emulator account (if needed).';
        } else if (gameInfo.isEAGame || gameInfo.name.toLowerCase().includes('fifa') || gameInfo.name.toLowerCase().includes('ea sports')) {
          requirements = '🛠️ **Requirement:** Install **EA App** to run the game.';
        } else if (gameInfo.publisher?.isRockstar || gameInfo.publisher?.name?.includes('Rockstar')) {
          requirements = '🛠️ **Requirement:** Install **Rockstar Games Launcher**.';
        }
      }

      // Support multiple crack links - show all in one beautiful embed
      const crackLinks = Array.isArray(crackLink) ? crackLink : [crackLink];
      
      // GIF for crack button
      const crackGif = "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExbmllMmp2eWV5ODFoM2N4OXhqd3B6OTVucXA5NW82ZjZpOXJmMWY5ZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/AHeTfHgVFPHgs/giphy.gif";
      
      // Get file sizes for all links
      await interaction.deferReply({ ephemeral: true });
      
      const linksWithSizes = await Promise.all(
        crackLinks.map(async (link, idx) => {
          const fileSize = await getFileSizeFromUrl(link);
          const sizeText = fileSize ? ` \`${formatFileSize(fileSize)}\`` : '';
          return {
            number: idx + 1,
            url: link,
            size: fileSize,
            sizeText: sizeText
          };
        })
      );
      
      // Beautiful formatted links with file sizes
      const linksField = linksWithSizes.map(item => 
        `**[🔗 Download Link ${item.number}](${item.url})**${item.sizeText}`
      ).join('\n');
      
      const totalSize = linksWithSizes.reduce((sum, item) => sum + (item.size || 0), 0);
      const totalSizeText = totalSize > 0 ? `\n\n**📊 Total Size:** \`${formatFileSize(totalSize)}\`` : '';

      // Custom instructions for specific games
      let instructions = '```\n1. Download the crack file(s)\n2. Extract the archive\n3. Copy files to game directory\n4. Overwrite existing files\n5. Run the game\n```';
      
      // FC 26 Showcase Custom Guide
      if (appId === '3629260') {
        requirements = '🛠️ **Requirement:** EA App installed, clean game files.';
        instructions = 
          '**1. Copy files**\n' +
          'Copy all extracted files into the game’s folder.\n' +
          'When prompted, click **Replace the file in the destination** (this may appear multiple times).\n\n' +
          
          '**2. Replace the executable**\n' +
          'Delete `FC26_Showcase.exe`\n' +
          'Rename `FC26_Showcase fixed.exe` to `FC26_Showcase.exe`\n\n' +
          
          '**3. Generate the Denuvo token**\n' +
          'Open `EA.Denuvo.Token.Dumper.exe`\n' +
          'Click **Start**\n' +
          '⚠️ **Important:** Make sure "Add DenuvoToken to anadius.cfg even if it exists" is **unchecked**\n\n' +
          
          '**4. Apply the Denuvo token**\n' +
          'Copy the generated Denuvo token\n' +
          'Open `anadius.cfg` in the game folder\n' +
          'Find `DenuvoToken` (use CTRL + F)\n' +
          'Replace `PASTE_A_VALID_DENUVO_TOKEN_HERE` with your copied token';
      }

      await interaction.editReply({
        embeds: [{
          color: 0xFF0000,
          title: '🔥 CRACK DOWNLOAD',
          description: `**Game:** ${gameInfo?.name || appId}\n\n${crackLinks.length > 1 ? `**${crackLinks.length} download links available:**` : '**Download link:**'}${totalSizeText}`,
          thumbnail: { url: crackGif },
          fields: [
            {
              name: '⬇️ DOWNLOAD LINKS',
              value: linksField || 'No links available',
              inline: false
            },
            {
              name: '🛠️ Installation Requirements',
              value: requirements,
              inline: false
            },
            {
              name: appId === '3629260' ? '📋 Installation Guide' : '📋 Instructions',
              value: instructions,
              inline: false
            },
            {
              name: '⚠️ Security Notice',
              value: '***Links are provided directly. Use at your own risk. Always scan files with antivirus.***',
              inline: false
            }
          ],
          footer: { 
            text: `App ID: ${appId} • Auto-deletes in 5 minutes`,
            iconURL: 'https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/clans/3703047/e5b0f06e3b8c705c1e58f5e0a7e8e2e8e5b0f06e.png'
          },
          timestamp: new Date().toISOString()
        }]
      });

      const crackQuota = registerSuccessfulDownload({
        appId,
        gameName: gameInfo?.name,
        fileType: 'crack-link',
        fileName: `crack-link-${appId}`,
        fileSize: totalSizeText || 'N/A',
        user: interaction.user
      });
      await sendDailyQuotaRemaining(interaction, crackQuota);
      return;
    }

    // Handle Direct Online-Fix Link
    if (type === 'online') {
      const onlineLink = ONLINE_FIX_LINKS[appId];
      if (!onlineLink) {
        return interaction.reply({
          content: '❌ **Link does not exist or has been deleted!**',
          ephemeral: true
        });
      }

      const gameInfo = await getFullGameInfo(appId);
      
      // GIF for online-fix button
      const onlineFixGif = "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExbml3azA3Ym01NmozNG1odjF0d3RqbWx6cW52anNlbzZucXlwaTlyYiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/HhOg2ijdiymuoHDb1k/giphy.gif";
      
      // Get file size from URL
      await interaction.deferReply({ ephemeral: true });
      
      const fileSize = await getFileSizeFromUrl(onlineLink);
      const sizeText = fileSize ? ` \`${formatFileSize(fileSize)}\`` : '';
      
      await interaction.editReply({
        embeds: [{
          color: 0x00FF00,
          title: '🌐 ONLINE-FIX DOWNLOAD',
          description: `**Game:** ${gameInfo?.name || appId}\n\n**Download link:**${sizeText ? `\n**📊 File Size:**${sizeText}` : ''}`,
          thumbnail: { url: onlineFixGif },
          fields: [
            {
              name: '⬇️ DOWNLOAD LINK',
              value: `**[🔗 Click Here to Download](${onlineLink})**`,
              inline: false
            },
            {
              name: '📋 Installation Instructions',
              value: '```\n1. Download the Online-Fix file\n2. Extract the archive\n3. Copy all files to game directory\n4. Overwrite existing files\n5. Launch Steam (must be running)\n6. Run the game\n```',
              inline: false
            },
            {
              name: '⚙️ Important Notes',
              value: '• **Steam must be running** to play\n• You can play with friends online\n• No Steam account required\n• Works with cracked games',
              inline: false
            },
            {
              name: '⚠️ Security Notice',
              value: '***Link is provided directly. Use at your own risk. Always scan files with antivirus.***',
              inline: false
            }
          ],
          footer: { 
            text: `App ID: ${appId} • Auto-deletes in 5 minutes`,
            iconURL: 'https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/clans/3703047/e5b0f06e3b8c705c1e58f5e0a7e8e2e8e5b0f06e.png'
          },
          timestamp: new Date().toISOString()
        }]
      });

      const onlineQuota = registerSuccessfulDownload({
        appId,
        gameName: gameInfo?.name,
        fileType: 'online-link',
        fileName: `online-link-${appId}`,
        fileSize: sizeText || 'N/A',
        user: interaction.user
      });
      await sendDailyQuotaRemaining(interaction, onlineQuota);
      return;
    }

    // Handle Legacy Online-Fix File (if any)
    if (type === 'onlinefile') {
      // Legacy handling...
      // Re-map type to 'online' for finding file
      type = 'online';
    } else {
       // Proceed with existing logic for other types
    }

    await interaction.deferReply({ ephemeral: true });
    
    // Get game info to find files by name
    const gameInfo = await getFullGameInfo(appId);
    const files = findFiles(appId, gameInfo?.name);
    let fileToSend = null;
    
    const idx = parseInt(fileIdx || '0');
    
    // Determine which file type to send
    if (type === 'lua' && files.lua[idx]) {
      fileToSend = files.lua[idx];
    } else if (type === 'fix' && files.fix[idx]) {
      fileToSend = files.fix[idx];
    } else if (type === 'online' && files.onlineFix[idx]) { // This now only triggers for legacy 'onlinefile' remapped to 'online'
      fileToSend = files.onlineFix[idx];
    }
    
    if (!fileToSend || !fs.existsSync(fileToSend.path)) {
      if (type === 'lua') {
        const notFoundEmbed = new EmbedBuilder()
          .setColor(0xED4245)
          .setTitle(`${getGameTitleStatusIcon(false)} Manifest Generation Failed: App ${appId}`)
          .setDescription('Manifest files for this game are not available in our database.')
          .addFields(
            {
              name: 'Links',
              value: `[Steam Store](https://store.steampowered.com/app/${appId})\n[SteamDB](https://steamdb.info/app/${appId})`,
              inline: false
            },
            {
              name: 'App ID',
              value: `\`${appId}\``,
              inline: false
            }
          );
        
        await scheduleInteractionDeletion(interaction, {
          content: '❌ Manifest files for this game were not found, suggesting it\'s not in our database. Please request to add the game.',
          embeds: [notFoundEmbed],
          components: []
        });
        return;
      }
      
      await scheduleInteractionDeletion(interaction, {
        content: `❌ **File not found!**\n\n` +
                 `⏱️ *This message will auto-delete in 5 minutes*`
      });
      return;
    }
    
    const selectedManifestMeta = type === 'lua' ? getManifestFileMeta(fileToSend.name) : null;
    const summaryLines = type === 'lua'
      ? buildManifestSummaryLines({
          gameInfo: { name: gameInfo?.name || `App ${appId}` },
          appId,
          files: { lua: [fileToSend] },
          canEmbed: true
        })
      : [];
    
    let archiveInspection = null;
    if (type === 'lua' && selectedManifestMeta?.kind === 'archive') {
      archiveInspection = await inspectArchiveManifestCount(fileToSend.path);
      if (archiveInspection) {
        if (archiveInspection.manifestCount > 0) {
          summaryLines.push(`📂 Archive contains **${archiveInspection.manifestCount}** \`.manifest\` file(s).`);
        } else {
          summaryLines.push('⚠️ Archive scan found **0** `.manifest` file(s).');
        }
      }
    }
    
    const summaryContent = summaryLines.join('\n');
    const sizeMB = fileToSend.size / (1024 * 1024);
    const likelyGitHubContentsLimitIssue =
      type !== 'online' && sizeMB > CONFIG.GITHUB_CONTENTS_SAFE_LIMIT_MB;
    
    // For Online-Fix files OR large files (>25MB), upload to GitHub
    if (type === 'online' || sizeMB > CONFIG.MAX_FILE_SIZE_MB) {
      await scheduleInteractionDeletion(interaction, {
        content: `⏳ **Processing** \`${fileToSend.name}\`...\n\n` +
                 `✨ Please wait...`
      });
      
      let downloadUrl = null;
      let deliveryMethod = 'github';
      
      downloadUrl = await uploadToGitHub(fileToSend.path, fileToSend.name);
      
      if (!downloadUrl && !CONFIG.DISABLE_DIRECT_DOWNLOAD_FALLBACK) {
        downloadUrl = createTemporaryDownloadLink(fileToSend.path, fileToSend.name);
        if (downloadUrl) {
          deliveryMethod = 'direct';
        }
      }
      
      if (!downloadUrl) {
        const fallbackHint = CONFIG.DISABLE_DIRECT_DOWNLOAD_FALLBACK
          ? '• Direct fallback is disabled by configuration\n'
          : '• Set PUBLIC_BASE_URL for direct fallback links\n';
        
        await scheduleInteractionDeletion(interaction, {
          content: `❌ **Failed to process file for download!**\n\n` +
                   `🔧 **Troubleshooting:**\n` +
                   `• Check if GitHub token is configured\n` +
                   `• Check if repository exists and bot has access\n` +
                   `• Upload retries: ${CONFIG.GITHUB_UPLOAD_MAX_RETRIES}, timeout each: ${Math.round(CONFIG.GITHUB_UPLOAD_TIMEOUT_MS / 1000)}s\n` +
                   (likelyGitHubContentsLimitIssue
                     ? `• File may be too large for GitHub Contents API (>${CONFIG.GITHUB_CONTENTS_SAFE_LIMIT_MB} MB after Base64 overhead)\n`
                     : '') +
                   fallbackHint +
                   `• File size: ${fileToSend.sizeFormatted}\n\n` +
                   `⏱️ *This message will auto-delete in 5 minutes*`
        });
        return;
      }
      
      // Beautiful embed for large files uploaded to GitHub
      const fileTypeName = type === 'online'
        ? 'Online-Fix'
        : type === 'lua'
        ? (selectedManifestMeta?.label || 'Manifest File')
        : 'File';
      const fileTypeGif = type === 'online' 
        ? "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaDB1anh5dGRqOThzcWtuMzltcGdrdGtkbWtmNDN4OHp2d3NieW8zbCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/YO7P8VC7nlQlO/giphy.gif"
        : type === 'lua'
        ? "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaDB1anh5dGRqOThzcWtuMzltcGdrdGtkbWtmNDN4OHp2d3NieW8zbCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/EnrH0xdlmT5uBZ9BCe/giphy.gif"
        : null;
      
      await scheduleInteractionDeletion(interaction, {
        content: type === 'lua' ? summaryContent : null,
        embeds: [{
          color: 0x00ff00,
          title: `✅ ${fileTypeName.toUpperCase()} DOWNLOAD READY!`,
          description: `**Game:** ${gameInfo?.name || appId}\n\n` +
            (deliveryMethod === 'github'
              ? '**✅ File uploaded to GitHub successfully!**'
              : '**✅ Direct download link generated from server!**'),
          thumbnail: fileTypeGif ? { url: fileTypeGif } : undefined,
          fields: [
            { 
              name: '📁 File Information',
              value: `**Name:** \`${fileToSend.name}\`\n**Size:** \`${fileToSend.sizeFormatted}\``,
              inline: false
            },
            { 
              name: '🔗 Download Link',
              value: `**[⬇️ CLICK HERE TO DOWNLOAD](${downloadUrl})**`,
              inline: false
            },
            {
              name: '💡 Download Tips',
              value: deliveryMethod === 'github'
                ? '• Link is stable on GitHub\n• No Discord file size limit\n• Good for repeated downloads'
                : `• Link expires in ${CONFIG.DIRECT_DOWNLOAD_TTL_MINUTES} minutes\n• Works for very large files\n• Re-generate if expired`,
              inline: false
            }
          ],
          footer: { 
            text: `App ID: ${appId} • Auto-deletes in 5 minutes • ${deliveryMethod === 'github' ? 'GitHub Link' : 'Direct Link'}`,
            iconURL: 'https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/clans/3703047/e5b0f06e3b8c705c1e58f5e0a7e8e2e8e5b0f06e.png'
          },
          timestamp: new Date().toISOString()
        }]
      });

      const largeFileQuota = registerSuccessfulDownload({
        appId,
        gameName: gameInfo?.name,
        fileType: type,
        fileName: fileToSend.name,
        fileSize: fileToSend.sizeFormatted,
        user: interaction.user
      });
      await sendDailyQuotaRemaining(interaction, largeFileQuota);
      return;
    }
    
    // GIF for manifest button (lua/package)
    const manifestGif = type === 'lua' 
      ? "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaDB1anh5dGRqOThzcWtuMzltcGdrdGtkbWtmNDN4OHp2d3NieW8zbCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/EnrH0xdlmT5uBZ9BCe/giphy.gif"
      : null;
    
    // Send small files directly via Discord
    const replyContent = {
      files: [{ 
        attachment: fileToSend.path, 
        name: fileToSend.name 
      }]
    };
    
    // Beautiful embed for manifest files
    if (manifestGif && type === 'lua') {
      if (summaryContent) {
        replyContent.content = summaryContent;
      }
      
      replyContent.embeds = [{
        color: 0x2ECC71,
        title: `${(selectedManifestMeta?.label || 'Manifest File').toUpperCase()} READY`,
        description: `**Game:** ${gameInfo?.name || appId}\n\n**File ready for download.**`,
        thumbnail: { url: manifestGif },
        fields: [
          { 
            name: '📁 File Information',
            value: `**Name:** \`${fileToSend.name}\`\n**Size:** \`${fileToSend.sizeFormatted}\``,
            inline: false
          },
          {
            name: '📋 Usage Instructions',
            value: selectedManifestMeta?.instruction || '```\n1. Download the file\n2. Place it in your game directory\n3. Launch the game\n```',
            inline: false
          },
          {
            name: '💡 Tips',
            value: selectedManifestMeta?.kind === 'archive'
              ? '- Extract archive fully before use\n- Keep original package as backup\n- Replace files in the correct game folder'
              : '- Lua files are small and load quickly\n- Make sure your Lua loader is compatible\n- Backup original files if needed',
            inline: false
          }
        ],
        footer: { 
          text: `App ID: ${appId} • Auto-deletes in 5 minutes`,
          iconURL: 'https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/clans/3703047/e5b0f06e3b8c705c1e58f5e0a7e8e2e8e5b0f06e.png'
        },
        timestamp: new Date().toISOString()
      }];
    } else {
      // Fallback for other file types
      replyContent.content = `✅ **Sending** \`${fileToSend.name}\` (\`${fileToSend.sizeFormatted}\`)\n\n🚀 Download started!`;
    }
    
    await scheduleInteractionDeletion(interaction, replyContent);
    
    const directFileQuota = registerSuccessfulDownload({
      appId,
      gameName: gameInfo?.name,
      fileType: type,
      fileName: fileToSend.name,
      fileSize: fileToSend.sizeFormatted,
      user: interaction.user
    });
    await sendDailyQuotaRemaining(interaction, directFileQuota);
    
  } catch (error) {
    console.error('❌ Button Handler Error:', error);
    log('ERROR', 'Error sending file', { 
      appId, 
      type,
      error: error.message,
      stack: error.stack
    });
    
    try {
      if (!interaction.replied) {
        await scheduleInteractionDeletion(interaction, {
          content: `❌ **Error:** \`${error.message}\`\n\n` +
                   `⏱️ *This message will auto-delete in 5 minutes*`
        });
      }
    } catch (e) {
      console.error('❌ Failed to send error message:', e);
    }
  }
});

// ============================================
// BOT READY EVENT
// ============================================

client.once('ready', async () => {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 DISCORD LUA BOT - ENHANCED VERSION 2.0');
  console.log('   Multi-source data + Auto-delete + Online-Fix Integration');
  console.log('='.repeat(70));
  console.log(`✅ Logged in as: ${client.user.tag}`);
  console.log(`🎮 Bot ID: ${client.user.id}`);
  console.log(`📊 Legacy command prefix: ${enableMessageContentIntent ? CONFIG.COMMAND_PREFIX : `${CONFIG.COMMAND_PREFIX} (disabled in slash-only mode)`}`);
  console.log(`🧭 Slash command: /${GEN_SLASH_COMMAND.name} appid:<Steam App ID or game name>`);
  console.log(`📝 Message Content Intent: ${enableMessageContentIntent ? 'ENABLED' : 'DISABLED (slash-only mode)'}`);
  const allGames = scanAllGames();
  console.log(`🎯 Total available games: ${global.gameStats?.uniqueGames || allGames.length} (${global.gameStats?.totalFiles || 'N/A'} files)`);
  console.log(`💾 Cached game info: ${Object.keys(gameInfoCache).length} games`);
  console.log(`🔄 Auto-delete: ${CONFIG.ENABLE_AUTO_DELETE ? 'ENABLED (5 min)' : 'DISABLED'}`);
  console.log(`🧱 Daily download limit: ${CONFIG.ENABLE_DAILY_DOWNLOAD_LIMIT ? `${CONFIG.MAX_DAILY_DOWNLOADS_PER_USER}/user/day (${CONFIG.DAILY_LIMIT_TIMEZONE} reset)` : 'DISABLED'}`);
  console.log(`🌍 Public base URL: ${CONFIG.PUBLIC_BASE_URL || 'NOT SET (direct large-file links disabled)'}`);
  console.log(`🔗 Direct download TTL: ${CONFIG.DIRECT_DOWNLOAD_TTL_MINUTES} minutes`);
  console.log(`📁 Folders:`);
  console.log(`   - Lua files: ${CONFIG.LUA_FILES_PATH}`);
  console.log(`   - Fix files: ${CONFIG.FIX_FILES_PATH}`);
  console.log(`   - Online-Fix: ${CONFIG.ONLINE_FIX_PATH}`);
  console.log('='.repeat(70) + '\n');

  try {
    await registerSlashCommands();
  } catch (error) {
    log('WARN', 'Slash command registration failed on ready', { error: error.message });
  }
  
  // Set bot presence
  client.user.setPresence({
    activities: [{ 
      name: `/gen appid:<id-or-name>`,
      type: ActivityType.Watching
    }],
    status: 'online',
  });
  
  log('INFO', 'Bot started successfully', {
    uniqueGames: global.gameStats?.uniqueGames || 0,
    totalFiles: global.gameStats?.totalFiles || 0,
    cachedGames: Object.keys(gameInfoCache).length,
    autoDelete: CONFIG.ENABLE_AUTO_DELETE
  });
});

client.on('guildCreate', async (guild) => {
  if (CONFIG.REGISTER_GUILD_SLASH_COMMAND) {
    await registerSlashCommandForGuild(guild);
  }
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

// Start Discord login with retries, but DO NOT exit process on failure.
async function attemptLogin(retries = 0) {
  try {
    await client.login(CONFIG.BOT_TOKEN);
    console.log('\n✅ Discord login successful');
  } catch (error) {
    console.error('\n❌ FAILED TO LOGIN TO DISCORD! (will retry)\n');
    console.error('Error:', error.message);
    if (retries === 0) {
      console.error('\n💡 Troubleshooting tips:');
      console.error('   1. Check if BOT_TOKEN exists in .env file');
      console.error('   2. Verify the token is correct');
      console.error('   3. Make sure bot has proper permissions');
      console.error('   4. Check if bot is banned from the server\n');
    }
    const delay = Math.min(60000 * Math.pow(2, Math.min(retries, 4)), 5 * 60 * 1000); // backoff up to 5min
    console.log(`⏳ Retrying Discord login in ${Math.round(delay/1000)}s (attempt ${retries + 1})`);
    setTimeout(() => attemptLogin(retries + 1), delay);
  }
}

attemptLogin();

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

app.get('/download/:token', (req, res) => {
  const { token } = req.params;
  const entry = temporaryDownloads.get(token);
  
  if (!entry) {
    return res.status(404).json({ error: 'Download link not found or expired.' });
  }
  
  if (entry.expiresAt <= Date.now()) {
    temporaryDownloads.delete(token);
    return res.status(410).json({ error: 'Download link expired.' });
  }
  
  if (!fs.existsSync(entry.filePath)) {
    temporaryDownloads.delete(token);
    return res.status(410).json({ error: 'File no longer available on server.' });
  }
  
  res.setHeader('Cache-Control', 'private, max-age=60');
  res.setHeader('X-Link-Expires-At', new Date(entry.expiresAt).toISOString());
  res.download(entry.filePath, entry.fileName, (error) => {
    if (error && !res.headersSent) {
      return res.status(500).json({ error: 'Failed to stream file.' });
    }
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

const START_PORT = process.env.PORT || 3000;

function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`✅ Health check server running on port ${port}`);
    console.log(`🌐 Access at: http://localhost:${port}`);
    console.log(`📊 Health endpoint: http://localhost:${port}/health\n`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Required port ${port} already in use. On Render we must bind to PORT; exiting so the service can restart.`);
    } else {
      console.error('❌ Server error:', error);
    }
    // Exit to let the platform restart the process on the correct PORT
    process.exit(1);
  });
}

// Explicit HEAD handler so uptime monitors receive a fast 200 even when using HEAD
app.head('/health', (req, res) => {
  res.status(200).end();
});

// Guard against crashes bringing the process down silently
process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

startServer(START_PORT);

