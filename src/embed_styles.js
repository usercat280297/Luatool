// ============================================
// ENHANCED EMBED STYLES FOR DISCORD BOT
// MOBILE OPTIMIZED EDITION
// ============================================

const { EmbedBuilder } = require('discord.js');

// Vibrant color palette - High Contrast for Dark Mode
const COLORS = {
  critical: 0xE74C3C,  // Denuvo - Bright Red
  warning: 0xF39C12,   // Anti-cheat - Bright Orange
  info: 0x3498DB,      // Steam DRM - Bright Blue
  none: 0x2ECC71,      // DRM-Free - Bright Green
  default: 0x9B59B6,   // Purple
};

function formatNumber(num) {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

async function createBeautifulGameEmbed(appId, gameInfo, files, links = {}) {
  const embed = new EmbedBuilder();
  
  // Set vibrant color based on DRM severity
  embed.setColor(COLORS[gameInfo.drm.severity] || COLORS.default);
  
  // ACN branding with GIF icon
  embed.setAuthor({
    name: 'ACN GAME LIBRARY',
    iconURL: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaDB1anh5dGRqOThzcWtuMzltcGdrdGtkbWtmNDN4OHp2d3NieW8zbCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/EnrH0xdlmT5uBZ9BCe/giphy.gif'
  });
  
  embed.setTitle(`🎮 ${gameInfo.name}`);
  embed.setURL(`https://store.steampowered.com/app/${appId}`);
  
  // Small GIF thumbnail top right - Keep for visual appeal
  embed.setThumbnail('https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3dXFjb3lrc3pidTJ6cTEzaGc3enJreno0MjQ3bWxscDVibXQwZTZ3NSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/YO7P8VC7nlQlO/giphy.gif');
  
  // Large game image at bottom - Mobile users love big images
  if (gameInfo.headerImage) {
    embed.setImage(gameInfo.headerImage);
  }
  
  // Description: Short & Punchy for Mobile
  let description = '';
  if (gameInfo.shortDescription) {
    const desc = gameInfo.shortDescription.length > 150 
      ? gameInfo.shortDescription.substring(0, 150) + '...'
      : gameInfo.shortDescription;
    description = `*${desc}*\n\n`;
  }
  
  // Links: Each on its own line for better touch targets
  description += `🔗 [**Steam Store**](https://store.steampowered.com/app/${appId})\n`;
  description += `📊 [**SteamDB Info**](https://steamdb.info/app/${appId})`;
  embed.setDescription(description);
  
  // ═══ HYBRID LAYOUT - OPTIMIZED FOR BOTH PC & MOBILE ═══
  // Strategy: Use 2 fields inline:true (side-by-side on PC, stacked on mobile)
  // Then 1 field inline:false (full width) to prevent cramping
  
  // Row 1: Price & Size (2 fields side-by-side)
  const priceDisplay = gameInfo.isFree ? '`🆓 Free`' : `\`${gameInfo.price}\``;
  const sizeDisplay = gameInfo.sizeFormatted 
    ? `\`${gameInfo.sizeFormatted}\`${gameInfo.sizeType === 'FULL' ? ' *(+DLC)*' : ''}`
    : '`N/A`';
  
  embed.addFields(
    { name: '💰 Price', value: priceDisplay, inline: true },
    { name: '💾 Size', value: sizeDisplay, inline: true }
  );

  // Row 2: Updated (full width to prevent cramping)
  embed.addFields(
    { name: '🔄 Updated', value: `\`${gameInfo.lastUpdate || gameInfo.releaseDate}\``, inline: false }
  );

  // Row 3: Languages & Rating (2 fields side-by-side)
  const langDisplay = `\`${gameInfo.languageCount} Langs\``;
  const ratingDisplay = gameInfo.rating 
    ? `\`👍 ${gameInfo.rating}\` (${formatNumber(gameInfo.reviewCount)})`
    : gameInfo.recommendations > 0 
    ? `\`⭐ ${formatNumber(gameInfo.recommendations)}\`` 
    : '`N/A`';
  
  embed.addFields(
    { name: '🌍 Languages', value: langDisplay, inline: true },
    { name: '📊 Rating', value: ratingDisplay, inline: true }
  );

  // Row 4: DLC (full width)
  const dlcDisplay = gameInfo.dlcCount > 0 ? `\`${gameInfo.dlcCount} DLC\`` : '`0 DLC`';
  embed.addFields(
    { name: '🎯 DLC', value: dlcDisplay, inline: false }
  );

  // Row 4: Credits (Merged for full width - prevents text wrapping on mobile)
  const devName = (gameInfo.developers[0] || 'Unknown').substring(0, 30);
  const pubName = gameInfo.publisher.name.substring(0, 30);
  
  // Check if Dev and Pub are same to avoid redundancy
  const credits = devName === pubName 
    ? `**Studio:** ${devName}` 
    : `**Dev:** ${devName}\n**Pub:** ${pubName}`;
    
  embed.addFields(
    { name: '🛠️ Studio / Credits', value: credits, inline: false }
  );

  // Row 5: DRM Status (Critical for this bot)
  const drmBadge = gameInfo.drm.isDRMFree 
    ? '✅ **DRM-Free** (No Protection)' 
    : `${gameInfo.drm.icon} **${gameInfo.drm.type}**`;
    
  embed.addFields({ name: '🔐 Protection', value: drmBadge, inline: false });
  
  // ═══ WARNINGS & ALERTS (Full Width) ═══
  if (gameInfo.drm.severity === 'critical') {
    const gameName = gameInfo.name || "This game";
    embed.addFields({
      name: '🚫 DENUVO DETECTED',
      value: 
        '```diff\n' +
        `- WARNING: ${gameName}\n` +
        '- Uses DENUVO Anti-Tamper\n' +
        '! Check crack status before downloading\n' +
        '```',
      inline: false
    });
  } else if (gameInfo.drm.severity === 'warning') {
    const acName = gameInfo.drm.hasEAC ? 'EasyAntiCheat' :
                   gameInfo.drm.hasBattlEye ? 'BattlEye' : 'Anti-Cheat';
    embed.addFields({
      name: `🛡️ ${acName.toUpperCase()}`,
      value: 
        '```yaml\n' +
        `Type: ${acName}\n` +
        'Note: Requires Special Bypass\n' +
        '```',
      inline: false
    });
  } else if (gameInfo.drm.isDRMFree) {
    embed.addFields({
      name: '✅ DRM-FREE',
      value: 
        '```diff\n' +
        '+ Game has NO DRM Protection\n' +
        '+ Download, Extract, and Play!\n' +
        '```',
      inline: false
    });
  }
  
  // ═══ FILE DOWNLOADS ═══
  // Check for multiplayer/online features
  const hasMultiplayerFeatures = gameInfo.hasMultiplayer || 
                                  gameInfo.drm.needsOnlineFix ||
                                  gameInfo.categories?.some(c => 
                                    c.toLowerCase().includes('multi') || 
                                    c.toLowerCase().includes('co-op'));
  
  let fileInfo = [];
  if (files.lua.length > 0) {
    fileInfo.push(`📜 **Lua Script** \`${files.lua[0].sizeFormatted}\``);
  }
  if (files.fix.length > 0) {
    fileInfo.push(`🔧 **Crack/Fix** \`${files.fix[0].sizeFormatted}\``);
  }
  if (files.onlineFix.length > 0) {
    fileInfo.push(`🌐 **Online-Fix** \`${files.onlineFix[0].sizeFormatted}\``);
  } else if (links?.onlineFixLink) {
    // Show online-fix link from database if no local file
    fileInfo.push('🌐 **Online-Fix** `Available (via Link)`');
  } else if (hasMultiplayerFeatures) {
    fileInfo.push('⚠️ **Online-Fix** `Not available`');
  }
  
  if (fileInfo.length > 0) {
    embed.addFields({
      name: '📦 AVAILABLE FILES',
      value: fileInfo.join('\n'),
      inline: false
    });
  }
  
  // Installation Guide for Online-Fix
  if (files.onlineFix.length > 0) {
    embed.addFields({
      name: '📖 INSTALL GUIDE',
      value: '```\n1. Download Online-Fix\n2. Extract files\n3. Copy to game folder\n```',
      inline: false
    });
  }
  
  // Footer - No GIF to keep it clean
  embed.setFooter({
    text: `ID: ${appId} • ${new Date().toLocaleDateString('en-US')} • Auto-delete: 5m`,
    iconURL: 'https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/clans/3703047/e5b0f06e3b8c705c1e58f5e0a7e8e2e8e5b0f06e.png'
  });
  
  return embed;
}

module.exports = { createBeautifulGameEmbed, COLORS };
