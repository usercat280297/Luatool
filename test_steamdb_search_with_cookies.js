const fs = require('fs');
const axios = require('axios');

const COOKIES = '__Host-steamdb=8846279-7a74f3974caca720b7afff49bf4fbc4c61dc26b2; cf_clearance=OHl1DRRrVweK1WNwOtAKEFKACxZb.NwyPOYKFbXRIsg-1766175405-1.2.1.1-WRFhRkR9izKyXsxOXsbBaXWTgiPwWIgUCpMiDZElenggjnTsVbrG2XKVGa0r6G0lKjK8k3MoT1v_DQLM0D5sTGJaxfO01Hddg4yIRorJUxRhMK9hm24uhvoy.6qRcwpKsak6PoVMG.kuP9cCfXiPF_B6rb87p.Im1YkeQooZ3xW2zDbCIbzQPcSIxqIBBO2nvAzsQpQZfwzHb7YJ1e0OTg0a0io8OndxmfXypHFQQf4LCzeDH52_HybYQf0qda7t';

async function searchOnSteamDB(query) {
  try {
    console.log(`\nSearching for: "${query}"`);
    
    const response = await axios.get('https://steamdb.info/search/', {
      params: { a: 'app', q: query },
      timeout: 15000,
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Cookie': COOKIES,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://steamdb.info/',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    
    const html = response.data;
    
    // Parse results: <a href="/app/123456/">Game Name</a>
    const pattern = /<a href="\/app\/(\d+)\/[^"]*">([^<]+)<\/a>/g;
    const results = [];
    let match;
    
    while ((match = pattern.exec(html)) !== null) {
      results.push({
        appId: match[1],
        name: match[2].trim()
      });
    }
    
    console.log(`✅ Found ${results.length} results`);
    return results;
    
  } catch (error) {
    console.error(`❌ Search failed: ${error.message}`);
    if (error.response?.status === 403) {
      console.error('⚠️ Cloudflare blocked! Cookie may be expired.');
    }
    return [];
  }
}

async function testSearch() {
  // Test với một số queries
  const queries = ['resident evil', 'tekken', 'monster hunter', 'silent hill'];
  
  for (const query of queries) {
    const results = await searchOnSteamDB(query);
    if (results.length > 0) {
      console.log(`\nTop 5 results for "${query}":`);
      results.slice(0, 5).forEach(r => {
        console.log(`  ${r.appId}: ${r.name}`);
      });
    }
    await new Promise(r => setTimeout(r, 1000));
  }
}

testSearch();
