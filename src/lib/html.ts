/**
 * Reading the HTML this build emits — a scanner for the shapes the rule modules need, not a
 * general parser: a `>` inside an attribute value would end a tag early, and nested elements
 * of the same kind are not tracked. Shared by the origin, telemetry, shell and hero rules.
 */

/** One attribute value from a tag string, or `null` when the tag does not carry it. */
export function attributeValue(tag: string, name: string): string | null {
	const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'));
	return match === null ? null : (match[1] ?? match[2] ?? '');
}

/** Every opening tag of one kind, in document order. */
export function tagsOf(html: string, tag: string): string[] {
	return [...html.matchAll(new RegExp(`<${tag}\\b[^>]*>`, 'gi'))].map((match) => match[0]);
}

/**
 * The values of one attribute across every tag of a kind that carries a key: the shape the
 * origin rules (canonical, og:url) and the shell rules (favicon, og:image, theme-color) share.
 * `keyAttribute` is `rel` for links, `property` or `name` for metas.
 */
export function attributesOf(
	html: string,
	tag: string,
	keyAttribute: string,
	keyValue: string,
	valueAttribute: string,
): string[] {
	return tagsOf(html, tag)
		.filter((token) => attributeValue(token, keyAttribute) === keyValue)
		.map((token) => attributeValue(token, valueAttribute))
		.filter((value): value is string => value !== null);
}

const entityPatterns: readonly [RegExp, string][] = [
	[/&(?:amp|#38|#x26);/gi, '&'],
	[/&(?:lt|#60|#x3c);/gi, '<'],
	[/&(?:gt|#62|#x3e);/gi, '>'],
	[/&(?:quot|#34|#x22);/gi, '"'],
	[/&(?:apos|#39|#x27);/gi, "'"],
	[/&(?:nbsp|#160|#xa0);/gi, ' '],
];

/** A decent HTML entity set for the copy this site ships (the five named ones plus nbsp). */
export function decodeEntities(text: string): string {
	let decoded = text;
	for (const [pattern, replacement] of entityPatterns) decoded = decoded.replace(pattern, replacement);
	return decoded;
}

/** The rendered text of a fragment: tags become spaces, entities decode, whitespace collapses. */
export function textOf(html: string): string {
	return decodeEntities(html.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

/**
 * The outer HTML of the first `<tag>` element of a fragment, or `null`. With a `marker` (a class
 * name, `id="…"` or data attribute) it returns the first element whose opening tag carries that
 * marker, which must end at a tag boundary — `data-hero` never matches `data-hero-code`.
 */
export function elementOf(html: string, tag: string, marker?: string): string | null {
	const attributes = marker === undefined ? '[^>]*' : `[^>]*\\b${marker}(?![\\w-])[^>]*`;
	const pattern = new RegExp(`<${tag}\\b${attributes}>[\\s\\S]*?<\\/${tag}\\s*>`, 'i');
	return html.match(pattern)?.[0] ?? null;
}

export type MarkupLink = { href: string; text: string; index: number };

/** Every `<a href>` of a fragment, in document order, with its position for order checks. */
export function linksOf(html: string): MarkupLink[] {
	return [...html.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)].map((match) => {
		const tag = match[0].slice(0, match[0].indexOf('>') + 1);
		return {
			href: attributeValue(tag, 'href') ?? '',
			text: textOf(match[1]!),
			index: match.index ?? 0,
		};
	});
}

/** The rendered text of the first `<pre>` block in a fragment, verbatim minus its last newline. */
export function codeOf(html: string): string | null {
	const pre = elementOf(html, 'pre');
	if (pre === null) return null;
	// Tags go with no separator: the code's own spacing is what a copy button has to reproduce.
	const inner = pre.replace(/^<pre\b[^>]*>/, '').replace(/<\/pre>$/, '');
	return decodeEntities(inner.replace(/<[^>]*>/g, '')).replace(/\n$/, '');
}
