// index.js - Discord Bot với Keep-Alive cho Render.com
const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');

// Tạo Express server để keep-alive
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot đang online! 🟢');
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'alive', 
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Khởi động server
app.listen(PORT, () => {
  console.log(`🌐 Server keep-alive đang chạy tại port ${PORT}`);
});

// Discord Bot
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once('ready', () => {
  console.log(`✅ Bot đã đăng nhập: ${client.user.tag}`);
  console.log(`📊 Đang phục vụ ${client.guilds.cache.size} servers`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // Example commands
  if (message.content === '!ping') {
    const sent = await message.reply('Pinging...');
    sent.edit(`Pong! Latency: ${sent.createdTimestamp - message.createdTimestamp}ms`);
  }

  if (message.content === '!hello') {
    message.reply('Xin chào! Bot đang hoạt động 24/7 trên Render.com 🚀');
  }
});

// Login bot
client.login(process.env.DISCORD_TOKEN);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  client.destroy();
  process.exit(0);
});