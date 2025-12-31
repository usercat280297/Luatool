
try {
  require('./lua_discord_bot.js');
  console.log('Successfully loaded lua_discord_bot.js');
} catch (error) {
  // We expect an error because the bot will try to connect to Discord or read env vars that might not be fully set up in this test context,
  // BUT we are specifically checking that it's NOT a ReferenceError for DENUVO_GAMES.
  
  if (error.name === 'ReferenceError' && error.message.includes('DENUVO_GAMES')) {
    console.error('FAILED: ReferenceError: DENUVO_GAMES is not defined');
    process.exit(1);
  }
  
  // If it's another error (like "Token invalid" or "missing .env"), that's fine for this syntax check.
  console.log('Passed syntax check (encountered expected runtime error):', error.message.split('\n')[0]);
}
