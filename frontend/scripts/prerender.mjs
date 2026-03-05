/**
 * Post-build prerender script for static pages.
 *
 * Usage: node scripts/prerender.mjs
 *
 * Spins up a local server on the built dist/, opens each route in headless
 * Chrome, captures the fully-rendered HTML, and writes it back to dist/.
 * This gives crawlers real content instead of an empty <div id="root">.
 */

import { createServer } from 'http';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const DIST = join(__dirname, '..', 'dist');
const PORT = 4173;

// Only prerender truly static pages (no API dependency)
const ROUTES = ['/about', '/privacy', '/terms'];

// Find Chrome executable
function findChrome() {
  const candidates = [
    // CI (ubuntu)
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    // macOS
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    // Windows
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  // Fallback: try CHROME_PATH env
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }
  return null;
}

// Minimal static file server for dist/
const MIME = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff',
};

function startServer() {
  const fallback = readFileSync(join(DIST, 'index.html'));
  const server = createServer((req, res) => {
    const url = req.url.split('?')[0];
    const filePath = join(DIST, url === '/' ? 'index.html' : url);
    try {
      const data = readFileSync(filePath);
      const ext = extname(filePath);
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      res.end(data);
    } catch {
      // SPA fallback
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(fallback);
    }
  });
  return new Promise(resolve => server.listen(PORT, () => resolve(server)));
}

async function main() {
  const chromePath = findChrome();
  if (!chromePath) {
    console.log('⚠ Chrome not found, skipping prerender. Set CHROME_PATH env to fix.');
    process.exit(0); // non-fatal — build still succeeds
  }

  console.log(`Using Chrome: ${chromePath}`);
  const server = await startServer();
  console.log(`Server running on http://localhost:${PORT}`);

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  for (const route of ROUTES) {
    const page = await browser.newPage();
    await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: 'networkidle0', timeout: 15000 });

    // Wait a bit for react-helmet-async to update <head>
    await page.evaluate(() => new Promise(r => setTimeout(r, 300)));

    const html = await page.content();
    const dir = join(DIST, route);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'index.html'), html);
    console.log(`✓ ${route}`);
    await page.close();
  }

  await browser.close();
  server.close();
  console.log('Prerender done.');
}

main().catch(err => {
  console.error('Prerender failed:', err.message);
  process.exit(0); // non-fatal
});
