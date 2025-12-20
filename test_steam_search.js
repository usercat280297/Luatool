const { searchSteamStore } = require('./steam_search');

async function test() {
  console.log('Testing Steam Store Search API\n');
  console.log('='.repeat(60));
  
  const query = process.argv[2] || 'resident evil';
  console.log(`Query: "${query}"\n`);
  
  const results = await searchSteamStore(query);
  
  console.log(`Found: ${results.length} games`);
  console.log('='.repeat(60));
  console.log();
  
  results.slice(0, 10).forEach((game, i) => {
    console.log(`${i + 1}. [${game.appId}] ${game.name}`);
  });
}

test();
