const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(process.env.TG_BOT_TOKEN, { polling: true });

function triggerTelegram(runFunc) {
  bot.onText(/\/apply/, async (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, '🤖 Running Easy Apply...');
    try {
      const result = await runFunc();
      bot.sendMessage(chatId, result);
    } catch (e) {
      bot.sendMessage(chatId, `❌ Error: ${e.message}`);
    }
  });
}

module.exports = { triggerTelegram };
