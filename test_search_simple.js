// Test search với games có sẵn tên
const fs = require('fs');

const KNOWN_GAMES = {
  220: "Half-Life 2",
  320: "Half-Life 2: Deathmatch",
  340: "Half-Life 2: Lost Coast",
  380: "Half-Life 2: Episode One",
  420: "Half-Life 2: Episode Two",
  440: "Team Fortress 2",
  550: "Left 4 Dead 2",
  570: "Dota 2",
  730: "Counter-Strike: Global Offensive",
  4000: "Garry's Mod",
  8930: "Sid Meier's Civilization V",
  12210: "Grand Theft Auto IV",
  12220: "Grand Theft Auto: San Andreas",
  17300: "Crysis",
  17330: "Crysis Warhead",
  22380: "Fallout: New Vegas",
  33930: "Arma 2",
  72850: "The Elder Scrolls V: Skyrim",
  105600: "Terraria",
  107410: "Arma 3",
  108800: "Crysis 2",
  203770: "Crusader Kings II",
  211820: "Starbound",
  221040: "Resident Evil 5",
  222480: "Resident Evil Revelations",
  227300: "Euro Truck Simulator 2",
  230410: "Warframe",
  233250: "Arma 2: Operation Arrowhead",
  236850: "Europa Universalis IV",
  239140: "Dying Light",
  242760: "The Forest",
  244850: "Space Engineers",
  251570: "7 Days to Die",
  252490: "Rust",
  252950: "Rocket League",
  255710: "Cities: Skylines",
  270880: "American Truck Simulator",
  271590: "Grand Theft Auto V",
  281990: "Stellaris",
  289070: "Sid Meier's Civilization VI",
  294100: "RimWorld",
  304240: "Resident Evil 6",
  304930: "Unturned",
  322330: "Don't Starve Together",
  346110: "ARK: Survival Evolved",
  359550: "Tom Clancy's Rainbow Six Siege",
  362890: "Black Mesa",
  367520: "Hollow Knight",
  377160: "Fallout 4",
  394360: "Hearts of Iron IV",
  413150: "Stormworks: Build and Rescue",
  418370: "Resident Evil 7",
  431960: "Wallpaper Engine",
  489830: "The Elder Scrolls V: Skyrim Special Edition",
  513710: "Payday 2",
  578080: "PLAYERUNKNOWN'S BATTLEGROUNDS",
  588650: "Dead Cells",
  629730: "Barotrauma",
  739630: "Phasmophobia",
  774361: "Blasphemous",
  823500: "BONEWORKS",
  883710: "Resident Evil 2 Remake",
  952060: "Resident Evil 3 Remake",
  975370: "Dwarf Fortress",
  1145360: "Hades",
  1158310: "Crusader Kings III",
  1172470: "Apex Legends",
  1196590: "Resident Evil Village",
  1222680: "Need for Speed Heat",
  1240440: "Halo Infinite",
  1332010: "Stray",
  1426210: "It Takes Two",
  2050650: "Resident Evil 4 Remake",
};

function normalizeGameName(name) {
  if (!name) return '';
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function calculateMatchScore(query, name) {
  if (name === query) return 100;
  if (name.includes(query)) return 90;
  if (query.includes(name)) return 85;
  
  let score = 0;
  const queryWords = query.split(/\s+/);
  const nameWords = name.split(/\s+/);
  
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

function searchGames(query) {
  const normalizedQuery = normalizeGameName(query);
  const matches = [];
  
  for (const [appId, name] of Object.entries(KNOWN_GAMES)) {
    const normalizedName = normalizeGameName(name);
    if (normalizedName.includes(normalizedQuery)) {
      const score = calculateMatchScore(normalizedQuery, normalizedName);
      matches.push({ appId, name, matchScore: score });
    }
  }
  
  matches.sort((a, b) => b.matchScore - a.matchScore);
  return matches;
}

// Test
const query = process.argv[2] || 'resident evil';

console.log('='.repeat(60));
console.log('GAME SEARCH TEST');
console.log('='.repeat(60));
console.log(`Query: "${query}"`);
console.log(`Total games: ${Object.keys(KNOWN_GAMES).length}`);
console.log();

const results = searchGames(query);

console.log('='.repeat(60));
console.log(`RESULTS: ${results.length} game(s) found`);
console.log('='.repeat(60));
console.log();

if (results.length === 0) {
  console.log('No games found!');
  console.log();
  console.log('Try searching for:');
  console.log('  - "half life"');
  console.log('  - "gta"');
  console.log('  - "skyrim"');
  console.log('  - "fallout"');
  console.log('  - "civilization"');
} else {
  results.forEach((game, index) => {
    console.log(`${index + 1}. [${game.appId}] ${game.name}`);
    console.log(`   Score: ${game.matchScore} | Command: !${game.appId}`);
    console.log();
  });
}
