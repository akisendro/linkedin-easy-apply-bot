require('dotenv').config();
const puppeteer = require('puppeteer');
const cron = require('node-cron');
const { triggerTelegram } = require('./telegram');

async function runEasyApply() {
  const LI_AT = process.env.LI_AT;
  const keyword = process.env.JOB_KEYWORD;
  const resumePath = process.env.RESUME_PATH;

  const browser = await puppeteer.launch({
    args: ['--no-sandbox','--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(60000);
  page.setDefaultTimeout(60000);

  await page.setCookie({ name: 'li_at', value: LI_AT, domain: '.linkedin.com' });

  const searchUrl =
    `https://www.linkedin.com/jobs/search/`
    + `?keywords=${encodeURIComponent(keyword)}`
    + `&f_AL=true`
    + `&f_WT=2`
    + `&sortBy=DD`;
  await page.goto(searchUrl, { waitUntil: 'networkidle2' });

  const jobLinks = await page.$$eval(
    '.jobs-search-results__list-item a.result-card__full-card-link',
    els => els.map(a => a.href).slice(0, 10)
  );

  let appliedCount = 0;
  for (let url of jobLinks) {
    await page.goto(url, { waitUntil: 'networkidle2' });
    const btn = await page.$('button.jobs-apply-button');
    if (btn) {
      await btn.click();
      await page.waitForSelector('input[type="file"]', { timeout: 5000 });
      await (await page.$('input[type="file"]')).uploadFile(resumePath);
      await page.click('button[aria-label="Submit application"]');
      appliedCount++;
      await page.waitForTimeout(2000);
    }
  }

  await browser.close();
  return appliedCount;
}

// 1) Initial run right now
(async () => {
  console.log('🕒 Initial run triggered');
  try {
    const count = await runEasyApply();
    console.log(`✅ Initial run applied to ${count} job${count===1?'':'s'}.`);
  } catch (e) {
    console.error('❌ Initial run error:', e);
  }
})();

// 2) Manual trigger via Telegram
triggerTelegram(async () => {
  const count = await runEasyApply();
  return `✅ Applied to ${count} job${count===1?'':'s'}.`;
});

// 3) Cron schedule: every 20 minutes after that
cron.schedule('*/20 * * * *', async () => {
  console.log('🕒 Scheduled run triggered');
  try {
    const count = await runEasyApply();
    console.log(`✅ Scheduled applied to ${count} job${count===1?'':'s'}.`);
  } catch (e) {
    console.error('❌ Scheduled run error:', e);
  }
});
