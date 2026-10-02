// throwaway check: variant switching, theme flip, headline chips, no console errors
import { chromium } from '/Users/nicholasl/.nvm/versions/node/v26.2.0/lib/node_modules/playwright/index.mjs';
import { mkdirSync } from 'node:fs';

const errors = [];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push(String(e)));

const url = 'file://' + process.cwd() + '/index.html';
mkdirSync('.screenshots', { recursive: true });

const bg = async () => { await page.waitForTimeout(250); return page.evaluate(() => getComputedStyle(document.body).backgroundColor); };

for (const v of ['a', 'b', 'c', 'd']) {
  await page.goto(url + '?variant=' + v);
  const h0 = await page.locator(`#v-${v} [data-h]`).innerText();
  console.log(`variant ${v}: headline="${h0.slice(0, 40)}…"`);
  for (const theme of ['dark', 'light']) {
    await page.click('[data-action="theme"]');
    const got = await bg();
    console.log(`  theme -> ${theme}: bg=${got}`);
    await page.screenshot({ path: `.screenshots/v-${v}-${theme}.png`, fullPage: true });
  }
  // headline chip swap: press the H4 chip, expect the h1 to change
  const chip = page.locator(`#v-${v} .copychip`, { hasText: 'H4' }).first();
  await chip.click();
  const h1 = await page.locator(`#v-${v} [data-h]`).innerText();
  console.log(`  chip H4 -> "${h1.slice(0, 40)}…" ${h1 !== h0 ? 'OK (swap)' : 'MISMATCH (no swap)'}`);
  await chip.click(); // aria-pressed stays true; click again keeps H4 — just verify no crash
}

// keyboard cycling from a
await page.goto(url + '?variant=a');
await page.keyboard.press('ArrowRight');
const v = await page.evaluate(() => document.body.dataset.variant);
console.log('arrow key -> variant=' + v + (v === 'b' ? ' OK' : ' MISMATCH'));

await browser.close();
console.log(errors.length ? 'CONSOLE ERRORS:\n' + errors.join('\n') : 'no console errors');
