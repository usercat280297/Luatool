// ============================================
// TEST FEATURES - Kiểm tra các tính năng mới
// ============================================
require('dotenv').config();
const fs = require('fs');

console.log('\n' + '='.repeat(70));
console.log('🧪 TESTING BOT FEATURES');
console.log('='.repeat(70) + '\n');

// Test 1: Check folders
console.log('📁 Test 1: Checking folders...');
const folders = ['lua_files', 'fix_files', 'online_fix', 'logs'];
folders.forEach(folder => {
  if (fs.existsSync(folder)) {
    const files = fs.readdirSync(folder);
    console.log(`   ✅ ${folder}: ${files.length} files`);
  } else {
    console.log(`   ❌ ${folder}: NOT FOUND`);
  }
});

// Test 2: Check environment variables
console.log('\n🔑 Test 2: Checking environment variables...');
const requiredEnvs = [
  'BOT_TOKEN',
  'GITHUB_TOKEN',
  'GITHUB_REPO_OWNER',
  'GITHUB_REPO_NAME',
  'STEAM_API_KEY',
];

requiredEnvs.forEach(env => {
  if (process.env[env]) {
    const value = process.env[env];
    const masked = value.substring(0, 10) + '...' + value.substring(value.length - 5);
    console.log(`   ✅ ${env}: ${masked}`);
  } else {
    console.log(`   ❌ ${env}: NOT SET`);
  }
});

// Test 3: Check cache
console.log('\n💾 Test 3: Checking cache...');
if (fs.existsSync('./game_info_cache.json')) {
  try {
    const cache = JSON.parse(fs.readFileSync('./game_info_cache.json', 'utf8'));
    const count = Object.keys(cache).length;
    console.log(`   ✅ Cache file exists: ${count} games cached`);
    
    // Show cache age
    const oldestGame = Object.values(cache).reduce((oldest, current) => {
      return current.timestamp < oldest.timestamp ? current : oldest;
    }, Object.values(cache)[0]);
    
    if (oldestGame) {
      const age = Date.now() - oldestGame.timestamp;
      const hours = (age / 3600000).toFixed(1);
      console.log(`   📊 Oldest cache: ${hours} hours old`);
    }
  } catch (error) {
    console.log(`   ⚠️  Cache file corrupted: ${error.message}`);
  }
} else {
  console.log('   ℹ️  No cache file yet (will be created on first run)');
}

// Test 4: Check lua files format
console.log('\n📜 Test 4: Checking lua files format...');
if (fs.existsSync('./lua_files')) {
  const luaFiles = fs.readdirSync('./lua_files').filter(f => f.endsWith('.lua'));
  
  if (luaFiles.length > 0) {
    // Check first 5 files
    let validCount = 0;
    let invalidCount = 0;
    
    for (let i = 0; i < Math.min(5, luaFiles.length); i++) {
      const file = luaFiles[i];
      const content = fs.readFileSync(`./lua_files/${file}`, 'utf8');
      
      if (content.includes('addappid') || content.includes('setManifestid')) {
        validCount++;
      } else {
        invalidCount++;
        console.log(`   ⚠️  Invalid format: ${file}`);
      }
    }
    
    console.log(`   ✅ Valid lua files: ${validCount}/${Math.min(5, luaFiles.length)} checked`);
    console.log(`   📊 Total lua files: ${luaFiles.length}`);
  } else {
    console.log('   ℹ️  No lua files found (run npm run collect-lua)');
  }
}

// Test 5: Check dependencies
console.log('\n📦 Test 5: Checking dependencies...');
try {
  require('discord.js');
  console.log('   ✅ discord.js');
} catch (e) {
  console.log('   ❌ discord.js - Run: npm install');
}

try {
  require('axios');
  console.log('   ✅ axios');
} catch (e) {
  console.log('   ❌ axios - Run: npm install');
}

try {
  require('cheerio');
  console.log('   ✅ cheerio');
} catch (e) {
  console.log('   ❌ cheerio - Run: npm install');
}

try {
  require('express');
  console.log('   ✅ express');
} catch (e) {
  console.log('   ❌ express - Run: npm install');
}

// Test 6: Check scripts
console.log('\n🔧 Test 6: Checking scripts...');
const scripts = [
  'lua_discord_bot.js',
  'lua_collector.js',
  'steamdb_updater.js',
];

scripts.forEach(script => {
  if (fs.existsSync(script)) {
    const size = fs.statSync(script).size;
    console.log(`   ✅ ${script} (${(size / 1024).toFixed(1)} KB)`);
  } else {
    console.log(`   ❌ ${script} - NOT FOUND`);
  }
});

// Summary
console.log('\n' + '='.repeat(70));
console.log('📊 TEST SUMMARY');
console.log('='.repeat(70));

const luaCount = fs.existsSync('./lua_files') 
  ? fs.readdirSync('./lua_files').filter(f => f.endsWith('.lua')).length 
  : 0;

console.log(`✅ Lua files: ${luaCount}`);
console.log(`✅ Cache: ${fs.existsSync('./game_info_cache.json') ? 'Ready' : 'Will be created'}`);
console.log(`✅ Environment: ${requiredEnvs.filter(e => process.env[e]).length}/${requiredEnvs.length} variables set`);

console.log('\n💡 Next steps:');
if (luaCount < 100) {
  console.log('   1. Run: npm run collect-lua (to collect more lua files)');
}
console.log('   2. Run: npm start (to start the bot)');
console.log('   3. Test in Discord: !help');

console.log('\n' + '='.repeat(70) + '\n');
