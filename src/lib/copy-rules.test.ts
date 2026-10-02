import assert from 'node:assert/strict';
import { test } from 'node:test';
import { copyIssues, isKeywordPage } from './copy-rules.ts';

const rules = (text: string, path = 'index.html') => copyIssues([{ path, text }]);

test('every install-class shape the spec lists is caught', () => {
	for (const command of [
		'npm install @balsats/core',
		'npm i @balsats/core',
		'pnpm add @balsats/core',
		'pnpm install',
		'bun add @balsats/core',
		'yarn add @balsats/core',
		'npx create-balsats',
		'git clone https://github.com/0xnicholas/balsats-framework',
	]) {
		assert.ok(rules(`<p>${command}</p>`).length > 0, `expected a finding for \`${command}\``);
	}
});

test('a package manager near `install` reads as a command; plain prose does not', () => {
	assert.ok(rules('First, install the package with npm.').length > 0);
	assert.deepEqual(rules('Each team installs only what it uses.'), []);
	assert.deepEqual(rules('Read the installation notes in the repository.'), []);
});

test('import lines and package names are not install commands', () => {
	assert.deepEqual(
		rules("import { Agent } from '@balsats/core/agent';\nimport { openai } from '@ai-sdk/openai';"),
		[],
	);
});

test('competitor and reference-site names are found, case-insensitively', () => {
	assert.ok(rules('<p>Like Mastra, but lighter.</p>').length > 0);
	assert.ok(rules('<p>LangChain users will feel at home.</p>').length > 0);
});

test('counting-style figures are caught; the locked phrases of the spec are not', () => {
	for (const figure of ['five fields', 'five core subsystems', '12 packages', '3 tests', '500 KB', '2 million users']) {
		assert.ok(rules(`<p>${figure}</p>`).length > 0, `expected a finding for \`${figure}\``);
	}
	assert.deepEqual(rules('<p>An agent is a handful of fields.</p>'), []);
	assert.deepEqual(rules('<p>One small framework, three shapes.</p>'), []);
	assert.deepEqual(rules('<p>trace · gpt-4o-mini · 2 steps · 1.62s</p>'), []);
	assert.deepEqual(rules('<p>0 runtime dependencies</p>'), []);
});

test('`MIT` is caught as a word, and build-tool license banners are not the site face', () => {
	assert.ok(rules('<p>Licensed MIT.</p>').length > 0);
	assert.deepEqual(rules('<p>Submit a pull request.</p>'), []);
	assert.deepEqual(rules('/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */', 'index.css'), []);
});

test('the retired scope is caught and the current one is not', () => {
	assert.ok(rules("import { Agent } from '@balsa/core';").length > 0);
	assert.deepEqual(rules("import { Agent } from '@balsats/core/agent';"), []);
});

test('RAG and evals are keyword-page findings only', () => {
	assert.ok(rules('<p>RAG pipelines and evals.</p>', 'ai-agents/index.html').length > 0);
	// The two mentions the spec allows — the honest FAQ answer and the processors use-case
	// word — live on the home page, so the rule is scoped to the keyword routes.
	assert.deepEqual(rules('<p>Does Balsats support RAG or evals?</p>', 'index.html'), []);
	assert.deepEqual(rules('<p>Eval-style assertions can hang off processors.</p>', 'index.html'), []);
	assert.ok(isKeywordPage('ai-agent-framework/index.html'));
	assert.ok(isKeywordPage('ai-agent-framework.html'));
	assert.ok(!isKeywordPage('_astro/ai-agents.js'));
});

test('one finding per rule per line, not one per occurrence', () => {
	const found = rules('<p>RAG, evals and more RAG.</p>', 'ai-agents/index.html');
	assert.equal(found.length, 1);
});
