/**
 * The brand token layer's only reader, and the rules the CI gates run over it (SPEC §5.1/§5.5).
 * `src/styles/global.css` is the single source of truth for the warm-wood palette; the contrast
 * audit (`scripts/check-contrast.mjs`), the drift audit (`scripts/check-tokens.mjs`) and the
 * `theme-color` pair all go through this module, so the gates and the shipped page cannot
 * disagree about what a token means.
 *
 * Two contracts the spec pins and this module enforces:
 *
 *  1. **The §5.1 table is complete and byte-identical.** A missing slot is an error, not a
 *     silent fallback; a value that drifts from the balsats-docs authority is drift, not a
 *     tweak. The derived roles (`--sl-color-text-accent` / `-text-invert` / `-bg-accent`) are
 *     the exception to "do not hand-write": landing has no Starlight, so §5.1 materializes the
 *     upstream mapping — as a reference to the accent triplet, never as a value of its own.
 *  2. **AA holds.** §5.5 reduces the palette to 8 rendered pairs × 2 themes; each pair is
 *     checked against WCAG AA (4.5:1) with the contrast maths below.
 */

export type Theme = 'light' | 'dark';
/** Token name → declared value, e.g. `--sl-color-accent` → `hsl(36, 82%, 55%)`. */
export type TokenSet = Record<string, string>;

/** The slots §5.1 hands over per theme; light adds `--sl-color-gray-7` (no dark slot). */
export const requiredTokens = {
	light: [
		'--sl-color-white',
		'--sl-color-gray-1',
		'--sl-color-gray-2',
		'--sl-color-gray-3',
		'--sl-color-gray-4',
		'--sl-color-gray-5',
		'--sl-color-gray-6',
		'--sl-color-gray-7',
		'--sl-color-black',
		'--sl-color-accent-low',
		'--sl-color-accent',
		'--sl-color-accent-high',
	],
	dark: [
		'--sl-color-white',
		'--sl-color-gray-1',
		'--sl-color-gray-2',
		'--sl-color-gray-3',
		'--sl-color-gray-4',
		'--sl-color-gray-5',
		'--sl-color-gray-6',
		'--sl-color-black',
		'--sl-color-accent-low',
		'--sl-color-accent',
		'--sl-color-accent-high',
	],
} as const satisfies Record<Theme, readonly string[]>;

/** The three roles §5.1 materializes on landing. */
export const derivedRoles = [
	'--sl-color-text-accent',
	'--sl-color-text-invert',
	'--sl-color-bg-accent',
] as const;
export type DerivedRole = (typeof derivedRoles)[number];

/** The token each derived role must alias, per theme. */
export const derivedRoleSources: Record<Theme, Record<DerivedRole, string>> = {
	light: {
		'--sl-color-text-accent': '--sl-color-accent',
		'--sl-color-text-invert': '--sl-color-black',
		'--sl-color-bg-accent': '--sl-color-accent',
	},
	dark: {
		'--sl-color-text-accent': '--sl-color-accent-high',
		'--sl-color-text-invert': '--sl-color-accent-low',
		'--sl-color-bg-accent': '--sl-color-accent-high',
	},
};

/** The font slots §5.2 keeps open — declared, but never pointing at a file or a host. */
export const fontSlots = ['--sl-font', '--sl-font-mono'] as const;

/* ---------------------------------------------------------------- reading the layer */

/** Comments first: a `{` inside one would derail the block scan. */
export function stripComments(css: string): string {
	return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/** Every `--name: value;` declaration of a block body, in document order. */
export function declarationsOf(body: string): Array<[string, string]> {
	return [...body.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)].map((match) => [
		match[1]!,
		match[2]!.trim(),
	]);
}

/** The body of the first block whose prelude matches `prelude`, by brace matching. */
function blockAfter(css: string, prelude: RegExp): { body: string; start: number; end: number } | null {
	const match = prelude.exec(css);
	if (match === null) return null;

	const open = css.indexOf('{', match.index + match[0].length - 1);
	if (open === -1) return null;

	let depth = 0;
	for (let index = open; index < css.length; index += 1) {
		if (css[index] === '{') depth += 1;
		else if (css[index] === '}') {
			depth -= 1;
			if (depth === 0) return { body: css.slice(open + 1, index), start: match.index, end: index + 1 };
		}
	}
	return null;
}

/**
 * The two theme regions of `src/styles/global.css`: light is the default on `:root`, dark
 * lives inside `@media (prefers-color-scheme: dark)` (SPEC §5.4 — the OS is the only switch).
 */
export function splitThemeRegions(css: string): { light: string; dark: string } {
	const stripped = stripComments(css);
	const dark = blockAfter(stripped, /@media[^{]*prefers-color-scheme:\s*dark[^{]*\{/);
	if (dark === null) return { light: stripped, dark: '' };
	return {
		light: stripped.slice(0, dark.start) + stripped.slice(dark.end),
		dark: dark.body,
	};
}

/** The declarations of every `:root { … }` block in a region, merged. */
function rootDeclarations(region: string): { values: TokenSet; errors: string[] } {
	const values: TokenSet = {};
	const errors: string[] = [];

	for (const match of region.matchAll(/:root\s*\{([^{}]*)\}/g)) {
		for (const [name, value] of declarationsOf(match[1]!)) {
			if (!name.startsWith('--sl-color-') && !(fontSlots as readonly string[]).includes(name)) continue;
			if (name in values) {
				errors.push(`${name} is declared twice in the same theme block`);
				continue;
			}
			values[name] = value;
		}
	}

	return { values, errors };
}

/**
 * Read the landing token layer. `light` is the default region, `dark` the media block; the
 * result is the set of `--sl-color-*` values plus the font slots, per theme.
 */
export function parseLandingTokens(css: string): { tokens: Record<Theme, TokenSet>; errors: string[] } {
	const regions = splitThemeRegions(css);
	const tokens: Record<Theme, TokenSet> = { light: {}, dark: {} };
	const errors: string[] = [];

	for (const theme of ['light', 'dark'] as const) {
		const parsed = rootDeclarations(regions[theme]);
		tokens[theme] = parsed.values;
		errors.push(...parsed.errors.map((error) => `${theme}: ${error}`));

		const allowed = new Set<string>([...requiredTokens[theme], ...derivedRoles, ...fontSlots]);

		for (const name of requiredTokens[theme]) {
			if (!(name in tokens[theme])) errors.push(`the ${theme} token block is missing ${name} (SPEC §5.1)`);
		}
		for (const name of derivedRoles) {
			const value = tokens[theme][name];
			if (value === undefined) {
				errors.push(`the ${theme} token block is missing the derived role ${name} (SPEC §5.1)`);
			} else if (value !== `var(${derivedRoleSources[theme][name]})`) {
				errors.push(
					`${name} must be \`var(${derivedRoleSources[theme][name]})\` in ${theme}, found \`${value}\` — derived roles alias the triplet, never a value of their own (SPEC §5.1)`,
				);
			}
		}
		for (const [name, value] of Object.entries(tokens[theme])) {
			if (!allowed.has(name)) {
				errors.push(`${name} is not part of the §5.1 token set — landing invents no slots`);
			} else if (
				name.startsWith('--sl-color-') &&
				!(derivedRoles as readonly string[]).includes(name) &&
				parseHsl(value) === null
			) {
				errors.push(`${name} in the ${theme} token block is not an hsl() triplet: \`${value}\``);
			}
		}
		for (const slot of fontSlots) {
			const value = tokens[theme][slot];
			if (value !== undefined && /url\(|@|https?:/i.test(value)) {
				errors.push(`${slot} points at a file or a host (\`${value}\`) — the site ships the system stack (SPEC §5.2)`);
			}
		}
	}

	return { tokens, errors };
}

/* ---------------------------------------------------------------- the other two readers */

/** The §5.1 token table as written in `docs/SPEC.md` — the table this build is constructed from. */
export function parseSpecTable(markdown: string): { tokens: Record<Theme, TokenSet>; errors: string[] } {
	const block = [...markdown.matchAll(/```css\s*\n([\s\S]*?)```/g)]
		.map((match) => match[1]!)
		.find((body) => body.includes('--sl-color-accent-high'));

	if (block === undefined) {
		return { tokens: { light: {}, dark: {} }, errors: ['docs/SPEC.md carries no ```css token table (SPEC §5.1)'] };
	}

	const darkIndex = block.search(/\/\*\s*dark/);
	const lightIndex = block.search(/\/\*\s*light/);
	if (darkIndex === -1 || lightIndex === -1 || darkIndex > lightIndex) {
		return {
			tokens: { light: {}, dark: {} },
			errors: [`the §5.1 token table must mark its two blocks with \`/* dark */\` and \`/* light */\``],
		};
	}

	const sections: Record<Theme, string> = {
		dark: block.slice(darkIndex, lightIndex),
		light: block.slice(lightIndex),
	};

	const tokens: Record<Theme, TokenSet> = { light: {}, dark: {} };
	for (const theme of ['light', 'dark'] as const) {
		for (const [name, value] of declarationsOf(sections[theme])) {
			if (name.startsWith('--sl-color-')) tokens[theme][name] = value;
		}
	}

	return { tokens, errors: [] };
}

/**
 * The balsats-docs token layer, when the checkout is beside this one: `:root` is Starlight's
 * dark default and `:root[data-theme='light']` is the light block (the same shape the docs
 * repo's own `scripts/check-contrast.mjs` parses).
 */
export function parseDocsStylesheet(css: string): { tokens: Record<Theme, TokenSet>; errors: string[] } {
	const stripped = stripComments(css);
	const tokens: Record<Theme, TokenSet> = { light: {}, dark: {} };
	const errors: string[] = [];

	const dark = blockAfter(stripped, /(?:^|[};\s]):root\s*\{/);
	if (dark === null) {
		errors.push('the docs stylesheet declares no `:root` (dark) token block');
	} else {
		for (const [name, value] of declarationsOf(dark.body)) {
			if (name.startsWith('--sl-color-')) tokens.dark[name] = value;
		}
	}

	const light = blockAfter(stripped, /:root\[data-theme=(['"])light\1\]\s*\{/);
	if (light === null) {
		errors.push('the docs stylesheet declares no `:root[data-theme=\'light\']` token block');
	} else {
		for (const [name, value] of declarationsOf(light.body)) {
			if (name.startsWith('--sl-color-')) tokens.light[name] = value;
		}
	}

	return { tokens, errors };
}

/* ---------------------------------------------------------------- comparisons */

/**
 * Per-slot value drift between two token sets, as human-readable lines. `slotsFor` scopes the
 * comparison: the §5.1 table holds the colour slots only, so the landing's derived roles and
 * font slots are compared against their own rules, not against a table that never had them.
 */
export function tokenDrift(
	actual: Record<Theme, TokenSet>,
	expected: Record<Theme, TokenSet>,
	{
		actualLabel,
		expectedLabel,
		slotsFor,
	}: {
		actualLabel: string;
		expectedLabel: string;
		slotsFor?: (theme: Theme) => readonly string[];
	},
): string[] {
	const issues: string[] = [];

	for (const theme of ['light', 'dark'] as const) {
		const names = slotsFor
			? [...slotsFor(theme)]
			: [...new Set([...Object.keys(actual[theme]), ...Object.keys(expected[theme])])];
		for (const name of [...names].sort()) {
			const found = actual[theme][name];
			const wanted = expected[theme][name];
			if (found === wanted) continue;
			issues.push(
				`${name} (${theme}): ${actualLabel} has ${found ?? 'no declaration'}, ${expectedLabel} has ${wanted ?? 'no declaration'}`,
			);
		}
	}

	return issues;
}

/**
 * Colour literals outside the token blocks, and `@theme` aliases that do not point back at a
 * token (SPEC §5.1: Tailwind only aliases `var(--sl-color-*)` — no second copy of a value).
 */
export function literalColorIssues(css: string): string[] {
	const issues: string[] = [];
	const stripped = stripComments(css);
	const regions = splitThemeRegions(stripped);
	const remainder = regions.light.replace(/:root\s*\{[^{}]*\}/g, '');

	for (const match of remainder.matchAll(/#[0-9a-f]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|oklch|oklab|lch|lab|color)\s*\(/gi)) {
		issues.push(`\`${match[0]}\` outside the token blocks — colours are declared once, as §5.1 tokens`);
	}

	for (const match of remainder.matchAll(/@theme([^{]*)\{([^{}]*)\}/g)) {
		const modifier = match[1]!.trim();
		if (modifier !== 'inline') {
			issues.push(`\`@theme${modifier ? ` ${modifier}` : ''}\` — the alias block is \`@theme inline\` (SPEC §5.1)`);
		}
		for (const [name, value] of declarationsOf(match[2]!)) {
			if (!/^var\(--sl-[a-z0-9-]+\)$/.test(value)) {
				issues.push(`\`${name}: ${value}\` — a Tailwind alias must be a \`var(--sl-*)\` reference (SPEC §5.1)`);
			}
		}
	}

	return issues;
}

/* ---------------------------------------------------------------- colour maths */

export type Hsl = { h: number; s: number; l: number };

/** `hsl(36, 82%, 55%)` and the comma-free modern form; the §5.1 table uses the former. */
export function parseHsl(value: string): Hsl | null {
	const match = value
		.trim()
		.match(/^hsl\(\s*(\d+(?:\.\d+)?)(?:,|\s)\s*(\d+(?:\.\d+)?)%(?:,|\s)\s*(\d+(?:\.\d+)?)%\s*\)$/i);
	if (!match) return null;
	return { h: Number(match[1]), s: Number(match[2]), l: Number(match[3]) };
}

function rgbChannels({ h, s, l }: Hsl): [number, number, number] {
	const saturation = s / 100;
	const lightness = l / 100;
	const k = (n: number) => (n + h / 30) % 12;
	const a = saturation * Math.min(lightness, 1 - lightness);
	const f = (n: number) => lightness - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
	return [f(0), f(8), f(4)].map((channel) => Math.round(channel * 255)) as [number, number, number];
}

/** WCAG 2.1 relative luminance of an `hsl()` value, computed on the 8-bit channels. */
export function relativeLuminance(value: string): number {
	const hsl = parseHsl(value);
	if (hsl === null) throw new Error(`not an hsl() value: ${value}`);
	const [r, g, b] = rgbChannels(hsl).map((channel) => {
		const c = channel / 255;
		return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

/** WCAG 2.1 contrast ratio between two `hsl()` values. */
export function contrastRatio(a: string, b: string): number {
	const [first, second] = [relativeLuminance(a), relativeLuminance(b)];
	const [high, low] = first > second ? [first, second] : [second, first];
	return (high + 0.05) / (low + 0.05);
}

/** `#rrggbb` of an `hsl()` value — the shape `theme-color` meta tags need (SPEC §5.3). */
export function hslToHex(value: string): string {
	const hsl = parseHsl(value);
	if (hsl === null) throw new Error(`not an hsl() value: ${value}`);
	return `#${rgbChannels(hsl)
		.map((channel) => channel.toString(16).padStart(2, '0'))
		.join('')}`;
}

/* ---------------------------------------------------------------- the AA audit */

/**
 * The role map the audit renders: Starlight's own mapping read at the docs site (#19 there),
 * with the docs' sidebar face becoming the landing's nav/footer face (SPEC §5.5). The landing
 * derives its three roles as `var(…)` references, so each is resolved against the theme's own
 * tokens before it is measured — the audit reads what the browser would compute.
 */
function renderingRoles(theme: Theme, tokens: TokenSet) {
	const resolve = (value: string | undefined): string | undefined => {
		const match = value?.match(/^var\((--sl-[a-z0-9-]+)\)$/);
		return match ? tokens[match[1]!] : value;
	};

	return {
		page: tokens['--sl-color-black']!,
		surface: theme === 'dark' ? tokens['--sl-color-gray-6']! : tokens['--sl-color-gray-7']!,
		link: resolve(tokens['--sl-color-text-accent']),
		invert: resolve(tokens['--sl-color-text-invert']),
		accentBackground: resolve(tokens['--sl-color-bg-accent']),
	};
}

/** WCAG AA for normal text; §5.5 audits exactly these rendered pairs, and the slice gates reuse it. */
export const AA = 4.5;

export type AuditRow = {
	theme: Theme;
	label: string;
	fg: string;
	bg: string;
	ratio: number;
	min: number;
	pass: boolean;
};

/** The 8 pairs §5.5 enumerates — body / headings / link × page & nav-footer, chip, button, muted. */
function auditPairs(theme: Theme, tokens: TokenSet) {
	const role = renderingRoles(theme, tokens);
	return [
		{ label: 'body text on page background', fg: tokens['--sl-color-gray-2']!, bg: role.page },
		{ label: 'body text on nav/footer surface', fg: tokens['--sl-color-gray-2']!, bg: role.surface },
		{ label: 'headings on page background', fg: tokens['--sl-color-white']!, bg: role.page },
		{ label: 'accent link on page background', fg: role.link, bg: role.page },
		{ label: 'accent link on nav/footer surface', fg: role.link, bg: role.surface },
		{ label: 'accent text on accent-low chip', fg: tokens['--sl-color-accent-high']!, bg: tokens['--sl-color-accent-low']! },
		{ label: 'inverted label on accent button', fg: role.invert, bg: role.accentBackground },
		{ label: 'muted meta text on page background', fg: tokens['--sl-color-gray-3']!, bg: role.page },
	];
}

/** Run §5.5 over both themes: 8 pairs × 2 themes = the 16 checks the CI gate reports. */
export function auditTokens(tokens: Record<Theme, TokenSet>): { rows: AuditRow[]; errors: string[] } {
	const rows: AuditRow[] = [];
	const errors: string[] = [];

	for (const theme of ['light', 'dark'] as const) {
		for (const { label, fg, bg } of auditPairs(theme, tokens[theme])) {
			if (typeof fg !== 'string' || typeof bg !== 'string') {
				errors.push(`${theme}: \`${label}\` needs tokens the ${theme} block does not declare`);
				continue;
			}
			if (parseHsl(fg) === null || parseHsl(bg) === null) {
				errors.push(`${theme}: \`${label}\` resolves to a value the audit cannot measure (fg ${fg}, bg ${bg})`);
				continue;
			}
			const ratio = contrastRatio(fg, bg);
			rows.push({ theme, label, fg, bg, ratio, min: AA, pass: ratio >= AA });
		}
	}

	return { rows, errors };
}

/** The two `theme-color` values of §5.3: each theme's resolved `--sl-color-black`. */
export function themeColorValues(tokens: Record<Theme, TokenSet>): Record<Theme, string> {
	return {
		light: hslToHex(tokens.light['--sl-color-black']!),
		dark: hslToHex(tokens.dark['--sl-color-black']!),
	};
}
