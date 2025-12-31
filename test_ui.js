const { createBeautifulGameEmbed } = require('./embed_styles');

// Mock data for testing
const mockGameInfo = {
  name: 'Black Myth: Wukong',
  price: '1.299.000₫',
  sizeFormatted: '128.6 GB',
  sizeType: 'FULL',
  lastUpdate: '2024-08-20',
  dlcCount: 2,
  languageCount: 14,
  rating: 'Overwhelmingly Positive',
  reviewCount: 950000,
  recommendations: 950000,
  developers: ['Game Science'],
  publisher: { name: 'Game Science', isEA: false },
  headerImage: 'https://cdn.akamai.steamstatic.com/steam/apps/2358720/header.jpg',
  shortDescription: 'Black Myth: Wukong is an action RPG rooted in Chinese mythology.',
  drm: {
    severity: 'critical',
    isDRMFree: false,
    type: 'Denuvo Anti-Tamper',
    icon: '🚫'
  },
  isEAGame: false,
  isEarlyAccess: false
};

const mockFiles = {
  lua: [],
  fix: [],
  onlineFix: [{ sizeFormatted: '15 MB' }]
};

async function test() {
  console.log('Generating embed...');
  try {
    const embed = await createBeautifulGameEmbed(2358720, mockGameInfo, mockFiles);
    
    console.log('--- EMBED RESULT ---');
    console.log(JSON.stringify(embed.data, null, 2));
    console.log('--------------------');
    console.log('✅ Test completed successfully');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

test();
