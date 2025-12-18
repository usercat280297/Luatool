// ============================================
// SCRIPT DEBUG - TÌM GAMES BỊ THIẾU
// Chạy: node debug_missing_games.js
// ============================================

const fs = require('fs');
const path = require('path');

const CONFIG = {
  LUA_FILES_PATH: './lua_files',
  FIX_FILES_PATH: './fix_files',
  ONLINE_FIX_PATH: './online_fix',
};

// ============================================
// SCAN CẢI TIẾN - TÌM NHIỀU PATTERNS HƠN
// ============================================

function scanAllGamesImproved() {
  const gamesData = new Map();
  
  function scanFolder(folder, type) {
    if (!fs.existsSync(folder)) {
      console.log(`⚠️ Folder không tồn tại: ${folder}`);
      return;
    }
    
    function scanRecursive(dir, depth = 0) {
      if (depth > 3) return; // Giới hạn độ sâu
      
      try {
        const items = fs.readdirSync(dir);
        
        items.forEach(item => {
          const fullPath = path.join(dir, item);
          
          try {
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
              // Tên folder là số (AppID)
              if (/^\d+$/.test(item)) {
                const appId = item;
                if (!gamesData.has(appId)) {
                  gamesData.set(appId, { appId, files: [] });
                }
                gamesData.get(appId).files.push({
                  type,
                  path: fullPath,
                  isFolder: true
                });
              }
              
              // Scan subfolder
              scanRecursive(fullPath, depth + 1);
              
            } else {
              // File - extract AppID từ tên
              // Patterns: 123456.lua, game_123456.rar, 123456_fix.zip, etc.
              const matches = item.match(/(\d{4,8})/g);
              
              if (matches) {
                matches.forEach(appId => {
                  // Chỉ lấy AppID có độ dài hợp lý (4-8 chữ số)
                  if (appId.length >= 4 && appId.length <= 8) {
                    if (!gamesData.has(appId)) {
                      gamesData.set(appId, { appId, files: [] });
                    }
                    gamesData.get(appId).files.push({
                      type,
                      path: fullPath,
                      name: item,
                      size: stat.size
                    });
                  }
                });
              }
            }
          } catch (error) {
            console.error(`❌ Lỗi scan file ${fullPath}:`, error.message);
          }
        });
      } catch (error) {
        console.error(`❌ Lỗi đọc folder ${dir}:`, error.message);
      }
    }
    
    console.log(`\n📁 Scanning ${type}: ${folder}`);
    scanRecursive(folder);
  }
  
  // Scan tất cả folders
  scanFolder(CONFIG.LUA_FILES_PATH, 'lua');
  scanFolder(CONFIG.FIX_FILES_PATH, 'fix');
  scanFolder(CONFIG.ONLINE_FIX_PATH, 'online');
  
  return gamesData;
}

// ============================================
// PHÂN TÍCH VÀ REPORT
// ============================================

function analyzeGames(gamesData) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 PHÂN TÍCH KẾT QUẢ');
  console.log('='.repeat(60));
  
  const stats = {
    total: gamesData.size,
    withLua: 0,
    withFix: 0,
    withOnline: 0,
    luaOnly: 0,
    fixOnly: 0,
    complete: 0,
  };
  
  const issues = {
    shortAppId: [],
    longAppId: [],
    noFiles: [],
    weirdNames: [],
  };
  
  gamesData.forEach((data, appId) => {
    const hasLua = data.files.some(f => f.type === 'lua');
    const hasFix = data.files.some(f => f.type === 'fix');
    const hasOnline = data.files.some(f => f.type === 'online');
    
    if (hasLua) stats.withLua++;
    if (hasFix) stats.withFix++;
    if (hasOnline) stats.withOnline++;
    
    if (hasLua && !hasFix && !hasOnline) stats.luaOnly++;
    if (!hasLua && (hasFix || hasOnline)) stats.fixOnly++;
    if (hasLua && (hasFix || hasOnline)) stats.complete++;
    
    // Kiểm tra issues
    if (appId.length < 5) {
      issues.shortAppId.push({ appId, files: data.files.length });
    }
    if (appId.length > 7) {
      issues.longAppId.push({ appId, files: data.files.length });
    }
    if (data.files.length === 0) {
      issues.noFiles.push(appId);
    }
  });
  
  console.log(`\n📈 Thống kê:`);
  console.log(`   ✅ Tổng games tìm thấy: ${stats.total}`);
  console.log(`   📜 Có Lua: ${stats.withLua}`);
  console.log(`   🔧 Có Fix: ${stats.withFix}`);
  console.log(`   🌐 Có Online Fix: ${stats.withOnline}`);
  console.log(`   📦 Chỉ có Lua: ${stats.luaOnly}`);
  console.log(`   🔨 Chỉ có Fix: ${stats.fixOnly}`);
  console.log(`   ⭐ Complete (Lua + Fix/Online): ${stats.complete}`);
  
  // Issues
  console.log(`\n⚠️ Vấn đề phát hiện:`);
  
  if (issues.shortAppId.length > 0) {
    console.log(`\n   🔴 AppID quá ngắn (<5 chữ số): ${issues.shortAppId.length}`);
    console.log(`      Top 10 ví dụ:`);
    issues.shortAppId.slice(0, 10).forEach(({ appId, files }) => {
      console.log(`         - ${appId} (${files} files)`);
    });
  }
  
  if (issues.longAppId.length > 0) {
    console.log(`\n   🟡 AppID quá dài (>7 chữ số): ${issues.longAppId.length}`);
    console.log(`      Top 10 ví dụ:`);
    issues.longAppId.slice(0, 10).forEach(({ appId, files }) => {
      console.log(`         - ${appId} (${files} files)`);
    });
  }
  
  return { stats, issues };
}

// ============================================
// EXPORT DANH SÁCH ĐỂ KIỂM TRA
// ============================================

function exportGamesList(gamesData) {
  const gamesList = Array.from(gamesData.entries())
    .map(([appId, data]) => ({
      appId,
      fileCount: data.files.length,
      types: [...new Set(data.files.map(f => f.type))],
      files: data.files.map(f => ({
        type: f.type,
        name: f.name || 'folder',
        path: f.path,
      }))
    }))
    .sort((a, b) => a.appId.localeCompare(b.appId));
  
  // Export JSON
  fs.writeFileSync('games_list_detailed.json', JSON.stringify(gamesList, null, 2));
  console.log(`\n💾 Đã export: games_list_detailed.json`);
  
  // Export simple list
  const simpleList = gamesList.map(g => g.appId).join('\n');
  fs.writeFileSync('games_list_simple.txt', simpleList);
  console.log(`💾 Đã export: games_list_simple.txt`);
  
  // Export CSV
  const csv = ['AppID,Files,Types,Paths'].concat(
    gamesList.map(g => 
      `${g.appId},${g.fileCount},"${g.types.join(',')}","${g.files.map(f => f.name).join(', ')}"`
    )
  ).join('\n');
  fs.writeFileSync('games_list.csv', csv);
  console.log(`💾 Đã export: games_list.csv`);
}

// ============================================
// TÌM FILES KHÔNG MATCH PATTERN
// ============================================

function findUnmatchedFiles() {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 TÌM FILES KHÔNG MATCH PATTERN');
  console.log('='.repeat(60));
  
  const unmatched = {
    lua: [],
    fix: [],
    online: [],
  };
  
  function scanForUnmatched(folder, type) {
    if (!fs.existsSync(folder)) return;
    
    function scan(dir) {
      const items = fs.readdirSync(dir);
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scan(fullPath);
        } else {
          // Kiểm tra xem có match pattern không
          const hasAppId = /(\d{4,8})/.test(item);
          if (!hasAppId) {
            unmatched[type].push({
              name: item,
              path: fullPath,
              size: stat.size,
            });
          }
        }
      });
    }
    
    scan(folder);
  }
  
  scanForUnmatched(CONFIG.LUA_FILES_PATH, 'lua');
  scanForUnmatched(CONFIG.FIX_FILES_PATH, 'fix');
  scanForUnmatched(CONFIG.ONLINE_FIX_PATH, 'online');
  
  const totalUnmatched = unmatched.lua.length + unmatched.fix.length + unmatched.online.length;
  
  if (totalUnmatched > 0) {
    console.log(`\n⚠️ Tìm thấy ${totalUnmatched} files KHÔNG có AppID trong tên:`);
    
    ['lua', 'fix', 'online'].forEach(type => {
      if (unmatched[type].length > 0) {
        console.log(`\n   📁 ${type.toUpperCase()}: ${unmatched[type].length} files`);
        unmatched[type].slice(0, 10).forEach(f => {
          console.log(`      - ${f.name}`);
        });
        if (unmatched[type].length > 10) {
          console.log(`      ... và ${unmatched[type].length - 10} files khác`);
        }
      }
    });
    
    // Export
    fs.writeFileSync('unmatched_files.json', JSON.stringify(unmatched, null, 2));
    console.log(`\n💾 Chi tiết: unmatched_files.json`);
  } else {
    console.log(`\n✅ Tất cả files đều có AppID trong tên!`);
  }
  
  return unmatched;
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 DEBUG SCRIPT - TÌM GAMES BỊ THIẾU');
  console.log('='.repeat(60));
  
  // 1. Scan games
  const gamesData = scanAllGamesImproved();
  
  // 2. Phân tích
  const analysis = analyzeGames(gamesData);
  
  // 3. Export danh sách
  exportGamesList(gamesData);
  
  // 4. Tìm files không match
  const unmatched = findUnmatchedFiles();
  
  // 5. Gợi ý
  console.log('\n' + '='.repeat(60));
  console.log('💡 GỢI Ý KHẮC PHỤC');
  console.log('='.repeat(60));
  
  if (analysis.issues.shortAppId.length > 0) {
    console.log(`\n⚠️ ${analysis.issues.shortAppId.length} games có AppID quá ngắn (<5 chữ số)`);
    console.log(`   → Có thể là files test hoặc tên file không đúng format`);
  }
  
  if (analysis.issues.longAppId.length > 0) {
    console.log(`\n⚠️ ${analysis.issues.longAppId.length} games có AppID quá dài (>7 chữ số)`);
    console.log(`   → Kiểm tra xem có phải là timestamp hay version number không`);
  }
  
  const totalUnmatched = unmatched.lua.length + unmatched.fix.length + unmatched.online.length;
  if (totalUnmatched > 0) {
    console.log(`\n⚠️ ${totalUnmatched} files không có AppID trong tên`);
    console.log(`   → Đổi tên files theo format: {appid}.lua hoặc {appid}.rar`);
    console.log(`   → Hoặc tạo folder: {appid}/game.lua`);
  }
  
  console.log(`\n✅ Tổng games hợp lệ: ${gamesData.size}`);
  console.log(`\n📁 Kiểm tra files export để xem chi tiết:`);
  console.log(`   - games_list_detailed.json (chi tiết đầy đủ)`);
  console.log(`   - games_list_simple.txt (danh sách AppID)`);
  console.log(`   - games_list.csv (Excel-friendly)`);
  console.log(`   - unmatched_files.json (files không có AppID)`);
  
  console.log('\n✨ Hoàn tất!\n');
}

main().catch(console.error);