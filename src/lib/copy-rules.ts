/**
 * The red-line scan (SPEC §8.8 ④, §9.2) over the *built* site: install-class commands, names
 * the site never mentions, counting-style figures, the retired `MIT` license word, the retired
 * `@balsa/*` scope, and the RAG / evals line keyword pages must not cross.
 *
 * The rules are stated once here and unit-tested; `scripts/check-copy.mjs` walks `dist/` and
 * prints the findings. The RAG / evals rule is page-scoped by design: the two mentions the
 * spec allows (the honest FAQ answer and the processors use-case word) live on the home page,
 * while a keyword page carries neither word at all (SPEC §4.4/§9.2).
 */

import { textOf } from './html.ts';

/** A built artifact to scan: its dist-relative path and its text. */
export type BuiltFile = { path: string; text: string };

export type CopyRule = {
	id: string;
	reason: string;
	pattern: RegExp;
	/** Restrict the rule to a subset of the output (the keyword-page rule uses this). */
	appliesTo?: (path: string) => boolean;
	/** Comments in build output are not the site face (Tailwind's license banner, `MIT`). */
	stripComments?: boolean;
};

/** Keyword pages are the four `ai-*` routes (SPEC §2.1); the RAG / evals line is theirs alone. */
export const isKeywordPage = (path: string): boolean =>
	path.endsWith('.html') && /(^|\/)ai-[^/]*(?:\/index\.html|\.html)$/.test(path);

export const copyRules: readonly CopyRule[] = [
	{
		id: 'install-command',
		reason: 'install-class commands are out until the publish switch is decided (SPEC §6.3)',
		pattern: /\b(?:npm|pnpm|bun|yarn)\s+(?:install|i|add|create|link|dlx|exec|x)\b/i,
	},
	{
		id: 'install-command',
		reason: 'install-class commands are out until the publish switch is decided (SPEC §6.3)',
		pattern: /\bnpx\b/i,
	},
	{
		id: 'install-command',
		reason: 'install-class commands are out until the publish switch is decided (SPEC §6.3)',
		pattern: /\bgit\s+clone\b/i,
	},
	{
		id: 'install-command',
		reason: 'a package manager next to `install` reads as an install command (SPEC §6.3)',
		pattern: /\binstall\b[^\n]{0,40}\b(?:npm|pnpm|bun|yarn)\b|\b(?:npm|pnpm|bun|yarn)\b[^\n]{0,40}\binstall\b/i,
	},
	{
		id: 'competitor-name',
		reason: 'the site never names a competitor or the reference site (SPEC §9.2)',
		pattern: /\b(?:mastra|langchain|langgraph|llamaindex|llama[ _-]?index|crewai|autogen|semantic[ -]?kernel|haystack)\b/i,
	},
	{
		id: 'counting-figure',
		reason: 'no size, test, star, download or user figures (SPEC §9.2)',
		pattern: /\b\d+(?:\.\d+)?\s*(?:kb|mb|gb|kib|mib|gib|kilobytes?|megabytes?)\b/i,
	},
	{
		id: 'counting-figure',
		reason: 'no counting-style claims — "a handful of fields", never "five fields" (SPEC §9.2)',
		// A digit binds to its noun ("5 fields", "2 million users"); a number word may carry a
		// qualifier ("five core subsystems"). `0 runtime dependencies` is a digit followed by a
		// qualifier, so the allowed phrase stays out of the net (SPEC §9.1).
		pattern:
			/\b(?:\d+(?:\.\d+)?\s+(?:million|billion|thousand|hundred)?\s*|(?:two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)(?:\s+[a-z][a-z-]*){0,2}\s+)(?:fields|packages|dependencies|modules|subsystems|tests?|stars|downloads|users|customers)\b/i,
	},
	{
		id: 'mit-license',
		reason: 'the license is Apache-2.0 — `MIT` is a retired placeholder (SPEC §9.2)',
		pattern: /\bMIT\b/,
		stripComments: true,
	},
	{
		id: 'retired-scope',
		reason: 'the npm scope is `@balsats/*` — `@balsa/*` is retired (SPEC §9.2)',
		pattern: /@balsa\//,
	},
	{
		id: 'rag-evals',
		reason: 'keyword pages do not carry RAG or evals at all (SPEC §4.4/§9.2)',
		pattern: /\bRAG\b|\bevals?\b/i,
		appliesTo: isKeywordPage,
	},
];

/** The keyword-page rule, exported so the FAQ and keyword gates hold their regions to the same line. */
export const ragEvalsRule = copyRules.find((rule) => rule.id === 'rag-evals')!;

/**
 * SPEC §6.2: nothing outside the three switch points names a release status — the scan the
 * page-family gates run over their pages' own copy. `regions` are the page's own sections
 * plus its meta description; the header pill, the final CTA and FAQ question 2 answer to
 * their own gates.
 */
export function releaseStatusIssues(page: { path: string }, regions: readonly string[]): string[] {
	const patterns: readonly { pattern: RegExp; reason: string }[] = [
		{ pattern: /coming\s+soon/i, reason: 'release status lives in the header pill, the final CTA and FAQ question 2' },
		{ pattern: /\bv?\d+\.\d+\.\d+\b/, reason: 'the page copy names no version' },
		{ pattern: /\bpre-?release\b/i, reason: 'the page copy names no release state' },
	];

	const issues: string[] = [];
	const text = textOf(regions.join('\n'));
	for (const { pattern, reason } of patterns) {
		const match = text.match(pattern);
		if (match !== null) {
			issues.push(`${page.path}: the page's own copy reads \`${match[0]}\` — no release status (${reason})`);
		}
	}
	return issues;
}

/** Block comments only: `//` would eat the `https://` in a URL, and HTML is scanned as it is. */
function withoutBlockComments(text: string): string {
	return text.replace(/\/\*[\s\S]*?\*\//g, ' ');
}

/**
 * SPEC §9.2: the site-wide red lines every section gate clears — the keyword-page-scoped
 * RAG / evals rule is not one of them (it has its own `appliesTo`). Named here, next to the
 * rules it selects, so the FAQ and use-case-page gates hold the same set.
 */
export const redLineIds = ['install-command', 'competitor-name', 'counting-figure', 'mit-license', 'retired-scope'] as const;

/** The red-line rules themselves, for section gates that hold their region to the §9.2 set. */
export const redLineRules = copyRules.filter((rule) => (redLineIds as readonly string[]).includes(rule.id));

/** The 1-based line a match sits on, for a finding a human can act on. */
function lineAt(text: string, index: number): number {
	return text.slice(0, index).split('\n').length;
}

/** Every match of one red-line rule in a text, the `g` flag ensured for `matchAll`. */
export function ruleMatches(rule: CopyRule, text: string): RegExpMatchArray[] {
	const flags = rule.pattern.flags.includes('g') ? rule.pattern.flags : `${rule.pattern.flags}g`;
	return [...text.matchAll(new RegExp(rule.pattern.source, flags))];
}

/**
 * Every red-line finding in the given files, as `path:line` lines naming the rule and the
 * match. Findings are per rule per line: one install command in a code sample is one finding,
 * not one per occurrence.
 */
export function copyIssues(files: readonly BuiltFile[]): string[] {
	const issues: string[] = [];
	const seen = new Set<string>();

	for (const file of files) {
		for (const rule of copyRules) {
			if (rule.appliesTo && !rule.appliesTo(file.path)) continue;
			// The MIT rule names the exception itself: comments in shipped CSS/JS are not the
			// site face (Tailwind's `MIT License` banner), so they are stripped for that rule.
			const text = rule.stripComments && /\.(?:css|js)$/.test(file.path) ? withoutBlockComments(file.text) : file.text;

			for (const match of ruleMatches(rule, text)) {
				const line = lineAt(text, match.index ?? 0);
				const key = `${file.path}:${line}:${rule.id}`;
				if (seen.has(key)) continue;
				seen.add(key);
				issues.push(`${file.path}:${line}: \`${match[0]}\` — ${rule.reason} [${rule.id}]`);
			}
		}
	}

	return issues;
}
