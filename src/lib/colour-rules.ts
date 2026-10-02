/**
 * SPEC §5.5: the roles the AA audit covers on the page background, and the scan that keeps a
 * section inside them. A section that reads on the page — no surface of its own — may wear
 * `text-white` (headings), `text-gray-2` (body), `text-gray-3` (muted) and `text-text-accent`
 * (links / kickers), and nothing else: every foreground it ships is then one the audit measured.
 * Shared by the home-band and FAQ rules.
 */

import { attributeValue, elementOf } from './html.ts';

export type ColourPage = { path: string; html: string };
/** A section the scan covers: its `data-` marker and the name a finding prints. */
export type PageSection = { marker: string; label: string };

/** SPEC §5.5: the audited foreground roles on the page background. */
export const auditedTextRoles = ['text-white', 'text-gray-2', 'text-gray-3', 'text-text-accent'] as const;

/** The token layer's colour families — `text-3xl`, `text-center` and `border-b` are not colours. */
const colourToken =
	/^(?:text|bg|border|fill|stroke)-(?:white|black|gray-[1-7]|accent(?:-low|-high)?|text-accent|text-invert|bg-accent)$/;

/** The colour-class tokens of a class list, variant prefixes (`hover:`, `aria-selected:`) dropped. */
function colourUtilities(classes: string): string[] {
	const found: string[] = [];
	for (const raw of classes.split(/\s+/)) {
		if (raw === '') continue;
		const token = raw.slice(raw.lastIndexOf(':') + 1);
		if (colourToken.test(token)) found.push(token);
	}
	return found;
}

/** Every colour class the fragment's elements carry, in document order. */
function colourClassesOf(fragment: string): string[] {
	return [...fragment.matchAll(/class\s*=\s*"([^"]*)"/gi)].flatMap((match) => colourUtilities(match[1]!));
}

/** The §5.5 findings for the given sections: a painted surface, or a text role off the audit. */
export function sectionColourIssues(page: ColourPage, sections: readonly PageSection[]): string[] {
	const issues: string[] = [];
	for (const { marker, label } of sections) {
		const section = elementOf(page.html, 'section', marker);
		if (section === null) continue;

		const opening = section.slice(0, section.indexOf('>') + 1);
		const surface = colourUtilities(attributeValue(opening, 'class') ?? '').filter((token) => token.startsWith('bg-'));
		if (surface.length > 0) {
			issues.push(
				`${page.path}: the ${label} paints its own surface with \`${surface[0]}\` — the §5.5 audited pairs are the page-background pairs (SPEC §5.5)`,
			);
		}

		for (const token of colourClassesOf(section)) {
			if (!token.startsWith('text-')) continue;
			if (!(auditedTextRoles as readonly string[]).includes(token)) {
				issues.push(
					`${page.path}: the ${label} paints text with \`${token}\` — §5.5 audits text-white / text-gray-2 / text-gray-3 / text-text-accent on the page (SPEC §5.5)`,
				);
			}
		}
	}
	return issues;
}
