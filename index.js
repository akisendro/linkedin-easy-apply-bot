// index.js

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const puppeteer = require('puppeteer');
const cron = require('node-cron');

const {
  LI_AT,
  TG_BOT_TOKEN,
  ADMIN_CHAT_ID,
  JOB_KEYWORD,
  RESUME_PATH
} = process.env;

// --- 1) Your Easy-Apply implementation --------------------------------
async function runEasyApply() {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(60000);
  page.setDefaultTimeout(60000);

  // authenticate via cookie
  await page.setCookie({
    name: 'li_at',
    value: LI_AT,
    domain: '.linkedin.com'
  });

  // build search URL (remote worldwide, Easy Apply, newest first)
  const searchUrl =
    'https://www.linkedin.com/jobs/search/?' +
    `keywords=${encodeURIComponent(JOB_KEYWORD)}` +
    '&f_AL=true' +
    '&f_WT=2' +
    '&sortBy=DD';

  await page.goto(searchUrl, { waitUntil: 'networkidle2' });

  // grab up to 10 result links
  const jobLinks = await page.$$eval(
    '.jobs-search-results__list-item a.result-card__full-card-link',
    els => els.map(a => a.href).slice(0, 10)
  );

  let appliedCount = 0;
  for (let url of jobLinks) {
    await page.goto(url, { waitUntil: 'networkidle2' });
    const btn = await page.$('button.jobs-apply-button');
    if (!btn) continue;

    await btn.click();
    await page.waitForSelector('input[type="file"]', { timeout: 5000 });
    const fileInput = await page.$('input[type="file"]');
    await fileInput.uploadFile(RESUME_PATH);
    await page.click('button[aria-label="Submit application"]');
    appliedCount++;
    await page.waitForTimeout(2000);
  }

  await browser.close();
  return appliedCount;
}
// ------------------------------------------------------------------------

const bot = new TelegramBot(TG_BOT_TOKEN, { polling: true });
bot.on('polling_error', console.error);

// --- 2) Notify admin that the bot has started -------------------------
(async () => {
  try {
    await bot.getMe();
    await bot.sendMessage(
      ADMIN_CHAT_ID,
      `🤖 Bot started at ${new Date().toLocaleTimeString()}`
    );
  } catch (err) {
    console.error('Failed to send startup message:', err);
  }
})();
// ------------------------------------------------------------------------

// --- 3) Manual `/apply` command handler -------------------------------
bot.onText(/\/apply/, async (msg) => {
  const chatId = msg.chat.id;
  await bot.sendMessage(chatId, '🤖 Running Easy Apply…');
  try {
    const count = await runEasyApply();
    await bot.sendMessage(
      chatId,
      `✅ Applied to ${count} job${count === 1 ? '' : 's'}.`
    );
  } catch (err) {
    console.error('Error during manual apply:', err);
    await bot.sendMessage(chatId, `❌ Error: ${err.message}`);
  }
});
// ------------------------------------------------------------------------

// --- 4) Initial run immediately on startup -----------------------------
(async () => {
  console.log('🕒 Initial run triggered');
  try {
    const count = await runEasyApply();
    console.log(`✅ Initial run applied to ${count} job${count === 1 ? '' : 's'}.`);
    await bot.sendMessage(
      ADMIN_CHAT_ID,
      `🚀 Initial run: applied to ${count} job${count === 1 ? '' : 's'}.`
    );
  } catch (err) {
    console.error('Initial run error:', err);
    await bot.sendMessage(
      ADMIN_CHAT_ID,
      `❌ Initial run error: ${err.message}`
    );
  }
})();
// ------------------------------------------------------------------------

// --- 5) Cron schedule: every 20 minutes after that ----------------------
cron.schedule('*/20 * * * *', async () => {
  console.log('🕒 Scheduled run triggered');
  try {
    const count = await runEasyApply();
    console.log(`✅ Scheduled run applied to ${count} job${count === 1 ? '' : 's'}.`);
    await bot.sendMessage(
      ADMIN_CHAT_ID,
      `⏰ Scheduled run: applied to ${count} job${count === 1 ? '' : 's'}.`
    );
  } catch (err) {
    console.error('Scheduled run error:', err);
    await bot.sendMessage(
      ADMIN_CHAT_ID,
      `❌ Scheduled run error: ${err.message}`
    );
  }
});
// ------------------------------------------------------------------------
