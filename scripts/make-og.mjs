#!/usr/bin/env node
/**
 * The one-off OG-card generator (SPEC §5.3). It renders the single static 1200×630 card —
 * warm paper, the wordmark and the public tagline — with the system's Chrome in headless mode
 * and writes `public/og.png`. The PNG is the artifact and is committed; this script exists so
 * the card can be regenerated when the wordmark, the tagline or the palette moves.
 *
 * It is deliberately outside `pnpm verify` and outside the dependency tree: no image library,
 * no build-time OG generation (SPEC §8.7-C keeps per-page OG out of this effort). The card's
 * colours and copy are read from the site's own sources — `src/styles/global.css` (light
 * theme) and `src/lib/brand.ts` (wordmark, tagline) — so the card cannot drift from the site.
 *
 * Usage:
 *   node --experimental-strip-types scripts/make-og.mjs [--out public/og.png]
 *     [--chrome "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"]
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pngSize } from '../src/lib/asset-rules.ts';
import { publicTagline, wordmark } from '../src/lib/brand.ts';
import { parseLandingTokens } from '../src/lib/brand-tokens.ts';
import { parseArgs } from './lib/cli.mjs';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const { options, errors } = parseArgs(process.argv.slice(2), { values: ['out', 'chrome'] });
if (errors.length > 0) {
	for (const error of errors) console.error(`✗ ${error}`);
	process.exit(2);
}

const out = path.resolve(repoRoot, options.out ?? 'public/og.png');
const chrome =
	options.chrome ?? process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

if (!existsSync(chrome)) {
	console.error(`✗ no Chrome at ${chrome} — pass --chrome <path> or set CHROME`);
	process.exit(1);
}

// The card is the light theme on warm paper (SPEC §5.1/§5.3): the values come out of the token
// layer, so a palette change reaches the card the next time it is rendered.
const parsed = parseLandingTokens(readFileSync(path.join(repoRoot, 'src/styles/global.css'), 'utf8'));
if (parsed.errors.length > 0) {
	console.error(`✗ src/styles/global.css is not a valid brand token layer:\n${parsed.errors.join('\n')}`);
	process.exit(1);
}
const light = parsed.tokens.light;

const html = `<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<style>
			* { margin: 0; }
			body {
				box-sizing: border-box;
				width: 1200px;
				height: 630px;
				padding: 96px;
				display: flex;
				flex-direction: column;
				justify-content: center;
				gap: 32px;
				overflow: hidden;
				background: ${light['--sl-color-black']};
				color: ${light['--sl-color-white']};
				font-family: ${light['--sl-font']};
			}
			.rule { width: 96px; height: 10px; border-radius: 5px; background: ${light['--sl-color-accent']}; }
			.wordmark { font-size: 96px; font-weight: 700; letter-spacing: -0.03em; }
			.tagline { max-width: 920px; font-size: 34px; line-height: 1.45; color: ${light['--sl-color-gray-2']}; }
		</style>
	</head>
	<body>
		<div class="rule"></div>
		<div class="wordmark">${wordmark}</div>
		<p class="tagline">${publicTagline}</p>
	</body>
</html>
`;

const scratch = mkdtempSync(path.join(tmpdir(), 'balsats-og-'));
const page = path.join(scratch, 'card.html');
writeFileSync(page, html);

const render = spawnSync(
	chrome,
	[
		'--headless=new',
		'--disable-gpu',
		'--hide-scrollbars',
		'--force-device-scale-factor=1',
		'--window-size=1200,630',
		`--screenshot=${out}`,
		`file://${page}`,
	],
	{ stdio: 'inherit' },
);
rmSync(scratch, { recursive: true, force: true });

if (render.status !== 0) {
	console.error(`✗ Chrome exited with ${render.status ?? render.signal}`);
	process.exit(1);
}

const size = pngSize(readFileSync(out));
if (size === null || size.width !== 1200 || size.height !== 630) {
	console.error(`✗ ${path.relative(repoRoot, out)} is not a 1200×630 PNG (${size ? `${size.width}×${size.height}` : 'not a PNG'})`);
	process.exit(1);
}

console.log(`✓ ${path.relative(repoRoot, out)} — ${size.width}×${size.height}`);
