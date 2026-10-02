/**
 * Reading an attribute out of a tag string — the shape the origin rules (canonical, og:url)
 * and the telemetry rules (subresource links) both need. A scanner for the HTML this build
 * emits, not a general parser: a `>` inside an attribute value would end the tag early.
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
