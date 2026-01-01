// ============================================
// ENHANCED EMBED STYLES FOR DISCORD BOT
// PROFESSIONAL EDITION - FULL FEATURED
// PC & MOBILE OPTIMIZED
// ============================================

const { EmbedBuilder } = require('discord.js');

// ============================================
// COLOR PALETTE - DRM Severity Based
// ============================================
const COLORS = {
  critical: 0xE74C3C,  // Denuvo - Bright Red
  warning: 0xF39C12,   // Anti-cheat - Bright Orange
  info: 0x3498DB,      // Steam DRM - Bright Blue
  none: 0x2ECC71,      // DRM-Free - Bright Green
  default: 0x9B59B6,   // Purple
  premium: 0xFFD700,   // Gold for special games
};

// ============================================
// ICON MAPPINGS
// ============================================
const PLATFORM_ICONS = {
  windows: '🪟',
  mac: '🍎',
  linux: '🐧',
};

const DRM_ICONS = {
  denuvo: '🚫',
  eac: '🛡️',
  battleye: '🛡️',
  steamDRM: '🔒',
  drmFree: '✅',
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format large numbers for display
 * @param {number} num - Number to format
 * @returns {string} Formatted number string
 */
function formatNumber(num) {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

/**
 * Format platform support icons
 * @param {object} platforms - Platform availability object
 * @returns {string} Platform icons string
 */
function formatPlatforms(platforms) {
  if (!platforms) return 'N/A';
  const available = [];
  if (platforms.windows) available.push(PLATFORM_ICONS.windows);
  if (platforms.mac) available.push(PLATFORM_ICONS.mac);
  if (platforms.linux) available.push(PLATFORM_ICONS.linux);
  return available.length > 0 ? available.join(' ') : 'N/A';
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
function truncateText(text, maxLength = 150) {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

/**
 * Get DRM severity emoji and text
 * @param {object} drm - DRM information object
 * @returns {object} Icon and display text
 */
function getDRMDisplay(drm) {
  if (drm.isDRMFree) {
    return { icon: DRM_ICONS.drmFree, text: '**DRM-Free**', color: COLORS.none };
  }
  if (drm.severity === 'critical') {
    return { icon: DRM_ICONS.denuvo, text: '**DENUVO Anti-Tamper**', color: COLORS.critical };
  }
  if (drm.hasEAC) {
    return { icon: DRM_ICONS.eac, text: '**EasyAntiCheat**', color: COLORS.warning };
  }
  if (drm.hasBattlEye) {
    return { icon: DRM_ICONS.battleye, text: '**BattlEye**', color: COLORS.warning };
  }
  return { icon: DRM_ICONS.steamDRM, text: '**Steam DRM**', color: COLORS.info };
}

// ============================================
// MAIN EMBED BUILDER
// ============================================

/**
 * Create a beautiful, professional game embed
 * @param {string} appId - Steam App ID
 * @param {object} gameInfo - Game information object
 * @param {object} files - Available files (lua, fix, onlineFix)
 * @param {object} links - External links (optional)
 * @returns {EmbedBuilder} Configured Discord embed
 */
async function createBeautifulGameEmbed(appId, gameInfo, files, links = {}) {
  const embed = new EmbedBuilder();
  
  // ============================================
  // EMBED COLOR - Based on DRM Severity
  // ============================================
  const drmDisplay = getDRMDisplay(gameInfo.drm);
  embed.setColor(drmDisplay.color);
  
  // ============================================
  // BRANDING - Author Section with Animated GIF
  // ============================================
  embed.setAuthor({
    name: 'ACN GAME LIBRARY',
    iconURL: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaDB1anh5dGRqOThzcWtuMzltcGdrdGtkbWtmNDN4OHp2d3NieW8zbCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/EnrH0xdlmT5uBZ9BCe/giphy.gif'
  });
  
  // ============================================
  // TITLE & LINK
  // ============================================
  embed.setTitle(`🎮 ${gameInfo.name}`);
  embed.setURL(`https://store.steampowered.com/app/${appId}`);
  
  // ============================================
  // THUMBNAIL - Animated GIF (Fixed for Mobile)
  // ============================================
  embed.setThumbnail('https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3dXFjb3lrc3pidTJ6cTEzaGc3enJreno0MjQ3bWxscDVibXQwZTZ3NSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/YO7P8VC7nlQlO/giphy.gif');
  
  // ============================================
  // DESCRIPTION - Game Summary + Quick Links
  // ============================================
  let description = '';
  
  // Game short description
  if (gameInfo.shortDescription) {
    description += `*${truncateText(gameInfo.shortDescription, 150)}*\n\n`;
  }
  
  // Quick links section
  description += `🔗 [**Steam Store**](https://store.steampowered.com/app/${appId}) • `;
  description += `[**SteamDB**](https://steamdb.info/app/${appId})`;
  
  // Add ProtonDB link if Linux compatible
  if (gameInfo.platforms?.linux) {
    description += ` • [**ProtonDB**](https://www.protondb.com/app/${appId})`;
  }
  
  embed.setDescription(description);
  
  // ============================================
  // FIELD LAYOUT - PROFESSIONAL 2-COLUMN DESIGN
  // Strategy: 2-column for short data, full-width for detailed info
  // This ensures perfect display on both PC and Mobile
  // ============================================
  
  // ──────────────────────────────────────────
  // ROW 1: Price + Platform Support
  // ──────────────────────────────────────────
  const priceDisplay = gameInfo.isFree 
    ? '🆓 **Free to Play**' 
    : `**${gameInfo.price}**`;
  
  const platformDisplay = formatPlatforms(gameInfo.platforms);
  
  embed.addFields(
    { 
      name: '💰 Price', 
      value: priceDisplay, 
      inline: true 
    },
    { 
      name: '💻 Platforms', 
      value: platformDisplay, 
      inline: true 
    }
  );
  
  // ──────────────────────────────────────────
  // ROW 2: Size + Languages
  // ──────────────────────────────────────────
  const sizeDisplay = gameInfo.sizeFormatted 
    ? `**${gameInfo.sizeFormatted}**${gameInfo.sizeType === 'FULL' ? ' *(+DLC)*' : ''}`
    : '**Unknown**';
  
  const langDisplay = `**${gameInfo.languageCount || 0}** Languages`;
  
  embed.addFields(
    { 
      name: '💾 Download Size', 
      value: sizeDisplay, 
      inline: true 
    },
    { 
      name: '🌍 Languages', 
      value: langDisplay, 
      inline: true 
    }
  );
  
  // ──────────────────────────────────────────
  // ROW 3: Release Date + Last Update
  // ──────────────────────────────────────────
  const releaseDisplay = gameInfo.releaseDate 
    ? `**${gameInfo.releaseDate}**` 
    : '**TBA**';
  
  const updateDisplay = gameInfo.lastUpdate 
    ? `**${gameInfo.lastUpdate}**` 
    : releaseDisplay;
  
  embed.addFields(
    { 
      name: '📅 Release Date', 
      value: releaseDisplay, 
      inline: true 
    },
    { 
      name: '🔄 Last Update', 
      value: updateDisplay, 
      inline: true 
    }
  );
  
  // ──────────────────────────────────────────
  // ROW 4: Rating + Reviews
  // ──────────────────────────────────────────
  let ratingDisplay = '**N/A**';
  if (gameInfo.rating) {
    ratingDisplay = `**👍 ${gameInfo.rating}%** (${formatNumber(gameInfo.reviewCount)} reviews)`;
  } else if (gameInfo.recommendations > 0) {
    ratingDisplay = `**⭐ ${formatNumber(gameInfo.recommendations)}** recommendations`;
  }
  
  const dlcDisplay = gameInfo.dlcCount > 0 
    ? `**${gameInfo.dlcCount}** DLC Available` 
    : '**No DLC**';
  
  embed.addFields(
    { 
      name: '📊 User Rating', 
      value: ratingDisplay, 
      inline: true 
    },
    { 
      name: '🎯 DLC Content', 
      value: dlcDisplay, 
      inline: true 
    }
  );
  
  // ──────────────────────────────────────────
  // ROW 5: Metacritic Score (if available)
  // ──────────────────────────────────────────
  if (gameInfo.metacritic?.score) {
    const metaColor = gameInfo.metacritic.score >= 75 ? '🟢' : 
                      gameInfo.metacritic.score >= 50 ? '🟡' : '🔴';
    const metaDisplay = `${metaColor} **${gameInfo.metacritic.score}/100**`;
    
    embed.addFields({
      name: '🎬 Metacritic Score',
      value: metaDisplay,
      inline: true
    });
    
    // Add empty field for alignment if needed
    embed.addFields({ name: '\u200B', value: '\u200B', inline: true });
  }
  
  // ──────────────────────────────────────────
  // FULL WIDTH: Genres & Categories
  // ──────────────────────────────────────────
  if (gameInfo.genres && gameInfo.genres.length > 0) {
    const genreList = gameInfo.genres.slice(0, 5).join(' • ');
    embed.addFields({
      name: '🎨 Genres',
      value: `**${genreList}**`,
      inline: false
    });
  }
  
  // ──────────────────────────────────────────
  // FULL WIDTH: Key Features/Categories
  // ──────────────────────────────────────────
  if (gameInfo.categories && gameInfo.categories.length > 0) {
    const features = gameInfo.categories
      .filter(cat => [
        'Single-player', 'Multi-player', 'Co-op', 
        'Online Co-op', 'Steam Achievements', 
        'Full controller support', 'Steam Cloud'
      ].some(key => cat.includes(key)))
      .slice(0, 6)
      .map(f => `• ${f}`)
      .join('\n');
    
    if (features) {
      embed.addFields({
        name: '✨ Key Features',
        value: features,
        inline: false
      });
    }
  }
  
  // ──────────────────────────────────────────
  // FULL WIDTH: Developer & Publisher
  // ──────────────────────────────────────────
  const devName = truncateText((gameInfo.developers?.[0] || 'Unknown'), 35);
  const pubName = truncateText(gameInfo.publisher?.name || 'Unknown', 35);
  
  let creditsText = '';
  if (devName === pubName) {
    creditsText = `**Studio:** ${devName}`;
  } else {
    creditsText = `**Developer:** ${devName}\n**Publisher:** ${pubName}`;
  }
  
  // Add publisher website if available
  if (gameInfo.publisher?.website) {
    creditsText += `\n[🌐 Official Website](${gameInfo.publisher.website})`;
  }
  
  embed.addFields({
    name: '🛠️ Development Team',
    value: creditsText,
    inline: false
  });
  
  // ============================================
  // DRM & PROTECTION STATUS
  // ============================================
  embed.addFields({
    name: '🔐 Protection Status',
    value: `${drmDisplay.icon} ${drmDisplay.text}`,
    inline: false
  });
  
  // ──────────────────────────────────────────
  // CRITICAL WARNINGS - DENUVO ALERT
  // ──────────────────────────────────────────
  if (gameInfo.drm.severity === 'critical') {
    const gameName = gameInfo.name || "This game";
    embed.addFields({
      name: '🚫 DENUVO ANTI-TAMPER DETECTED',
      value: 
        '```diff\n' +
        `- WARNING: ${gameName}\n` +
        '- Protected by DENUVO Anti-Tamper\n' +
        '- Check crack status before downloading\n' +
        '! May require specific crack version\n' +
        '```',
      inline: false
    });
  }
  
  // ──────────────────────────────────────────
  // WARNING: Anti-Cheat Systems
  // ──────────────────────────────────────────
  if (gameInfo.drm.severity === 'warning') {
    let acName = 'Anti-Cheat';
    let acDetails = '';
    
    if (gameInfo.drm.hasEAC) {
      acName = 'EasyAntiCheat (EAC)';
      acDetails = 'Requires specialized bypass for online features';
    } else if (gameInfo.drm.hasBattlEye) {
      acName = 'BattlEye Anti-Cheat';
      acDetails = 'May block modified game files';
    }
    
    embed.addFields({
      name: `🛡️ ${acName.toUpperCase()} SYSTEM`,
      value: 
        '```yaml\n' +
        `System: ${acName}\n` +
        `Status: Active Protection\n` +
        `Note: ${acDetails}\n` +
        '```',
      inline: false
    });
  }
  
  // ──────────────────────────────────────────
  // SUCCESS: DRM-Free Games
  // ──────────────────────────────────────────
  if (gameInfo.drm.isDRMFree) {
    embed.addFields({
      name: '✅ DRM-FREE GAME',
      value: 
        '```diff\n' +
        '+ This game has NO DRM protection\n' +
        '+ Download, extract, and play directly\n' +
        '+ No activation or cracks needed\n' +
        '+ Full offline support\n' +
        '```',
      inline: false
    });
  }
  
  // ============================================
  // AVAILABLE DOWNLOADS
  // ============================================
  const hasMultiplayerFeatures = gameInfo.hasMultiplayer || 
                                  gameInfo.drm.needsOnlineFix ||
                                  gameInfo.categories?.some(c => 
                                    c.toLowerCase().includes('multi') || 
                                    c.toLowerCase().includes('co-op') ||
                                    c.toLowerCase().includes('online'));
  
  let fileInfo = [];
  
  // Lua Script Files
  if (files.lua && files.lua.length > 0) {
    fileInfo.push(`📜 **Lua Script** → \`${files.lua[0].sizeFormatted}\``);
  }
  
  // Crack/Fix Files
  if (files.fix && files.fix.length > 0) {
    fileInfo.push(`🔧 **Crack/Fix** → \`${files.fix[0].sizeFormatted}\``);
  }
  
  // Online-Fix Files
  if (files.onlineFix && files.onlineFix.length > 0) {
    fileInfo.push(`🌐 **Online-Fix** → \`${files.onlineFix[0].sizeFormatted}\``);
  } else if (links?.onlineFixLink) {
    fileInfo.push('🌐 **Online-Fix** → `Available via link`');
  } else if (hasMultiplayerFeatures) {
    fileInfo.push('⚠️ **Online-Fix** → `Not currently available`');
  }
  
  // Display available files
  if (fileInfo.length > 0) {
    embed.addFields({
      name: '📦 AVAILABLE DOWNLOADS',
      value: fileInfo.join('\n'),
      inline: false
    });
  }
  
  // Recommended automatic patch strategy (if available)
  if (links?.autoPatch?.strategy) {
    const map = {
      online_fix: '🌐 Online-Fix (recommended)',
      crack: '🔥 Crack (recommended)',
      original: '🛡️ Original (no changes)',
    };
    const rec = map[links.autoPatch.strategy] || 'Original';
    embed.addFields({
      name: '🧭 Recommended Patch',
      value: `**${rec}** • Reason: \`${links.autoPatch.reason}\``,
      inline: false
    });
  }
  
  // ──────────────────────────────────────────
  // Installation Guide for Online-Fix
  // ──────────────────────────────────────────
  if (files.onlineFix && files.onlineFix.length > 0) {
    embed.addFields({
      name: '📖 ONLINE-FIX INSTALLATION GUIDE',
      value: 
        '```\n' +
        '1. Download the Online-Fix file\n' +
        '2. Extract all files from the archive\n' +
        '3. Copy files to your game installation folder\n' +
        '4. Replace any existing files if prompted\n' +
        '5. Run the game and enjoy online features!\n' +
        '```',
      inline: false
    });
  }
  
  // ──────────────────────────────────────────
  // Achievement Information
  // ──────────────────────────────────────────
  if (gameInfo.achievements && gameInfo.achievements.total > 0) {
    embed.addFields({
      name: '🏆 Achievements',
      value: `**${gameInfo.achievements.total}** achievements available`,
      inline: true
    });
  }
  
  // ============================================
  // FOOTER - Clean & Professional
  // ============================================
  embed.setFooter({
    text: `Steam ID: ${appId} • ${new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })} • Auto-delete: 5 min`,
    iconURL: 'https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/clans/3703047/e5b0f06e3b8c705c1e58f5e0a7e8e2e8e5b0f06e.png'
  });
  
  // ============================================
  // GAME HEADER IMAGE - Large banner at bottom
  // ============================================
  if (gameInfo.headerImage) {
    embed.setImage(gameInfo.headerImage);
  }
  
  // Add timestamp
  embed.setTimestamp();
  
  return embed;
}

// ============================================
// EXPORTS
// ============================================
module.exports = { 
  createBeautifulGameEmbed, 
  COLORS,
  formatNumber,
  formatPlatforms,
  getDRMDisplay
};
