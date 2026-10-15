// Browser smoke check: visits every route at desktop and phone widths, fails on console
// errors or horizontal page overflow, and saves full-page screenshots.
// Usage: node scripts/qa.mjs [baseUrl] [outDir]   (expects `npm run preview` or `npm run dev` running)
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const base = process.argv[2] ?? 'http://localhost:4173/';
const outDir = process.argv[3] ?? 'qa-shots';
mkdirSync(outDir, { recursive: true });

const routes = ['', 'pumping', 'stack', 'chamber', 'manual', 'certificate'];
const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'phone', width: 360, height: 780 },
];

const browser = await chromium.launch();
let failures = 0;
for (const vp of viewports) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  const errors = [];
  page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
  page.on('pageerror', (err) => errors.push(String(err)));
  for (const r of routes) {
    errors.length = 0;
    await page.goto(`${base}#/${r}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    const name = `${vp.name}-${r || 'briefing'}`;
    await page.screenshot({ path: join(outDir, `${name}.png`), fullPage: true });
    const problems = [...errors];
    if (overflow > 1) problems.push(`horizontal overflow of ${overflow}px`);
    console.log(`${problems.length ? 'FAIL' : 'ok  '} ${name}${problems.length ? ' — ' + problems.join(' | ') : ''}`);
    failures += problems.length ? 1 : 0;
  }
  await page.close();
}
await browser.close();
process.exit(failures ? 1 : 0);
