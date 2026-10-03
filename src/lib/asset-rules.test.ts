import assert from 'node:assert/strict';
import { test } from 'node:test';
import { faviconIssues, llmsIssues, ogImageIssues, pngSize } from './asset-rules.ts';

const origin = 'https://oribos.dev';

test('the favicon keeps both theme values', () => {
	const svg = `<svg xmlns="http://www.w3.org/2000/svg"><style>text{fill:#9e630a}@media (prefers-color-scheme: dark){text{fill:#efd29f}}</style><text>b</text></svg>`;
	assert.deepEqual(faviconIssues(svg), []);
	assert.match(faviconIssues(null)[0]!, /favicon/);
	assert.match(faviconIssues(svg.replace('#efd29f', '#000000'))[0]!, /dark/);
	assert.match(faviconIssues('<svg></svg>')[0]!, /#9e630a/);
});

test('the og card is one 1200×630 PNG', () => {
	const png = (width: number, height: number) => {
		const buffer = Buffer.alloc(24);
		buffer.write('\x89PNG\r\n\x1a\n', 0, 'binary');
		buffer.write('IHDR', 12, 'binary');
		buffer.writeUInt32BE(width, 16);
		buffer.writeUInt32BE(height, 20);
		return buffer;
	};

	assert.deepEqual(pngSize(png(1200, 630)), { width: 1200, height: 630 });
	assert.equal(pngSize(Buffer.from('not a png')), null);
	assert.deepEqual(ogImageIssues(png(1200, 630)), []);
	assert.match(ogImageIssues(png(1200, 600))[0]!, /1200×630/);
	assert.match(ogImageIssues(null)[0]!, /og\.png/);
});

test('llms.txt is the page list: verbatim titles with absolute URLs on the one origin', () => {
	const pages = [
		{ route: '/', title: 'Oribos — ultralight TypeScript AI agent framework' },
		{ route: '/about/', title: 'About — Oribos' },
	];
	const text = `# Oribos\n\n- [${pages[0]!.title}](${origin}/)\n- [${pages[1]!.title}](${origin}/about/)\n`;
	assert.deepEqual(llmsIssues(text, pages, origin), []);

	assert.match(llmsIssues(null, pages, origin)[0]!, /llms\.txt/);
	assert.ok(llmsIssues(text.replace(`${origin}/about/`, 'https://example.com/about/'), pages, origin).length > 0);
	assert.ok(llmsIssues(`${text}- [Extra](https://oribos.dev/extra/)\n`, pages, origin).length > 0);
	assert.ok(llmsIssues(text.replace('About — Oribos', 'About'), pages, origin).length > 0);
	assert.match(llmsIssues(text.replace('About — Oribos', 'About'), pages, origin)[0]!, /the title for/);
	const withoutHeading = `- [${pages[0]!.title}](${origin}/)\n- [${pages[1]!.title}](${origin}/about/)\n`;
	assert.match(llmsIssues(withoutHeading, pages, origin)[0]!, /no `# Oribos` heading/);
});
