const axios = require('axios');
const fs = require('fs');

// Normalize game name for matching
function normalizeGameName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/\s+/g, '');
}

function calculateMatchScore(query, name) {
  const cleanName = name.replace(/onlinefix|online-fix/gi, '');
  
  if (cleanName === query) return 100;
  if (cleanName.includes(query)) return 90;
  if (query.includes(cleanName)) return 85;
  
  let score = 0;
  const queryWords = query.split(/\s+/);
  const nameWords = cleanName.split(/\s+/);
  
  for (const qWord of queryWords) {
    if (qWord.length < 3) continue;
    for (const nWord of nameWords) {
      if (nWord.includes(qWord) || qWord.includes(nWord)) {
        score += 10;
      }
    }
  }
  
  return score;
}

async function getGameNameFromSteamDB(appId) {
  try {
    const response = await axios.get(`https://steamdb.info/app/${appId}/`, {
      timeout: 10000,
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const html = response.data;
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) {
      let gameName = titleMatch[1]
        .replace(/\s*-\s*SteamDB.*$/i, '')
        .replace(/\s*\..*$/i, '')
        .trim();
      
      if (gameName && gameName.length > 2) {
        return gameName;
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching ${appId}:`, error.message);
    return null;
  }
}

async function searchGameByName(query) {
  const normalizedQuery = normalizeGameName(query);
  const matches = [];
  
  // Read games_list.csv
  const csvContent = fs.readFileSync('./games_list.csv', 'utf8');
  const lines = csvContent.split('\n').slice(1); // Skip header
  const games = lines.filter(l => l.trim()).map(l => l.split(',')[0]);
  
  console.log(`Found ${games.length} games in CSV`);
  console.log(`Searching for: "${query}"\n`);
  
  // Search through games
  for (const appId of games) {
    const gameName = await getGameNameFromSteamDB(appId);
    
    if (gameName) {
      const normalizedName = normalizeGameName(gameName);
      if (normalizedName.includes(normalizedQuery)) {
        const score = calculateMatchScore(normalizedQuery, normalizedName);
        matches.push({ appId, name: gameName, matchScore: score });
        console.log(`✓ Match: [${appId}] ${gameName} (score: ${score})`);
      }
    }
    
    // Rate limit
    await new Promise(r => setTimeout(r, 500));
    
    // Stop after 20 matches
    if (matches.length >= 20) break;
  }
  
  matches.sort((a, b) => b.matchScore - a.matchScore);
  return matches;
}

async function main() {
  const query = process.argv[2] || 'resident evil';
  
  console.log('='.repeat(60));
  console.log('GAME SEARCH TEST');
  console.log('='.repeat(60));
  console.log();
  
  const results = await searchGameByName(query);
  
  console.log('\n' + '='.repeat(60));
  console.log(`RESULTS: Found ${results.length} game(s)`);
  console.log('='.repeat(60));
  
  if (results.length === 0) {
    console.log('No games found!');
  } else {
    results.forEach((game, index) => {
      console.log(`${index + 1}. [${game.appId}] ${game.name}`);
      console.log(`   Match Score: ${game.matchScore}`);
      console.log(`   Command: !${game.appId}`);
      console.log();
    });
  }
}

main().catch(console.error);
