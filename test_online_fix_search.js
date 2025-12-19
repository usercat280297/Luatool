// ============================================
// TEST SCRIPT - ONLINE-FIX SMART SEARCH
// ============================================

const fs = require('fs');
const path = require('path');

const CONFIG = {
  ONLINE_FIX_PATH: './online_fix',
};

// Copy functions from main bot
function normalizeGameName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/\s+/g, '');
}

function calculateMatchScore(gameName, fileName) {
  const cleanFileName = fileName.replace(/onlinefix|online-fix/gi, '');
  
  let score = 0;
  
  if (cleanFileName === gameName) return 100;
  if (cleanFileName.includes(gameName)) return 90;
  if (gameName.includes(cleanFileName)) return 85;
  
  const gameWords = gameName.split(/\s+/);
  const fileWords = cleanFileName.split(/\s+/);
  
  for (const gameWord of gameWords) {
    if (gameWord.length < 3) continue;
    for (const fileWord of fileWords) {
      if (fileWord.includes(gameWord) || gameWord.includes(fileWord)) {
        score += 10;
      }
    }
  }
  
  return score;
}

function findOnlineFixByGameName(gameName) {
  if (!gameName || !fs.existsSync(CONFIG.ONLINE_FIX_PATH)) {
    console.log(`❌ Folder not found: ${CONFIG.ONLINE_FIX_PATH}`);
    return [];
  }
  
  const normalizedGameName = normalizeGameName(gameName);
  const foundFiles = [];
  
  console.log(`\n🔍 Searching for: "${gameName}"`);
  console.log(`📝 Normalized: "${normalizedGameName}"\n`);
  
  try {
    const files = fs.readdirSync(CONFIG.ONLINE_FIX_PATH);
    
    console.log(`📁 Found ${files.length} files in online_fix folder\n`);
    
    for (const file of files) {
      const filePath = path.join(CONFIG.ONLINE_FIX_PATH, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        console.log(`⏭️  Skipping directory: ${file}`);
        continue;
      }
      
      const ext = path.extname(file).toLowerCase();
      if (!['.zip', '.rar', '.7z'].includes(ext)) {
        console.log(`⏭️  Skipping non-archive: ${file}`);
        continue;
      }
      
      const normalizedFileName = normalizeGameName(file);
      
      console.log(`\n📄 Checking: ${file}`);
      console.log(`   Normalized: ${normalizedFileName}`);
      
      if (normalizedFileName.includes(normalizedGameName) || 
          normalizedGameName.includes(normalizedFileName.replace(/onlinefix|online-fix/gi, ''))) {
        
        const matchScore = calculateMatchScore(normalizedGameName, normalizedFileName);
        
        console.log(`   ✅ MATCH! Score: ${matchScore}`);
        
        foundFiles.push({
          path: filePath,
          name: file,
          size: stats.size,
          matchScore: matchScore
        });
      } else {
        console.log(`   ❌ No match`);
      }
    }
    
    foundFiles.sort((a, b) => b.matchScore - a.matchScore);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  return foundFiles;
}

// ============================================
// TEST CASES
// ============================================

console.log('='.repeat(70));
console.log('🧪 TESTING ONLINE-FIX SMART SEARCH');
console.log('='.repeat(70));

const testCases = [
  { appId: '2669320', gameName: 'EA SPORTS FC™ 25' },
  { appId: '1778820', gameName: 'Tekken 8' },
  { appId: '1623730', gameName: 'Palworld' },
  { appId: '1086940', gameName: "Baldur's Gate 3" },
  { appId: '1245620', gameName: 'ELDEN RING' },
  { appId: '2246460', gameName: 'Monster Hunter Wilds' },
  { appId: '1426210', gameName: 'It Takes Two' },
  { appId: '892970', gameName: 'Valheim' },
  { appId: '1091500', gameName: 'Cyberpunk 2077' },
  { appId: '1174180', gameName: 'Red Dead Redemption 2' },
];

console.log('\n📋 Test Cases:');
testCases.forEach((tc, i) => {
  console.log(`   ${i + 1}. ${tc.gameName} (AppID: ${tc.appId})`);
});

console.log('\n' + '='.repeat(70));

testCases.forEach((testCase, index) => {
  console.log('\n' + '─'.repeat(70));
  console.log(`\n🎮 TEST ${index + 1}/${testCases.length}`);
  console.log(`   Game: ${testCase.gameName}`);
  console.log(`   AppID: ${testCase.appId}`);
  
  const results = findOnlineFixByGameName(testCase.gameName);
  
  if (results.length > 0) {
    console.log(`\n✅ FOUND ${results.length} file(s):\n`);
    results.forEach((file, i) => {
      console.log(`   ${i + 1}. ${file.name}`);
      console.log(`      Score: ${file.matchScore}`);
      console.log(`      Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`      Path: ${file.path}`);
    });
  } else {
    console.log(`\n❌ NO FILES FOUND`);
    console.log(`\n💡 Suggestions:`);
    console.log(`   1. Create file: "${testCase.gameName} online-fix.zip"`);
    console.log(`   2. Or use AppID: "${testCase.appId}.zip"`);
  }
});

console.log('\n' + '='.repeat(70));
console.log('✅ TEST COMPLETED');
console.log('='.repeat(70) + '\n');

// ============================================
// SUMMARY
// ============================================

console.log('\n📊 SUMMARY\n');

const allFiles = fs.existsSync(CONFIG.ONLINE_FIX_PATH) 
  ? fs.readdirSync(CONFIG.ONLINE_FIX_PATH).filter(f => {
      const ext = path.extname(f).toLowerCase();
      return ['.zip', '.rar', '.7z'].includes(ext);
    })
  : [];

console.log(`📁 Total files in online_fix: ${allFiles.length}`);

if (allFiles.length > 0) {
  console.log(`\n📄 Files:\n`);
  allFiles.forEach((file, i) => {
    const filePath = path.join(CONFIG.ONLINE_FIX_PATH, file);
    const stats = fs.statSync(filePath);
    console.log(`   ${i + 1}. ${file} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
  });
}

const foundCount = testCases.filter(tc => {
  const results = findOnlineFixByGameName(tc.gameName);
  return results.length > 0;
}).length;

console.log(`\n✅ Found: ${foundCount}/${testCases.length} games`);
console.log(`❌ Missing: ${testCases.length - foundCount}/${testCases.length} games`);

if (foundCount < testCases.length) {
  console.log(`\n⚠️  Missing games:`);
  testCases.forEach(tc => {
    const results = findOnlineFixByGameName(tc.gameName);
    if (results.length === 0) {
      console.log(`   - ${tc.gameName} (AppID: ${tc.appId})`);
    }
  });
}

console.log('\n' + '='.repeat(70));
console.log('💡 TIP: Read ONLINE_FIX_GUIDE.md for naming conventions');
console.log('='.repeat(70) + '\n');
