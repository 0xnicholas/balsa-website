/**
 * The content collections (SPEC §8.3): the site's locked copy and artifacts as data with a
 * schema, read at build time with `getCollection()` / `getEntry()`. Pages stay hand-written
 * `.astro`; only the strings, code samples and trace rows live here.
 *
 * Collections so far:
 *   - `hero`      — the home hero's H1 and sub (SPEC §3.1 【终稿·勿改】)
 *   - `finalCta`  — the shared final CTA's heading and sub (SPEC §3.8)
 *   - `snippets`  — code samples by file name (SPEC §7), one JSON per file
 *   - `traces`    — the hero's trace waterfall, a real run's static capture (SPEC §7.5)
 *
 * `faq`, `features`, `useCases` and `keywordPages` land with their slices (#22–#24, #26–#30)
 * in the same shape.
 */

import { glob } from 'astro/loaders';
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';

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

export const collections = { hero, finalCta, snippets, traces };
