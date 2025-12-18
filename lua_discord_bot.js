// ============================================
// DISCORD LUA BOT - PHIÊN BẢN ĐẦY ĐỦ + GIAO DIỆN ĐẸP
// Hỗ trợ: Search theo tên, Database, Logging, Admin commands, Multiple files
// ============================================
require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const app = express();

// ============================================
// CẤU HÌNH - ĐIỀN THÔNG TIN CỦA BẠN
// ============================================
const CONFIG = {
  // Discord & Steam API
  BOT_TOKEN: process.env.BOT_TOKEN,
STEAM_API_KEY: process.env.STEAM_API_KEY,
  // Commands
  COMMAND_PREFIX: '!',
  
  // Paths (tự động tạo nếu chưa có)
  LUA_FILES_PATH: './lua_files',
  FIX_FILES_PATH: './fix_files',
  ONLINE_FIX_PATH: './online_fix',
  LOGS_PATH: './logs',
  DATABASE_PATH: './database.json',
  
  // Admin settings
  ADMIN_USER_IDS: ['898595655562432584'], // Click phải tên → Copy ID
  LOG_CHANNEL_ID: null, // ID kênh để log (tùy chọn)
  
  // File settings
  MAX_FILE_SIZE_MB: 25, // Discord limit
  ALLOWED_EXTENSIONS: ['.lua', '.rar', '.zip', '.7z'],
  
  // Cache settings
  CACHE_DURATION: 3600000, // 1 giờ (ms)
};

// ============================================
// KHỞI TẠO
// ============================================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

// Database đơn giản (JSON)
let database = {
  games: {}, // {appId: {name, downloads, lastAccessed}}
  stats: { totalDownloads: 0, totalSearches: 0 },
  cache: {}, // Cache Steam API responses
};

// Game cache trong memory
const gameCache = new Map();

// ============================================
// HÀM TIỆN ÍCH
// ============================================

// Tạo folders nếu chưa có
function initializeFolders() {
  const folders = [
    CONFIG.LUA_FILES_PATH,
    CONFIG.FIX_FILES_PATH,
    CONFIG.ONLINE_FIX_PATH,
    CONFIG.LOGS_PATH,
  ];
  
  folders.forEach(folder => {
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
      console.log(`✅ Đã tạo folder: ${folder}`);
    }
  });
}

// Load database
function loadDatabase() {
  if (fs.existsSync(CONFIG.DATABASE_PATH)) {
    try {
      database = JSON.parse(fs.readFileSync(CONFIG.DATABASE_PATH, 'utf8'));
      console.log('✅ Đã load database');
    } catch (error) {
      console.error('❌ Lỗi load database:', error);
    }
  }
}

// Save database
function saveDatabase() {
  try {
    fs.writeFileSync(CONFIG.DATABASE_PATH, JSON.stringify(database, null, 2));
  } catch (error) {
    console.error('❌ Lỗi save database:', error);
  }
}

// Logging
function log(type, message, data = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    type,
    message,
    ...data,
  };
  
  // Log to console
  console.log(`[${timestamp}] [${type}] ${message}`);
  
  // Log to file
  try {
    const logFile = path.join(CONFIG.LOGS_PATH, `${new Date().toISOString().split('T')[0]}.log`);
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  } catch (error) {
    console.error('Failed to write log:', error.message);
  }
  
  // Log to Discord channel (nếu có)
  if (CONFIG.LOG_CHANNEL_ID && client.channels) {
    const channel = client.channels.cache.get(CONFIG.LOG_CHANNEL_ID);
    if (channel) {
      const embed = new EmbedBuilder()
        .setColor(type === 'ERROR' ? '#ff0000' : '#00ff00')
        .setTitle(`📋 ${type}`)
        .setDescription(message)
        .setTimestamp();
      
      channel.send({ embeds: [embed] }).catch(() => {});
    }
  }
}

// Kiểm tra admin
function isAdmin(userId) {
  return CONFIG.ADMIN_USER_IDS.includes(userId);
}

// Format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// ============================================
// STEAM API
// ============================================

// Lấy thông tin game từ Steam
async function getGameInfo(appId) {
  try {
    // Check cache
    const cacheKey = `game_${appId}`;
    if (gameCache.has(cacheKey)) {
      const cached = gameCache.get(cacheKey);
      if (Date.now() - cached.timestamp < CONFIG.CACHE_DURATION) {
        return cached.data;
      }
    }
    
    // Fetch from Steam
    const storeUrl = `https://store.steampowered.com/api/appdetails?appids=${appId}&l=english`;
    const response = await axios.get(storeUrl, { timeout: 10000 });
    
    if (!response.data[appId]?.success) {
      return null;
    }
    
    const gameData = response.data[appId].data;
    
    const result = {
      name: gameData.name,
      appId: appId,
      headerImage: gameData.header_image,
      shortDescription: gameData.short_description?.substring(0, 200),
      dlcCount: gameData.dlc ? gameData.dlc.length : 0,
      languages: gameData.supported_languages ? 
        gameData.supported_languages.split(',').length : 2,
      developers: gameData.developers?.join(', ') || 'Unknown',
      publishers: gameData.publishers?.join(', ') || 'Unknown',
      releaseDate: gameData.release_date?.date || 'Unknown',
      price: gameData.is_free ? 'Free' : (gameData.price_overview?.final_formatted || 'N/A'),
    };
    
    // Cache result
    gameCache.set(cacheKey, { data: result, timestamp: Date.now() });
    
    // Update database
    if (!database.games[appId]) {
      database.games[appId] = {
        name: result.name,
        downloads: 0,
        lastAccessed: Date.now(),
      };
      saveDatabase();
    }
    
    return result;
    
  } catch (error) {
    log('ERROR', `Failed to fetch game info for ${appId}`, { error: error.message });
    return null;
  }
}

// Search game theo tên
async function searchGameByName(query) {
  try {
    // Dùng Steam API để search
    const searchUrl = `https://steamcommunity.com/actions/SearchApps/${encodeURIComponent(query)}`;
    const response = await axios.get(searchUrl, { timeout: 10000 });
    
    if (response.data && response.data.length > 0) {
      // Trả về top 5 kết quả
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

// ============================================
// FILE MANAGEMENT
// ============================================

// Tìm files cho game
function findFiles(appId) {
  const result = {
    lua: [],
    fix: [],
    onlineFix: [],
  };
  
  // Pattern để tìm files
  const patterns = {
    lua: [
      path.join(CONFIG.LUA_FILES_PATH, `${appId}.lua`),
      path.join(CONFIG.LUA_FILES_PATH, appId, 'game.lua'),
      path.join(CONFIG.LUA_FILES_PATH, appId, `${appId}.lua`),
    ],
    fix: [
      path.join(CONFIG.FIX_FILES_PATH, `${appId}.rar`),
      path.join(CONFIG.FIX_FILES_PATH, `${appId}.zip`),
      path.join(CONFIG.FIX_FILES_PATH, `${appId}.7z`),
      path.join(CONFIG.FIX_FILES_PATH, appId, 'fix.rar'),
      path.join(CONFIG.FIX_FILES_PATH, appId, 'fix.zip'),
    ],
    onlineFix: [
      path.join(CONFIG.ONLINE_FIX_PATH, `${appId}.rar`),
      path.join(CONFIG.ONLINE_FIX_PATH, `${appId}.zip`),
      path.join(CONFIG.ONLINE_FIX_PATH, appId, 'online.rar'),
      path.join(CONFIG.ONLINE_FIX_PATH, appId, 'online.zip'),
    ],
  };
  
  // Tìm files
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

// Scan tất cả games
function scanAllGames() {
  const games = new Set();
  
  function scanFolder(folder) {
    if (!fs.existsSync(folder)) return;
    
    const items = fs.readdirSync(folder);
    items.forEach(item => {
      const fullPath = path.join(folder, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Nếu là folder và tên là số (AppID)
        if (/^\d+$/.test(item)) {
          games.add(item);
        }
      } else {
        // Nếu là file, extract AppID từ tên
        const match = item.match(/(\d{6,8})/);
        if (match) {
          games.add(match[1]);
        }
      }
    });
  }
  
  scanFolder(CONFIG.LUA_FILES_PATH);
  scanFolder(CONFIG.FIX_FILES_PATH);
  scanFolder(CONFIG.ONLINE_FIX_PATH);
  
  return Array.from(games).sort();
}

// ============================================
// COMMAND HANDLERS - GIAO DIỆN ĐẸP
// ============================================

// Command: Game (lấy file theo AppID)
async function handleGameCommand(message, appId) {
  try {
    // Gửi "đang tìm..."
    const loadingMsg = await message.reply('🔍 Đang tìm game...');
    
    // Tìm files
    const files = findFiles(appId);
    const hasFiles = files.lua.length > 0 || files.fix.length > 0 || files.onlineFix.length > 0;
    
    if (!hasFiles) {
      return loadingMsg.edit(`❌ Không tìm thấy files cho AppID: \`${appId}\``);
    }
    
    // Lấy thông tin game từ Steam
    const gameInfo = await getGameInfo(appId);
    
    // 🎨 TẠO EMBED ĐẸP
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`${gameInfo ? gameInfo.name : `Game ${appId}`} (${appId})`)
      .setURL(`https://store.steampowered.com/app/${appId}`);
    
    // Link Steam
    embed.setDescription(`🔗 [View on Steam](https://store.steampowered.com/app/${appId})`);
    
    // Thêm ảnh header
    if (gameInfo?.headerImage) {
      embed.setImage(gameInfo.headerImage);
    }
    
    // Thông tin game
    if (gameInfo) {
      embed.addFields(
        { name: '🎉 DLCs Available', value: `${gameInfo.dlcCount}`, inline: true },
        { name: '🌍 Languages Supported', value: `${gameInfo.languages}`, inline: true },
        { name: '\u200b', value: '\u200b', inline: true }
      );
    }
    
    // ✨ CLICK BELOW TO DOWNLOAD
    embed.addFields({
      name: '✨ CLICK BELOW TO DOWNLOAD ✨',
      value: '\u200b'
    });
    
    // 🔘 TẠO BUTTONS
    const rows = [];
    let currentRow = new ActionRowBuilder();
    let buttonCount = 0;
    
    // Lua buttons - BUTTON ĐẸP
    if (files.lua.length > 0) {
      if (files.lua.length === 1) {
        // Chỉ 1 file lua - button to
        const luaRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`dl_lua_${appId}_0`)
            .setLabel('⬇️ DOWNLOAD LUA FILE ⬇️')
            .setStyle(ButtonStyle.Primary)
        );
        rows.push(luaRow);
      } else {
        // Nhiều files lua - buttons nhỏ
        files.lua.forEach((file, idx) => {
          if (buttonCount >= 5) {
            rows.push(currentRow);
            currentRow = new ActionRowBuilder();
            buttonCount = 0;
          }
          
          currentRow.addComponents(
            new ButtonBuilder()
              .setCustomId(`dl_lua_${appId}_${idx}`)
              .setLabel(`📜 Lua ${idx + 1}`)
              .setStyle(ButtonStyle.Primary)
          );
          buttonCount++;
        });
        
        if (buttonCount > 0) {
          rows.push(currentRow);
          currentRow = new ActionRowBuilder();
          buttonCount = 0;
        }
      }
    }
    
    // Divider
    if (files.fix.length > 0 || files.onlineFix.length > 0) {
      embed.addFields({
        name: '\u200b',
        value: '───────────────────────'
      });
    }
    
    // Fix và Online Fix
    const hasFixOrOnline = files.fix.length > 0 || files.onlineFix.length > 0;
    
    if (hasFixOrOnline) {
      // Thông báo có fix
      const fixStatus = [];
      if (files.fix.length > 0) fixStatus.push('🔧 Fix Available!');
      if (files.onlineFix.length > 0) fixStatus.push('🌐 Online Fix Available!');
      
      embed.addFields({
        name: fixStatus.join(' & '),
        value: '\u200b'
      });
      
      // Fix buttons
      if (files.fix.length > 0) {
        if (files.fix.length === 1) {
          currentRow.addComponents(
            new ButtonBuilder()
              .setCustomId(`dl_fix_${appId}_0`)
              .setLabel('⬇️ DOWNLOAD FIX FILE ⬇️')
              .setStyle(ButtonStyle.Success)
          );
          buttonCount++;
        } else {
          files.fix.forEach((file, idx) => {
            if (buttonCount >= 5) {
              rows.push(currentRow);
              currentRow = new ActionRowBuilder();
              buttonCount = 0;
            }
            
            currentRow.addComponents(
              new ButtonBuilder()
                .setCustomId(`dl_fix_${appId}_${idx}`)
                .setLabel(`🔧 Fix ${idx + 1}`)
                .setStyle(ButtonStyle.Success)
            );
            buttonCount++;
          });
        }
      }
      
      // Online Fix buttons
      if (files.onlineFix.length > 0) {
        if (files.onlineFix.length === 1) {
          currentRow.addComponents(
            new ButtonBuilder()
              .setCustomId(`dl_online_${appId}_0`)
              .setLabel('⬇️ DOWNLOAD ONLINE FIX FILE ⬇️')
              .setStyle(ButtonStyle.Secondary)
          );
          buttonCount++;
        } else {
          files.onlineFix.forEach((file, idx) => {
            if (buttonCount >= 5) {
              rows.push(currentRow);
              currentRow = new ActionRowBuilder();
              buttonCount = 0;
            }
            
            currentRow.addComponents(
              new ButtonBuilder()
                .setCustomId(`dl_online_${appId}_${idx}`)
                .setLabel(`🌐 Online ${idx + 1}`)
                .setStyle(ButtonStyle.Secondary)
            );
            buttonCount++;
          });
        }
      }
      
      if (buttonCount > 0) {
        rows.push(currentRow);
      }
      
      // Installation Instructions
      embed.addFields({
        name: '📂 Installation Instructions:',
        value: [
          '1. 💿 Go to the directory where you installed the game',
          '2. 📦 Extract all files from the fix archive',
          '3. 📁 Paste all files into the game directory',
          '4. 🔄 Replace any existing files if prompted'
        ].join('\n')
      });
    }
    
    // Footer
    embed.setFooter({ text: 'Generated by Magic Steam Tool • ⏱️ ~1.2s' })
      .setTimestamp();
    
    // Gửi message
    await loadingMsg.edit({
      content: null,
      embeds: [embed],
      components: rows.slice(0, 5), // Discord giới hạn 5 rows
    });
    
    // Update stats
    database.stats.totalSearches++;
    saveDatabase();
    
    log('INFO', 'Game requested', { appId, user: message.author.tag });
    
  } catch (error) {
    log('ERROR', 'Error handling game command', { appId, error: error.message });
    message.reply('❌ Có lỗi xảy ra!');
  }
}

// Command: Search
async function handleSearchCommand(message, query) {
  try {
    const loadingMsg = await message.reply('🔍 Đang tìm game...');
    
    const results = await searchGameByName(query);
    
    if (results.length === 0) {
      return loadingMsg.edit(`❌ Không tìm thấy game nào với từ khóa: \`${query}\``);
    }
    
    // Kiểm tra xem có files không
    const resultsWithFiles = results.map(game => ({
      ...game,
      hasFiles: findFiles(game.appId.toString()).lua.length > 0 ||
                findFiles(game.appId.toString()).fix.length > 0 ||
                findFiles(game.appId.toString()).onlineFix.length > 0,
    }));
    
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`🔍 Kết quả tìm kiếm: "${query}"`)
      .setDescription(
        resultsWithFiles.map((game, idx) => 
          `${idx + 1}. **${game.name}** ${game.hasFiles ? '✅' : '❌'}\n` +
          `   └─ AppID: \`${game.appId}\` → Dùng \`!${game.appId}\` để lấy`
        ).join('\n\n')
      )
      .setFooter({ text: '✅ = Có files | ❌ = Chưa có files' })
      .setTimestamp();
    
    await loadingMsg.edit({ embeds: [embed] });
    
    // Update stats
    database.stats.totalSearches++;
    saveDatabase();
    
  } catch (error) {
    log('ERROR', 'Error searching games', { query, error: error.message });
    message.reply('❌ Có lỗi xảy ra khi tìm kiếm!');
  }
}

// Command: List
async function handleListCommand(message) {
  try {
    const allGames = scanAllGames();
    
    if (allGames.length === 0) {
      return message.reply('❌ Chưa có game nào trong database!');
    }
    
    const embed = new EmbedBuilder()
      .setColor('#ffaa00')
      .setTitle('🎮 Danh sách Games')
      .setDescription(`Tổng cộng: **${allGames.length}** games`);
    
    // Chia nhỏ list (Discord giới hạn 1024 ký tự per field)
    const chunks = [];
    for (let i = 0; i < allGames.length; i += 20) {
      chunks.push(allGames.slice(i, i + 20));
    }
    
    const firstChunk = chunks[0].map(id => `• \`${id}\``).join('\n');
    embed.addFields({ 
      name: `Games (1-${Math.min(20, allGames.length)})`, 
      value: firstChunk,
    });
    
    if (chunks.length > 1) {
      embed.setFooter({ text: `Hiển thị 20/${allGames.length} games. Dùng !search để tìm game cụ thể.` });
    }
    
    await message.reply({ embeds: [embed] });
    
  } catch (error) {
    log('ERROR', 'Error listing games', { error: error.message });
    message.reply('❌ Có lỗi xảy ra!');
  }
}

// Command: Stats (Admin only)
async function handleStatsCommand(message) {
  if (!isAdmin(message.author.id)) {
    return message.reply('❌ Chỉ admin mới dùng được lệnh này!');
  }
  
  const totalGames = Object.keys(database.games).length;
  const totalDownloads = database.stats.totalDownloads;
  const totalSearches = database.stats.totalSearches;
  
  // Top games
  const topGames = Object.entries(database.games)
    .sort((a, b) => b[1].downloads - a[1].downloads)
    .slice(0, 10);
  
  const embed = new EmbedBuilder()
    .setColor('#ffaa00')
    .setTitle('📊 Bot Statistics')
    .addFields(
      { name: '🎮 Total Games', value: `${totalGames}`, inline: true },
      { name: '📥 Total Downloads', value: `${totalDownloads}`, inline: true },
      { name: '🔍 Total Searches', value: `${totalSearches}`, inline: true },
    );
  
  if (topGames.length > 0) {
    const topList = topGames
      .map(([appId, data], idx) => 
        `${idx + 1}. ${data.name} - ${data.downloads} downloads`
      )
      .join('\n');
    embed.addFields({ name: '🏆 Top 10 Games', value: topList });
  }
  
  embed.setTimestamp();
  
  await message.reply({ embeds: [embed] });
}

// Command: Help
async function handleHelpCommand(message) {
  const embed = new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle('🤖 Bot Commands')
    .setDescription('Hướng dẫn sử dụng bot')
    .addFields(
      { 
        name: '🎮 Game Commands', 
        value: [
          `\`${CONFIG.COMMAND_PREFIX}<appid>\` - Lấy game bằng AppID`,
          `\`${CONFIG.COMMAND_PREFIX}search <tên game>\` - Tìm game theo tên`,
          `\`${CONFIG.COMMAND_PREFIX}list\` - Xem danh sách games`,
        ].join('\n'),
      },
      {
        name: '📚 Examples',
        value: [
          `\`${CONFIG.COMMAND_PREFIX}2300320\` - Farming Simulator 25`,
          `\`${CONFIG.COMMAND_PREFIX}search elden ring\` - Tìm Elden Ring`,
          `\`${CONFIG.COMMAND_PREFIX}list\` - Xem tất cả games`,
        ].join('\n'),
      },
    );
  
  if (isAdmin(message.author.id)) {
    embed.addFields({
      name: '⚙️ Admin Commands',
      value: [
        `\`${CONFIG.COMMAND_PREFIX}stats\` - Xem thống kê`,
        `\`${CONFIG.COMMAND_PREFIX}reload\` - Reload database`,
      ].join('\n'),
    });
  }
  
  embed.setFooter({ text: 'Made with ❤️' })
    .setTimestamp();
  
  await message.reply({ embeds: [embed] });
}

// ============================================
// MESSAGE HANDLER
// ============================================

client.on('messageCreate', async (message) => {
  // Ignore bots
  if (message.author.bot) return;
  
  // Check prefix
  if (!message.content.startsWith(CONFIG.COMMAND_PREFIX)) return;
  
  // Parse command
  const args = message.content.slice(CONFIG.COMMAND_PREFIX.length).trim().split(/ +/);
  const command = args[0].toLowerCase();
  
  // Log command
  log('INFO', 'Command received', {
    command: message.content,
    user: message.author.tag,
    channel: message.channel.name || 'DM',
  });
  
  try {
    // Commands
    if (command === 'help') {
      return handleHelpCommand(message);
    }
    
    if (command === 'search') {
      const query = args.slice(1).join(' ');
      if (!query) return message.reply('❌ Vui lòng nhập tên game! Ví dụ: `!search elden ring`');
      return handleSearchCommand(message, query);
    }
    
    if (command === 'list') {
      return handleListCommand(message);
    }
    
    if (command === 'stats') {
      return handleStatsCommand(message);
    }
    
    if (command === 'reload' && isAdmin(message.author.id)) {
      loadDatabase();
      return message.reply('✅ Đã reload database!');
    }
    
    // Mặc định: Coi như AppID
    const appId = command.replace(/\D/g, '');
    if (appId && appId.length >= 4) {
      return handleGameCommand(message, appId);
    }
    
    message.reply(`❌ Lệnh không hợp lệ! Dùng \`${CONFIG.COMMAND_PREFIX}help\` để xem hướng dẫn.`);
    
  } catch (error) {
    log('ERROR', 'Error handling message', {
      command: message.content,
      error: error.message,
      stack: error.stack,
    });
    message.reply('❌ Có lỗi xảy ra! Vui lòng thử lại sau.').catch(() => {});
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
    
    // Xác định file
    const idx = parseInt(fileIdx);
    if (type === 'lua' && files.lua[idx]) {
      fileToSend = files.lua[idx];
    } else if (type === 'fix' && files.fix[idx]) {
      fileToSend = files.fix[idx];
    } else if (type === 'online' && files.onlineFix[idx]) {
      fileToSend = files.onlineFix[idx];
    }
    
    if (!fileToSend || !fs.existsSync(fileToSend.path)) {
      return interaction.editReply('❌ File không tồn tại!');
    }
    
    // Kiểm tra size
    const sizeMB = fileToSend.size / (1024 * 1024);
    if (sizeMB > CONFIG.MAX_FILE_SIZE_MB) {
      return interaction.editReply(
        `❌ File quá lớn (${fileToSend.sizeFormatted})\n` +
        `Discord chỉ cho phép upload < ${CONFIG.MAX_FILE_SIZE_MB}MB\n` +
        `💡 Liên hệ admin để lấy link download thay thế`
      );
    }
    
    // Gửi file
    await interaction.editReply({
      content: `✅ Đang gửi **${fileToSend.name}** (${fileToSend.sizeFormatted})...`,
      files: [{
        attachment: fileToSend.path,
        name: fileToSend.name,
      }],
    });
    
    // Update stats
    database.stats.totalDownloads++;
    if (database.games[appId]) {
      database.games[appId].downloads = (database.games[appId].downloads || 0) + 1;
      database.games[appId].lastAccessed = Date.now();
    }
    saveDatabase();
    
    log('INFO', 'File downloaded', {
      appId,
      fileName: fileToSend.name,
      user: interaction.user.tag,
      size: fileToSend.sizeFormatted,
    });
    
  } catch (error) {
    log('ERROR', 'Error sending file', { 
      appId, 
      error: error.message,
      stack: error.stack,
      user: interaction.user.tag,
    });
    
    try {
      await interaction.editReply('❌ Có lỗi xảy ra khi gửi file!');
    } catch (e) {
      console.error('Failed to send error message:', e);
    }
  }
});

// ============================================
// BOT READY
// ============================================

client.once('ready', () => {
  console.log('\n' + '='.repeat(50));
  console.log('🤖 DISCORD LUA BOT - STARTED');
  console.log('='.repeat(50));
  console.log(`✅ Logged in as: ${client.user.tag}`);
  console.log(`📁 Lua files: ${CONFIG.LUA_FILES_PATH}`);
  console.log(`📁 Fix files: ${CONFIG.FIX_FILES_PATH}`);
  console.log(`📁 Online fix: ${CONFIG.ONLINE_FIX_PATH}`);
  console.log(`📊 Prefix: ${CONFIG.COMMAND_PREFIX}`);
  console.log(`🎮 Total games: ${scanAllGames().length}`);
  console.log('='.repeat(50) + '\n');
  
  // Set presence
  client.user.setPresence({
    activities: [{ name: `${CONFIG.COMMAND_PREFIX}help | ${scanAllGames().length} games` }],
    status: 'online',
  });
  
  log('INFO', 'Bot started successfully');
});

// ============================================
// ERROR HANDLERS
// ============================================

client.on('error', error => {
  console.error('❌ Discord client error:');
  console.error(error);
  log('ERROR', 'Discord client error', { 
    error: error.message,
    stack: error.stack,
  });
});

client.on('warn', info => {
  console.warn('⚠️ Discord warning:', info);
  log('WARN', 'Discord warning', { info });
});

client.on('shardError', error => {
  console.error('❌ Shard error:');
  console.error(error);
  log('ERROR', 'Shard error', { 
    error: error.message,
    stack: error.stack,
  });
});

process.on('unhandledRejection', error => {
  console.error('❌ Unhandled rejection:');
  console.error(error);
  log('ERROR', 'Unhandled rejection', { 
    error: error.message,
    stack: error.stack,
  });
});

process.on('uncaughtException', error => {
  console.error('❌ Uncaught exception:');
  console.error(error);
  log('ERROR', 'Uncaught exception', { 
    error: error.message,
    stack: error.stack,
  });
  
  // Graceful shutdown
  saveDatabase();
  client.destroy();
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n\n🛑 Stopping bot...');
  saveDatabase();
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Stopping bot...');
  saveDatabase();
  client.destroy();
  process.exit(0);
});

// ============================================
// START BOT
// ============================================

// Initialize
console.log('🚀 Starting Discord Lua Bot...\n');
initializeFolders();
loadDatabase();

// Login with better error handling
client.login(CONFIG.BOT_TOKEN).catch(error => {
  console.error('\n❌ FAILED TO LOGIN!\n');
  console.error('Error:', error.message);
  console.error('\n💡 Vui lòng kiểm tra:\n');
  console.error('1. BOT_TOKEN có đúng không?');
  console.error('2. Bot có được bật trong Discord Developer Portal không?');
  console.error('3. Bot có đủ permissions không?');
  console.error('\n📚 Hướng dẫn:');
  console.error('- Vào: https://discord.com/developers/applications');
  console.error('- Chọn bot → Bot → Reset Token → Copy token mới');
  console.error('- Chọn bot → Bot → Bật MESSAGE CONTENT INTENT');
  console.error('- Invite bot vào server với đủ permissions\n');
  
  process.exit(1);
});
// Thiết lập đường dẫn /health mà bạn muốn
app.get('/health', (req, res) => {
  res.status(200).send({
    status: 'ok',
    uptime: process.uptime(),
    message: 'Bot is Alive!'
  });
});

// Trang chủ (phòng trường hợp bạn ping vào link gốc)
app.get('/', (req, res) => res.send('Bot is running!'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Web server giữ bot sống tại /health trên port: ${PORT}`);
});