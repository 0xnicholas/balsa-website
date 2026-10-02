/**
 * The copy buttons' shared behaviour (SPEC §6.1/§7.1): a copy takes the visible code block's
 * text, verbatim — the rendered `<pre>` of the pane on screen — so the clipboard gets exactly
 * what the visitor read, and a code card and its copy cannot drift apart.
 */

/** How long the copied state shows before the button resets (SPEC §3.1: 1.2s). */
const copiedMs = 1200;

/** The verbatim text of the visible code block inside `scope`. */
function visibleCode(scope: ParentNode): string | null {
	const text = scope.querySelector('pre')?.textContent;
	if (text === undefined || text === '') return null;
	// Shiki separates its line spans with newlines; the code block carries no trailing one.
	return text.replace(/\n$/, '');
}

/** Copy the visible code block of `scope`; resolves to whether the clipboard took it. */
async function copyVisibleCode(scope: ParentNode): Promise<boolean> {
	const text = visibleCode(scope);
	if (text === null) return false;
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch {
		// No clipboard access (insecure context, denied permission): the button stays put.
		return false;
	}
}

/**
 * Wire a copy button: on click it copies the code `target()` points at, shows the copied state,
 * and resets it after 1.2s. The caller owns what "copied" looks like — a label swap, an icon
 * swap — and the timer never overlaps itself when the button is clicked twice.
 */
export function wireCopyButton(
	button: HTMLElement,
	target: () => ParentNode | null | undefined,
	{ onCopied, onReset }: { onCopied: () => void; onReset: () => void },
): void {
	let reset: number | undefined;
	button.addEventListener('click', async () => {
		const scope = target();
		if (scope === null || scope === undefined || !(await copyVisibleCode(scope))) return;
		window.clearTimeout(reset);
		onCopied();
		reset = window.setTimeout(onReset, copiedMs);
	});
}
