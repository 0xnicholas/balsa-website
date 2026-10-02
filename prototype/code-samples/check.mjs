// throwaway check: form/hero/trace switching, copy buttons, chips, no console errors
import { chromium } from '/Users/nicholasl/.nvm/versions/node/v26.2.0/lib/node_modules/playwright/index.mjs';
import { mkdirSync } from 'node:fs';

const errors = [];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));

const url = 'file://' + process.cwd() + '/index.html';
mkdirSync('.screenshots', { recursive: true });

for (const v of ['a', 'b', 'c', 'd']) {
  await page.goto(`${url}?variant=${v}&hero=h1&trace=mock`);
  const claim = await page.locator('#panel-agents .claim').innerText();
  await page.locator('#tabbar .tab', { hasText: 'MCP' }).click();
  const filetabs = await page.locator('#panel-mcp .filetab').count();
  await page.locator('#tabbar .tab', { hasText: 'Workflows' }).click();
  const notes = await page.locator('#panel-workflows .notes li').count();
  await page.locator('#tabbar .tab', { hasText: 'Memory' }).click();
  const outs = await page.locator('#panel-memory .out').count();
  const chips = await page.locator('#panel-obs .chip').count();
  await page.locator('#tabbar .tab', { hasText: 'Agents' }).click();
  const chipsInPanel = await page.locator('#panel-agents .chip').count();
  console.log(`form ${v}: claim="${claim.slice(0, 36)}…" filetabs=${filetabs} chips=${chipsInPanel} notes=${notes} outs=${outs}`);
  if (v === 'a' && filetabs < 2) console.log('  MISMATCH: variants a should show file tabs');
  if (v === 'c' && chipsInPanel === 0) console.log('  MISMATCH: variant c should show import chips');
  if (v === 'b' && notes === 0) console.log('  MISMATCH: variant b should show notes');
  if (v === 'd' && outs === 0) console.log('  MISMATCH: variant d should show output panes');

  // file-tab switching in form a
  if (v === 'a') {
    await page.locator('#tabbar .tab', { hasText: 'MCP' }).click();
    await page.locator('#panel-mcp .filetab', { hasText: 'client.ts' }).click();
    const now = await page.locator('#panel-mcp .filetab[aria-selected="true"]').innerText();
    console.log(`  file tab -> ${now}${now === 'client.ts' ? ' OK' : ' MISMATCH'}`);
    await page.locator('#tabbar .tab', { hasText: 'Agents' }).click();
  }
  for (const theme of ['light', 'dark']) {
    await page.click('[data-action="theme"]');
    await page.waitForTimeout(150);
    await page.screenshot({ path: `.screenshots/form-${v}-${theme}.png`, fullPage: true });
  }
}

// hero candidates + trace provenance
for (const [h, t] of [['h1', 'mock'], ['h1', 'real'], ['h2', 'real'], ['h3', 'real']]) {
  await page.goto(`${url}?variant=b&hero=${h}&trace=${t}`);
  const file = await page.locator('#herofile').innerText();
  const rows = await page.locator('#herotrace .trow').count();
  const src = await page.locator('#herotrace .srcnote').innerText();
  console.log(`hero ${h} / trace ${t}: file=${file} rows=${rows} src="${src.slice(0, 34)}…"`);
  await page.screenshot({ path: `.screenshots/hero-${h}-${t}.png`, fullPage: true });
}

// copy button sanity (clipboard may be blocked on file://, so just assert the handler ran)
await page.goto(`${url}?variant=b`);
await page.locator('#copyquick').click();
await page.waitForTimeout(300);
const heroCopy = await page.locator('#copyquick').innerText();
console.log(`copy quick start -> "${heroCopy}"${heroCopy.includes('copied') ? ' OK' : ' (fallback)'}`);

// keyboard cycling
await page.goto(`${url}?variant=a`);
await page.keyboard.press('ArrowRight');
const v = await page.evaluate(() => document.body.dataset.variant);
console.log(`arrow key -> variant=${v}${v === 'b' ? ' OK' : ' MISMATCH'}`);

// content guards: forbidden strings must not appear in the rendered page (script/comments excluded)
const html = await page.innerText('body');
for (const bad of ['npm install', 'pnpm add', 'git clone']) {
  const hit = html.includes(bad);
  console.log(`guard "${bad}": ${hit ? 'FOUND (check!)' : 'absent OK'}`);
}
console.log(`guard RAG: ${/\bRAG\b/.test(html) ? 'FOUND (check!)' : 'absent OK'}`);
console.log(`guard evals (informational): ${(html.match(/evals/g) ?? []).length} occurrence(s)`);
console.log(`stale scope @balsa/*: ${html.includes('@balsa/') ? 'FOUND (check!)' : 'absent OK'}`);

await browser.close();
console.log(errors.length ? 'CONSOLE ERRORS:\n' + errors.join('\n') : 'no console errors');
