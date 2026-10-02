#!/usr/bin/env node
/**
 * The token-drift and literal-colour gate (SPEC §5.1/§8.8 ③). Three comparisons, in one
 * direction of authority:
 *
 *   1. `src/styles/global.css` — the layer the site loads — against the §5.1 table in
 *      `docs/SPEC.md`, the corpus this build is constructed from, value by value;
 *   2. that §5.1 table against the balsats-docs checkout beside this one, when it is there:
 *      the docs site owns the palette, so a docs change shows up here before it lands;
 *   3. every colour outside the two token blocks — including the `@theme inline` aliases —
 *      must be a `var(--sl-*)` reference, never a second copy of a value.
 *
 * It also reads the built `theme-color` pair back from `dist/index.html` (SPEC §5.3), so the
 * meta tags and the token layer cannot disagree about `--sl-color-black`.
 *
 * Usage:
 *   node --experimental-strip-types scripts/check-tokens.mjs [--root <dir>] [--css <file>]
 *     [--spec <file>] [--docs <balsats-docs dir>]
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { failGate, readText, startGate } from './lib/cli.mjs';
import {
	literalColorIssues,
	parseDocsStylesheet,
	parseLandingTokens,
	parseSpecTable,
	requiredTokens,
	themeColorValues,
	tokenDrift,
} from '../src/lib/brand-tokens.ts';

const { repoRoot, options } = startGate(import.meta.url, process.argv.slice(2), {
	values: ['css', 'spec', 'docs'],
});
const cssFile = path.join(repoRoot, options.css ?? 'src/styles/global.css');
const specFile = path.join(repoRoot, options.spec ?? 'docs/SPEC.md');

const css = readText(cssFile);
if (css === null) {
	console.error(`✗ cannot read the token stylesheet \`${path.relative(repoRoot, cssFile)}\``);
	process.exit(1);
}
const spec = readText(specFile);
if (spec === null) {
	console.error(`✗ cannot read the spec corpus \`${path.relative(repoRoot, specFile)}\``);
	process.exit(1);
}

const landing = parseLandingTokens(css);
const specTable = parseSpecTable(spec);
const hardErrors = [...landing.errors, ...specTable.errors];
if (hardErrors.length > 0) {
	for (const error of hardErrors) console.error(`✗ ${error}`);
	process.exit(1);
}

const issues = tokenDrift(landing.tokens, specTable.tokens, {
	actualLabel: 'src/styles/global.css',
	expectedLabel: 'docs/SPEC.md §5.1',
	slotsFor: (theme) => requiredTokens[theme],
});
for (const issue of issues) console.error(`✗ ${issue}`);
if (issues.length === 0) {
	console.log('✓ token layer matches the §5.1 table in docs/SPEC.md, slot by slot, both themes');
}

const literals = literalColorIssues(css);
for (const issue of literals) console.error(`✗ ${issue}`);
if (literals.length === 0) {
	console.log('✓ no colour literal outside the token blocks — Tailwind aliases are var(--sl-*) references');
}

// The house rule is "docs owns the palette" (SPEC §5.1). The checkout is optional — the §5.1
// table above is the in-repo authority — but an explicitly requested one must be there.
const docsOption = options.docs ?? process.env.BALSATS_DOCS_DIR;
const docsDir = path.resolve(docsOption ?? path.join(repoRoot, '..', 'balsats-docs'));
const docsCssFile = path.join(docsDir, 'src/styles/global.css');

if (existsSync(docsCssFile)) {
	const docsCss = readText(docsCssFile);
	const docsTable = parseDocsStylesheet(docsCss ?? '');
	for (const error of docsTable.errors) console.error(`✗ ${error}`);

	const drift = tokenDrift(specTable.tokens, docsTable.tokens, {
		actualLabel: 'docs/SPEC.md §5.1',
		expectedLabel: `balsats-docs ${path.relative(docsDir, docsCssFile)}`,
	});
	for (const issue of drift) console.error(`✗ ${issue}`);
	if (drift.length === 0 && docsTable.errors.length === 0) {
		console.log('✓ the §5.1 table still matches the balsats-docs token stylesheet (docs owns the palette)');
	}
	issues.push(...docsTable.errors, ...drift);
} else if (docsOption !== undefined) {
	console.error(`✗ --docs ${docsDir} has no src/styles/global.css to compare against`);
	process.exit(1);
} else {
	console.log('· balsats-docs checkout not found beside this repo — the live cross-check is skipped');
}

// theme-color is each theme's resolved --sl-color-black (SPEC §5.3); read it back from the
// build so the meta pair and the stylesheet cannot disagree.
const themeColor = themeColorValues(landing.tokens);
const page = readText(path.join(repoRoot, 'dist/index.html'));
if (page === null) {
	console.error('✗ dist/index.html is missing — `pnpm build` writes it before this gate runs');
	process.exit(1);
}
const metaColorIssues = [];
for (const [scheme, expected] of [['light', themeColor.light], ['dark', themeColor.dark]]) {
	const tag = [...page.matchAll(/<meta\b[^>]*>/gi)]
		.map((match) => match[0])
		.find((html) => /name\s*=\s*["']theme-color["']/i.test(html) && html.includes(`(prefers-color-scheme: ${scheme})`));
	const content = tag?.match(/\bcontent\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
	const value = content?.[1] ?? content?.[2];
	if (value !== expected) {
		metaColorIssues.push(`dist/index.html: the ${scheme} theme-color is ${value ?? 'missing'}, expected ${expected}`);
	}
}
for (const issue of metaColorIssues) console.error(`✗ ${issue}`);
if (metaColorIssues.length === 0) {
	console.log(`✓ theme-color pair matches the token layer (${themeColor.light} / ${themeColor.dark})`);
}

failGate([...issues, ...literals, ...metaColorIssues], {
	summary: 'token-layer problem(s) (SPEC §5.1 — the palette is owned by balsats-docs; do not tune it here).',
	hint: 'Re-run with `--docs <checkout>` to compare against the docs site explicitly.',
});
console.log('\nToken layer: no drift.');
