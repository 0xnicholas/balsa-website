import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
	auditTokens,
	contrastRatio,
	hslToHex,
	literalColorIssues,
	parseLandingTokens,
	parseSpecTable,
	themeColorValues,
	tokenDrift,
} from './brand-tokens.ts';

const globalCss = readFileSync(new URL('../styles/global.css', import.meta.url), 'utf8');
const specMarkdown = readFileSync(new URL('../../docs/SPEC.md', import.meta.url), 'utf8');

const lightAccent = 'hsl(36, 88%, 33%)';
const darkAccentHigh = 'hsl(38, 72%, 78%)';

test('the shipped token layer parses with no errors and carries both themes', () => {
	const { tokens, errors } = parseLandingTokens(globalCss);
	assert.deepEqual(errors, []);

	assert.equal(tokens.light['--sl-color-accent'], lightAccent);
	assert.equal(tokens.dark['--sl-color-accent-high'], darkAccentHigh);
	// 12 §5.1 slots + 3 derived roles + 2 font slots; dark repeats the colour slots (one fewer,
	// no gray-7) and the derived overrides, and inherits the font slots from `:root`.
	assert.equal(Object.keys(tokens.light).length, 17);
	assert.equal(Object.keys(tokens.dark).length, 14);
});

test('the §5.1 table in docs/SPEC.md and the shipped token layer agree slot by slot', () => {
	const landing = parseLandingTokens(globalCss);
	const spec = parseSpecTable(specMarkdown);
	assert.deepEqual(spec.errors, []);

	assert.deepEqual(
		tokenDrift(landing.tokens, spec.tokens, {
			actualLabel: 'global.css',
			expectedLabel: 'SPEC §5.1',
			slotsFor: (theme) => Object.keys(spec.tokens[theme]),
		}),
		[],
	);
});

test('a drifted slot is reported, not rounded away', () => {
	const landing = parseLandingTokens(globalCss);
	const spec = parseSpecTable(specMarkdown);
	const mutated = { ...landing.tokens, light: { ...landing.tokens.light, '--sl-color-accent': 'hsl(36, 88%, 28%)' } };

	const drift = tokenDrift(mutated, spec.tokens, {
		actualLabel: 'global.css',
		expectedLabel: 'SPEC §5.1',
		slotsFor: (theme) => Object.keys(spec.tokens[theme]),
	});
	assert.equal(drift.length, 1);
	assert.match(drift[0]!, /--sl-color-accent \(light\)/);
});

test('derived roles must alias the triplet, not carry a value of their own', () => {
	const mutated = globalCss.replace(
		'--sl-color-text-invert: var(--sl-color-black);',
		'--sl-color-text-invert: hsl(36, 40%, 99%);',
	);
	const { errors } = parseLandingTokens(mutated);
	assert.ok(errors.some((error) => error.includes('--sl-color-text-invert must be')));
});

test('a slot the §5.1 table does not have is an error, not an extension', () => {
	const mutated = globalCss.replace('--sl-font:', '--sl-color-brand: hsl(36, 50%, 50%);\n\t--sl-font:');
	const { errors } = parseLandingTokens(mutated);
	assert.ok(errors.some((error) => error.includes('--sl-color-brand is not part of the §5.1 token set')));
});

test('color literals outside the token blocks are findings; var() aliases are not', () => {
	assert.deepEqual(literalColorIssues(globalCss), []);
	assert.equal(literalColorIssues(`${globalCss}\n.example { color: #ffffff; }`).length, 1);
	assert.equal(literalColorIssues(`${globalCss}\n@theme { --color-x: var(--sl-color-accent); }`).length, 1);
});

test('the audit reports 16 checks and all of them pass on the pinned palette', () => {
	const { tokens } = parseLandingTokens(globalCss);
	const { rows, errors } = auditTokens(tokens);
	assert.deepEqual(errors, []);
	assert.equal(rows.length, 16);
	assert.deepEqual(
		rows.filter((row) => !row.pass).map((row) => row.label),
		[],
	);
});

test('the light accent is the deliberately pinned near-AA value (4.86:1 on the page)', () => {
	const { tokens } = parseLandingTokens(globalCss);
	assert.equal(contrastRatio(lightAccent, tokens.light['--sl-color-black']!).toFixed(2), '4.86');
	assert.equal(contrastRatio(darkAccentHigh, tokens.dark['--sl-color-black']!).toFixed(2), '11.88');
});

test('a darkened accent that clears AA is still a failing audit pair (the pin is the point)', () => {
	const { tokens } = parseLandingTokens(globalCss);
	const mutated = {
		...tokens,
		light: { ...tokens.light, '--sl-color-accent': 'hsl(36, 88%, 28%)', '--sl-color-text-accent': 'var(--sl-color-accent)' },
	};
	const { rows } = auditTokens(mutated);
	// The pair the docs spec pins to 4.6–5.0:1 is measured, not accepted because it is "safer".
	assert.notEqual(rows.find((row) => row.label === 'accent link on page background')?.ratio.toFixed(2), '4.86');
});

test('theme-color is each theme\u2019s resolved --sl-color-black (SPEC §5.3)', () => {
	const { tokens } = parseLandingTokens(globalCss);
	assert.deepEqual(themeColorValues(tokens), { light: '#fdfdfb', dark: '#1d1a16' });
	assert.equal(hslToHex('hsl(36, 40%, 99%)'), '#fdfdfb');
});
