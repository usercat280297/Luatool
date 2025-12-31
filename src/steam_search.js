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
    
    return [];
  } catch (error) {
    console.error('Steam Store search error:', error.message);
    return [];
  }
}

module.exports = { searchSteamStore };
