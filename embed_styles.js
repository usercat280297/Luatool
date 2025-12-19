// ============================================
// ENHANCED EMBED STYLES FOR DISCORD BOT
// ============================================

const { EmbedBuilder } = require('discord.js');

// Vibrant color palette
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

async function createBeautifulGameEmbed(appId, gameInfo, files) {
  const embed = new EmbedBuilder();
  
  // Set vibrant color based on DRM severity
  embed.setColor(COLORS[gameInfo.drm.severity] || COLORS.default);
  
  // ACN branding với GIF icon
  embed.setAuthor({
    name: 'ACN GAME LIBRARY',
    iconURL: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaDB1anh5dGRqOThzcWtuMzltcGdrdGtkbWtmNDN4OHp2d3NieW8zbCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/EnrH0xdlmT5uBZ9BCe/giphy.gif'
  });
  
  embed.setTitle(`🎮 ${gameInfo.name}`);
  embed.setURL(`https://store.steampowered.com/app/${appId}`);
  
  // Thumbnail GIF nhỏ ở góc trên phải
  embed.setThumbnail('https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3dXFjb3lrc3pidTJ6cTEzaGc3enJreno0MjQ3bWxscDVibXQwZTZ3NSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/YO7P8VC7nlQlO/giphy.gif');
  
  // Ảnh game lớn ở dưới
  if (gameInfo.headerImage) {
    embed.setImage(gameInfo.headerImage);
  }
  
  // Short description with italic formatting
  let description = '';
  if (gameInfo.shortDescription) {
    const desc = gameInfo.shortDescription.length > 180 
      ? gameInfo.shortDescription.substring(0, 180) + '...'
      : gameInfo.shortDescription;
    description = `*${desc}*\n\n`;
  }
  
  // Links with better formatting
  description += `🔗 [Steam Store](https://store.steampowered.com/app/${appId}) • 📊 [SteamDB](https://steamdb.info/app/${appId})`;
  embed.setDescription(description);
  
  // ═══ GAME INFO - Beautiful Layout ═══
  // Row 1: Price | Size | Last Update
  const priceDisplay = gameInfo.isFree ? '🆓 **Free**' : `**${gameInfo.price}**`;
  const sizeDisplay = gameInfo.sizeFormatted 
    ? `**${gameInfo.sizeFormatted}**${gameInfo.sizeType === 'FULL' ? ' *(+DLC)*' : ''}`
    : '**N/A**';
  const releaseDisplay = `**${gameInfo.lastUpdate || gameInfo.releaseDate}**`;
  
  embed.addFields(
    { name: '💰 Giá', value: priceDisplay, inline: true },
    { name: '💾 Dung lượng', value: sizeDisplay, inline: true },
    { name: '🔄 Cập nhật', value: releaseDisplay, inline: true }
  );
  
  // Row 2: DLC | Language | Rating
  const dlcDisplay = gameInfo.dlcCount > 0 ? `**${gameInfo.dlcCount}** DLC` : '**0** DLC';
  const langDisplay = `**${gameInfo.languageCount}** ngôn ngữ`;
  const ratingDisplay = gameInfo.rating 
    ? `👍 **${gameInfo.rating}** (${formatNumber(gameInfo.reviewCount)} reviews)`
    : gameInfo.recommendations > 0 
    ? `⭐ **${formatNumber(gameInfo.recommendations)}**` 
    : '**N/A**';
  
  embed.addFields(
    { name: '🎯 DLC', value: dlcDisplay, inline: true },
    { name: '🌍 Ngôn ngữ', value: langDisplay, inline: true },
    { name: '📊 Rating', value: ratingDisplay, inline: true }
  );
  
  // Row 3: Developer | Publisher | DRM
  const devName = (gameInfo.developers[0] || 'Unknown').substring(0, 22);
  const pubName = gameInfo.publisher.name.substring(0, 22);
  const drmBadge = gameInfo.drm.isDRMFree ? '✅ **DRM-Free**' : `${gameInfo.drm.icon} **${gameInfo.drm.type}**`;
  
  embed.addFields(
    { name: '👨‍💻 Developer', value: `**${devName}**`, inline: true },
    { name: '🏢 Publisher', value: `**${pubName}**`, inline: true },
    { name: '🔐 DRM', value: drmBadge, inline: true }
  );
  
  // ═══ DRM WARNING SECTION - Enhanced ═══
  if (gameInfo.drm.severity === 'critical') {
    embed.addFields({
      name: '🚫 ⚠️ CẢNH BÁO DENUVO',
      value: 
        '```diff\n' +
        '- Game này có DENUVO - bảo vệ cực mạnh\n' +
        '- Có thể chưa bị crack hoặc crack chưa ổn định\n' +
        '! Chỉ tải nếu bạn chắc chắn đã có crack\n' +
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
        `Loại: ${acName}\n` +
        'Yêu cầu: Bypass đặc biệt\n' +
        'Giải pháp: Tải Crack/Fix để chơi online\n' +
        '```',
      inline: false
    });
  } else if (gameInfo.drm.isDRMFree) {
    embed.addFields({
      name: '✅ DRM-FREE',
      value: 
        '```diff\n' +
        '+ Game KHÔNG CÓ bảo vệ DRM\n' +
        '+ Tải về, giải nén, chơi ngay!\n' +
        '```',
      inline: false
    });
  }
  
  // ═══ FILE STATUS - Enhanced Display ═══
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
  } else if (hasMultiplayerFeatures) {
    fileInfo.push('⚠️ **Online-Fix** `Chưa có`');
  }
  
  if (fileInfo.length > 0) {
    embed.addFields({
      name: '📦 FILES AVAILABLE',
      value: fileInfo.join('\n'),
      inline: false
    });
  }
  
  // Hướng dẫn cài Online-Fix
  if (files.onlineFix.length > 0) {
    embed.addFields({
      name: '📖 HƯỚNG DẪN CÀI ONLINE-FIX',
      value: '```\n1. Tải xuống Online-Fix\n2. Giải nén file\n3. Copy vào thư mục game gốc\n```',
      inline: false
    });
  }
  
  // EA Game & Early Access notices
  const notices = [];
  if (gameInfo.isEAGame) notices.push({ name: '⚙️ EA GAME', value: 'Cần Origin/EA App', inline: true });
  if (gameInfo.isEarlyAccess) notices.push({ name: '🚧 EARLY ACCESS', value: 'Game chưa hoàn thành', inline: true });
  if (notices.length > 0) embed.addFields(...notices);
  
  embed.setFooter({
    text: `App ID: ${appId} • ${new Date().toLocaleDateString('vi-VN')} • Tự động xóa sau 5 phút`,
    iconURL: 'https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/clans/3703047/e5b0f06e3b8c705c1e58f5e0a7e8e2e8e5b0f06e.png'
  });
  
  return embed;
}

module.exports = { createBeautifulGameEmbed, COLORS };
