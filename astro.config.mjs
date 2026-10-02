import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import { SITE } from './src/lib/site.ts';

// Static output, no adapter (SPEC §8.1/§8.2): `dist/` stays a portable static directory that
// any host can serve. `site` is read from `src/lib/site.ts` so canonical, og:url, the sitemap
// and robots.txt all name one origin; versions are pinned in package.json by hand, never
// through `astro add`.
export default defineConfig({
	site: SITE.origin,
	output: 'static',
	// Reserved, not enabled (SPEC §8.4): English pages live at the site root and the default
	// locale carries no prefix, so adding `zh/` later moves no existing URL.
	i18n: { locales: ['en'], defaultLocale: 'en', routing: { prefixDefaultLocale: false } },
	vite: { plugins: [tailwindcss()] },
	integrations: [sitemap()],
	markdown: { shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' } } },
});
