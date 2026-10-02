// throwaway check: variant switching applies tokens, theme toggle works, no console errors
import { chromium } from '/Users/nicholasl/.nvm/versions/node/v26.2.0/lib/node_modules/playwright/index.mjs';
const errors = [];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push(String(e)));

const url = 'file://' + process.cwd() + '/index.html';
const bg = async () => { await page.waitForTimeout(400); return page.evaluate(() => getComputedStyle(document.body).backgroundColor); };

const cases = ['a', 'b', 'c'];
for (const v of cases) {
  await page.goto(url + '?variant=' + v);
  const got = await bg();
  console.log(`variant ${v}: default bg=${got}`);
  await page.click(`#v-${v} [data-action="theme"]`);
  const flipped = await bg();
  console.log(`  toggle -> ${flipped} ${flipped !== got ? 'OK (flip)' : 'MISMATCH (no flip)'}`);
  await page.click(`#v-${v} [data-action="theme"]`);
  const back = await bg();
  console.log(`  toggle back -> ${back} ${back === got ? 'OK' : 'MISMATCH'}`);
}
// tabs in A
await page.goto(url + '?variant=a');
await page.click('#v-a .tabbar button[data-tab="a-mcp"]');
const visible = await page.evaluate(() => {
  const p = document.getElementById('a-mcp');
  return getComputedStyle(p).display;
});
console.log('A tab switch -> MCP panel display=' + visible + (visible === 'block' ? ' OK' : ' MISMATCH'));
// token chips rendered
await page.waitForTimeout(300);
const chips = await page.evaluate(() => document.querySelectorAll('#v-a [data-tokens] .chip').length);
console.log('token chips: ' + chips + (chips >= 6 ? ' OK' : ' MISMATCH'));
// keyboard cycling
await page.keyboard.press('ArrowRight');
const v = await page.evaluate(() => document.body.dataset.variant);
console.log('arrow key -> variant=' + v + (v === 'b' ? ' OK' : ' MISMATCH'));
await browser.close();
console.log(errors.length ? 'CONSOLE ERRORS:\n' + errors.join('\n') : 'no console errors');
