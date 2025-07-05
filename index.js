require('dotenv').config();
const puppeteer = require('puppeteer');
const { triggerTelegram } = require('./telegram');

async function runEasyApply() {
  const LI_AT = process.env.LI_AT;
  const keyword = process.env.JOB_KEYWORD;
  const location = process.env.JOB_LOCATION;
  const resumePath = process.env.RESUME_PATH;

  const browser = await puppeteer.launch({
    args: ['--no-sandbox','--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  // Use your LinkedIn session cookie
  await page.setCookie({
    name: 'li_at',
    value: LI_AT,
    domain: '.linkedin.com'
  });

  // Go to LinkedIn jobs search with Easy Apply filter
  const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}&f_AL=true`;
  await page.goto(searchUrl, { waitUntil: 'networkidle2' });

  // Grab up to 10 job links
  const jobLinks = await page.$$eval('.jobs-search-results__list-item a.result-card__full-card-link', els =>
    els.map(a => a.href).slice(0, 10)
  );

  let appliedCount = 0;
  for (let url of jobLinks) {
    await page.goto(url, { waitUntil: 'networkidle2' });
    const easyApplyBtn = await page.$('button.jobs-apply-button');
    if (easyApplyBtn) {
      await easyApplyBtn.click();
      await page.waitForSelector('input[type="file"]', { timeout: 5000 });
      const fileInput = await page.$('input[type="file"]');
      await fileInput.uploadFile(resumePath);
      // Click the submit button (label may vary)
      await page.click('button[aria-label="Submit application"]');
      appliedCount++;
      await page.waitForTimeout(2000);
    }
  }

  await browser.close();
  return appliedCount;
}

triggerTelegram(async () => {
  const count = await runEasyApply();
  return `✅ Applied to ${count} jobs.`;
});
