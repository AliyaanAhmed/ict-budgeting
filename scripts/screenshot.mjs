import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5174';
const OUT_DIR = path.resolve('screenshots');

const ROUTES = [
  { name: '01-respondent-dashboard', path: '/#/respondent/dashboard', wait: 1500 },
  { name: '02-approver-dashboard',   path: '/#/approver/dashboard',   wait: 1500 },
  { name: '03-reviewer-dashboard',   path: '/#/reviewer/dashboard',   wait: 1500 },
];

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--force-dark-mode'],
  defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
});

const page = await browser.newPage();

// Dismiss any auth guard — log in if needed, or just capture what loads
for (const route of ROUTES) {
  const url = `${BASE_URL}${route.path}`;
  console.log(`Capturing ${url} ...`);
  try {
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });
  } catch {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
  }
  await new Promise(r => setTimeout(r, route.wait));

  // Dismiss the Dataverse Debug Modal (shadcn Dialog auto-opens on mount)
  try {
    // Wait for the close button to appear
    await page.waitForSelector('[role="dialog"] button[aria-label="Close"]', { timeout: 3000 });
    await page.click('[role="dialog"] button[aria-label="Close"]');
    await new Promise(r => setTimeout(r, 600));
  } catch {
    // Fallback: press Escape
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 600));
  }

  const file = path.join(OUT_DIR, `${route.name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  saved → ${file}`);
}

await browser.close();
console.log('\nDone! Raw screenshots are in ./screenshots/');
