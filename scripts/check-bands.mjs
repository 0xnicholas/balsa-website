#!/usr/bin/env node
/**
 * The home band gate (SPEC §3.3/§3.4/§3.6/§7.4) over the built home page: the observability band
 * with its verbatim copy and one §7.4 code card, the social-proof placeholder with its one muted
 * line and nothing invented, the resources strip with its three links from `src/lib/links.ts` —
 * and the two shared rules: no counting-style figures, and text painted only in the roles §5.5
 * audits on the page background. The rules live in `src/lib/band-rules.ts`.
 *
 * Usage:
 *   node --experimental-strip-types scripts/check-bands.mjs [--root <dir>] [--dist <dir>]
 */
import path from 'node:path';
import { builtPages, failGate, runChecks, startGate } from './lib/cli.mjs';
import { bandColorIssues, bandCountingIssues, observabilityIssues, resourcesIssues, socialProofIssues } from '../src/lib/band-rules.ts';

const { repoRoot, options } = startGate(import.meta.url, process.argv.slice(2), { values: ['dist'] });
const dist = path.join(repoRoot, options.dist ?? 'dist');
const home = builtPages(dist).find((page) => page.path === 'index.html');

if (home === undefined) {
	console.error(`✗ ${path.relative(repoRoot, dist)}/index.html is missing — \`pnpm build\` writes it before this gate runs`);
	process.exit(1);
}

const checks = [
	[
		observabilityIssues(home),
		'observability band: #observability — the §3.3 copy verbatim and the §7.4 `app.ts` card, one file',
	],
	[
		socialProofIssues(home),
		'social-proof band: #social-proof — the §3.4 kicker and one muted line, nothing invented',
	],
	[
		resourcesIssues(home),
		'resources strip: #resources — the three verbatim links from src/lib/links.ts',
	],
	[
		bandColorIssues(home),
		'home bands: text only in the §5.5 audited roles on the page background',
	],
	[
		bandCountingIssues(home),
		'home bands: no counting-style figures in the copy (SPEC §9.2)',
	],
];

const issues = runChecks(checks);

failGate(issues, {
	summary: `home-band problem(s) (SPEC §3.3/§3.4/§3.6/§7.4).`,
	hint: 'The bands read their copy from src/content/; the spec copy lives in src/lib/band-rules.ts.',
});
console.log('\nHome bands hold.');
