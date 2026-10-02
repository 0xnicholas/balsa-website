import { SITE } from './site.ts';

/**
 * The site's only external-link constants (SPEC §2.4). Pages and components import from
 * here; they never write a URL. The docs switch point (#16, docs site accepted online)
 * replaces `docs` in place — the value changes, the call sites do not.
 */
export const LINKS = {
	github: 'https://github.com/0xnicholas/balsats-framework',
	issues: 'https://github.com/0xnicholas/balsats-framework/issues',
	docs: 'https://github.com/0xnicholas/balsats-framework', // → https://docs.balsats.com
	examples: 'https://github.com/0xnicholas/balsats-framework/tree/main/examples',
	architecture: 'https://github.com/0xnicholas/balsats-framework/tree/main/docs/architecture',
} as const;

/** Every href an external link may carry (SPEC §8.8 ⑤: no retired repo name, one constant). */
export const allowedExternalLinks: readonly string[] = [...Object.values(LINKS), SITE.origin];

/** The three keys the resources strip draws from (SPEC §3.6); their values are the constants above. */
export const resourceLinkKeys = ['docs', 'examples', 'architecture'] as const;
export type ResourceLinkKey = (typeof resourceLinkKeys)[number];
