const axios = require('axios');
const fs = require('fs');

async function testSteamDBSearch() {
  try {
    const query = 'resident evil';
    console.log(`Testing search: "${query}"\n`);
    
    const response = await axios.get('https://steamdb.info/search/', {
      params: { a: 'app', q: query },
      timeout: 15000,
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://steamdb.info/',
        'DNT': '1',
        'Connection': 'keep-alive'
      }
    });
    
    // Save HTML để xem
    fs.writeFileSync('steamdb_search_result.html', response.data);
    console.log('✅ Saved HTML to: steamdb_search_result.html\n');
    
    const html = response.data;
    
    // Thử nhiều patterns
    console.log('Testing patterns:\n');
    
    // Pattern 1: data-appid
    const appIds = [];
    const pattern1 = /data-appid="(\d+)"/g;
    let match;
    while ((match = pattern1.exec(html)) !== null) {
      appIds.push(match[1]);
    }
    console.log(`Pattern 1 (data-appid): Found ${appIds.length} AppIDs`);
    console.log('First 5:', appIds.slice(0, 5));
    
    // Pattern 2: href="/app/123456/"
    const appIds2 = [];
    const pattern2 = /href="\/app\/(\d+)\/"/g;
    while ((match = pattern2.exec(html)) !== null) {
      appIds2.push(match[1]);
    }
    console.log(`\nPattern 2 (href): Found ${appIds2.length} AppIDs`);
    console.log('First 5:', appIds2.slice(0, 5));
    
    // Pattern 3: Tên game
    const names = [];
    const pattern3 = /<td[^>]*>([^<]*resident[^<]*evil[^<]*)<\/td>/gi;
    while ((match = pattern3.exec(html)) !== null) {
      names.push(match[1].trim());
    }
    console.log(`\nPattern 3 (names): Found ${names.length} names`);
    console.log('First 5:', names.slice(0, 5));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSteamDBSearch();
