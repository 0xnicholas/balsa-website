/**
 * The content collections (SPEC §8.3): the site's locked copy and artifacts as data with a
 * schema, read at build time with `getCollection()` / `getEntry()`. Pages stay hand-written
 * `.astro`; only the strings, code samples and trace rows live here.
 *
 * Collections so far:
 *   - `hero`          — the home hero's H1 and sub (SPEC §3.1 【终稿·勿改】)
 *   - `finalCta`      — the shared final CTA's heading and sub (SPEC §3.8)
 *   - `features`      — the home feature tabs, one entry per tab (SPEC §3.2/§7.3)
 *   - `observability` — the observability band's copy and card claim (SPEC §3.3)
 *   - `socialProof`   — the social-proof placeholder band's copy (SPEC §3.4)
 *   - `resources`     — the resources strip's kicker and its three links (SPEC §3.6)
 *   - `snippets`      — code samples by file name (SPEC §7), one JSON per file
 *   - `traces`        — the hero's trace waterfall, a real run's static capture (SPEC §7.5)
 *
 * `faq`, `useCases` and `keywordPages` land with their slices (#24 and later) in the same shape.
 */

import { glob } from 'astro/loaders';
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { resourceLinkKeys } from './lib/links.ts';

const hero = defineCollection({
	loader: glob({ pattern: '*.json', base: './src/content/hero' }),
	schema: z.object({
		h1: z.string(),
		sub: z.string(),
	}),
});

const finalCta = defineCollection({
	loader: glob({ pattern: '*.json', base: './src/content/final-cta' }),
	schema: z.object({
		heading: z.string(),
		sub: z.string(),
	}),
});

const features = defineCollection({
	loader: glob({ pattern: '*.json', base: './src/content/features' }),
	schema: z.object({
		/** The tab order on the home page (SPEC §3.2: Agents → Workflows → Harness → Memory → MCP). */
		order: z.number().int(),
		/** The tab label; the entry's id is the panel's anchor (`#agents` …). */
		tab: z.string(),
		claim: z.string(),
		/** SPEC §3.2: a panel carries 3–5 supporting bullets. */
		bullets: z.array(z.object({ lead: z.string(), text: z.string() })).min(3).max(5),
		/** The code card's file tabs, in order — one or two files (SPEC §7.1/§7.3). */
		files: z.array(z.object({ file: z.string(), code: z.string() })).min(1).max(2),
	}),
});

const observability = defineCollection({
	loader: glob({ pattern: '*.json', base: './src/content/observability' }),
	schema: z.object({
		/** SPEC §3.3: the band's kicker and its H2 claim. */
		kicker: z.string(),
		claim: z.string(),
		/** The band's lead paragraph (【终稿·勿改】). */
		lead: z.string(),
		/** The code card's claim above the `app.ts` card (【终稿·勿改】). */
		codeClaim: z.string(),
	}),
});

const socialProof = defineCollection({
	loader: glob({ pattern: '*.json', base: './src/content/social-proof' }),
	schema: z.object({
		/** SPEC §3.4: the placeholder band is a kicker and one muted line — nothing else. */
		kicker: z.string(),
		line: z.string(),
	}),
});

const resources = defineCollection({
	loader: glob({ pattern: '*.json', base: './src/content/resources' }),
	schema: z.object({
		/** SPEC §3.6: the strip's kicker, then exactly three links by their `links.ts` key. */
		kicker: z.string(),
		links: z.array(z.object({ label: z.string(), key: z.enum([...resourceLinkKeys]) })).length(3),
	}),
});

const snippets = defineCollection({
	loader: glob({ pattern: '*.json', base: './src/content/snippets' }),
	schema: z.object({
		/** The file name shown in the tab, e.g. `agent.ts` — also the copy's name. */
		file: z.string(),
		/** The code, verbatim; the rendered text is what a copy button copies. */
		code: z.string(),
	}),
});

const traces = defineCollection({
	loader: glob({ pattern: '*.json', base: './src/content/traces' }),
	schema: z.object({
		/** The card head, verbatim from the run capture (SPEC §7.5). */
		meta: z.string(),
		rows: z.array(
			z.object({
				lane: z.string(),
				left: z.number(),
				width: z.number(),
				value: z.string(),
				/** `tool` rows take the trace-green; every other row takes the accent. */
				tone: z.enum(['accent', 'tool']),
			}),
		),
		/** The card foot, verbatim. */
		summary: z.string(),
	}),
});

export const collections = { hero, finalCta, features, observability, socialProof, resources, snippets, traces };
