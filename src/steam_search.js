const axios = require('axios');

// Search Steam Store API directly
async function searchSteamStore(query) {
  try {
    // Use Steam Store search API
    const response = await axios.get('https://store.steampowered.com/api/storesearch/', {
      params: {
        term: query,
        l: 'english',
        cc: 'US'
      },
      timeout: 10000
    });
    
    if (response.data && response.data.items) {
      return response.data.items.map(item => ({
        appId: item.id.toString(),
        name: item.name,
        type: item.type
      }));
    }
    
    // Fallback: use suggest endpoint (higher recall for short terms)
    const suggest = await axios.get('https://store.steampowered.com/search/suggest', {
      params: {
        term: query,
        f: 'games',
        l: 'english',
        cc: 'US'
      },
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const html = suggest.data || '';
    const results = [];
    const re = /href="https:\/\/store\.steampowered\.com\/app\/(\d+)[^"]*"[^>]*>([^<]+)<\/a>/gi;
    let m;
    while ((m = re.exec(html)) && results.length < 30) {
      results.push({ appId: m[1].toString(), name: m[2], type: 'game' });
    }
    return results;
  } catch (error) {
    console.error('Steam Store search error:', error.message);
    return [];
  }
}

module.exports = { searchSteamStore };
