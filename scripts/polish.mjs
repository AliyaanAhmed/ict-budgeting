/**
 * Wraps raw screenshots in a polished browser-mockup card
 * with a LinkedIn-ready gradient background.
 */
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = path.resolve('screenshots');
const OUT_DIR = path.resolve('screenshots/linkedin');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const CARDS = [
  {
    src: '01-respondent-dashboard.png',
    out: 'showcase-respondent.png',
    label: 'Respondent Dashboard',
    sub: 'Submit & track ICT budget projects through the governance cycle',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)',
  },
  {
    src: '02-approver-dashboard.png',
    out: 'showcase-approver.png',
    label: 'Approver Dashboard',
    sub: 'Final DGE gate — review AI-assisted summaries and approve submissions',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #3b1f5e 50%, #6d28d9 100%)',
  },
  {
    src: '03-reviewer-dashboard.png',
    out: 'showcase-reviewer.png',
    label: 'Reviewer Dashboard',
    sub: 'Validate queue items, send clarifications, and route projects to approval',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #14413a 50%, #0f766e 100%)',
  },
];

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox'],
  defaultViewport: { width: 1400, height: 900, deviceScaleFactor: 2 },
});

const page = await browser.newPage();

for (const card of CARDS) {
  const imgPath = path.join(SCREENSHOTS_DIR, card.src);
  const imgData = fs.readFileSync(imgPath).toString('base64');
  const dataUri = `data:image/png;base64,${imgData}`;

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1400px; height: 900px;
    display: flex; align-items: center; justify-content: center;
    background: ${card.gradient};
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    overflow: hidden;
  }
  .card {
    display: flex;
    flex-direction: column;
    width: 1160px;
    filter: drop-shadow(0 32px 80px rgba(0,0,0,0.55));
  }
  /* browser chrome */
  .chrome {
    background: #1e2433;
    border-radius: 12px 12px 0 0;
    padding: 12px 16px 10px;
    display: flex;
    align-items: center;
    gap: 12px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
  }
  .dots { display: flex; gap: 6px; }
  .dot {
    width: 12px; height: 12px; border-radius: 50%;
  }
  .dot-r { background: #ff5f57; }
  .dot-y { background: #febc2e; }
  .dot-g { background: #28c840; }
  .urlbar {
    flex: 1;
    background: rgba(255,255,255,0.07);
    border-radius: 6px;
    padding: 5px 12px;
    font-size: 12px;
    color: rgba(255,255,255,0.45);
    letter-spacing: 0.02em;
  }
  /* screenshot */
  .screen {
    width: 100%;
    display: block;
    border-radius: 0 0 12px 12px;
    overflow: hidden;
    line-height: 0;
  }
  .screen img {
    width: 100%;
    display: block;
    border-radius: 0 0 12px 12px;
  }
  /* label strip below card */
  .meta {
    margin-top: 28px;
    text-align: center;
    color: #fff;
  }
  .meta-title {
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.02em;
    opacity: 0.97;
    margin-bottom: 6px;
  }
  .meta-sub {
    font-size: 14px;
    opacity: 0.55;
    font-weight: 400;
    max-width: 680px;
    margin: 0 auto;
    line-height: 1.5;
  }
  .badge {
    display: inline-block;
    margin-top: 14px;
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.15);
    backdrop-filter: blur(8px);
    color: rgba(255,255,255,0.7);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 4px 14px;
    border-radius: 100px;
  }
</style>
</head>
<body>
  <div style="display:flex;flex-direction:column;align-items:center;">
    <div class="card">
      <div class="chrome">
        <div class="dots">
          <div class="dot dot-r"></div>
          <div class="dot dot-y"></div>
          <div class="dot dot-g"></div>
        </div>
        <div class="urlbar">ICT Budgeting 2026 &nbsp;·&nbsp; ${card.label}</div>
      </div>
      <div class="screen">
        <img src="${dataUri}" />
      </div>
    </div>
    <div class="meta">
      <div class="meta-title">${card.label}</div>
      <div class="meta-sub">${card.sub}</div>
      <div class="badge">ICT Budgeting 2026</div>
    </div>
  </div>
</body>
</html>`;

  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 300));

  const outFile = path.join(OUT_DIR, card.out);
  await page.screenshot({ path: outFile, fullPage: false });
  console.log(`Polished → ${outFile}`);
}

await browser.close();
console.log('\nLinkedIn-ready images are in ./screenshots/linkedin/');
