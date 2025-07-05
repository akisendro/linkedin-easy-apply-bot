require('dotenv').config();
const { Telegraf } = require('telegraf');
const cron = require('node-cron');
const runEasyApply = require('./easy-apply'); // your existing apply logic

const bot = new Telegraf(process.env.TG_BOT_TOKEN);

// Telegram command handler
bot.command('apply', async ctx => {
  await ctx.reply('🤖 Running Easy Apply…');
  try {
    const count = await runEasyApply();
    await ctx.reply(`✅ Applied to ${count} job${count === 1 ? '' : 's'}.`);
  } catch (err) {
    console.error('Error in /apply:', err);
    await ctx.reply(`❌ Oops! ${err.message}`);
  }
});

// Schedule a run every 20 minutes
cron.schedule('*/20 * * * *', async () => {
  console.log('🕒 Scheduled run triggered');
  try {
    const count = await runEasyApply();
    console.log(`✅ Scheduled applied to ${count} job${count === 1 ? '' : 's'}.`);
  } catch (err) {
    console.error('Scheduled run error:', err);
  }
});

// Start the bot
bot.launch().then(() => {
  console.log('🤖 Telegram bot up and running');
});

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
