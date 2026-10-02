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
