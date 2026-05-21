<script lang="ts">
	import { browser } from '$app/environment';
	import { ACCENT_CLASSES, THEME_IDS, THEMES, type Theme } from './themes';
	import { setTheme, themeState } from './state.svelte';

	const STYLE_ID = 'blento-theme-style';
	const PREV_ACCENT_ATTR = 'data-theme-prev-accent';
	const STORAGE_KEY = 'blento:theme-test';

	const active = $derived(THEMES.find((t) => t.id === themeState.id));

	// JSON, with `<` escaped so the payload is safe inside a <script> block.
	const safeJson = (v: unknown) => JSON.stringify(v).replace(/</g, '\\u003c');

	// Inline sync script: runs before paint, reads localStorage, applies the theme
	// so there's no flash of unthemed content on first load.
	const foucScript =
		`<script>(function(){try{` +
		`var id=localStorage.getItem(${safeJson(STORAGE_KEY)});` +
		`if(!id)return;` +
		`var themes=${safeJson(THEMES)};` +
		`var accents=${safeJson(ACCENT_CLASSES)};` +
		`var theme=themes.filter(function(t){return t.id===id})[0];` +
		`if(!theme)return;` +
		`var html=document.documentElement;` +
		`var css='html.themed{';` +
		`for(var k in theme.tokens)css+=k+':'+theme.tokens[k]+';';` +
		`css+='}';` +
		`if(theme.darkTokens){css+=' html.themed.dark{';` +
		`for(var k2 in theme.darkTokens)css+=k2+':'+theme.darkTokens[k2]+';';` +
		`css+='}';}` +
		`if(theme.customCss)css+=' '+theme.customCss;` +
		`var s=document.createElement('style');` +
		`s.id=${safeJson(STYLE_ID)};s.textContent=css;` +
		`document.head.appendChild(s);` +
		`html.classList.add('themed','themed-'+theme.mode,'themed-'+theme.id);` +
		`if(theme.mode==='light')html.classList.add('themed-force-light');` +
		`else if(theme.mode==='dark')html.classList.add('themed-force-dark');` +
		`if(theme.accentClass){var prev='';` +
		`for(var i=0;i<accents.length;i++)if(html.classList.contains(accents[i])){prev=accents[i];break;}` +
		`html.setAttribute(${safeJson(PREV_ACCENT_ATTR)},prev);` +
		`for(var j=0;j<accents.length;j++)html.classList.remove(accents[j]);` +
		`html.classList.add(theme.accentClass);}` +
		`}catch(e){}})();<` +
		`/script>`;

	function findCurrentAccent(html: HTMLElement): string {
		for (const c of ACCENT_CLASSES) if (html.classList.contains(c)) return c;
		return '';
	}

	function buildCss(theme: Theme): string {
		const baseEntries = Object.entries(theme.tokens)
			.map(([k, v]) => `${k}: ${v};`)
			.join(' ');
		let css = `html.themed { ${baseEntries} }`;
		if (theme.darkTokens) {
			const darkEntries = Object.entries(theme.darkTokens)
				.map(([k, v]) => `${k}: ${v};`)
				.join(' ');
			css += ` html.themed.dark { ${darkEntries} }`;
		}
		if (theme.customCss) css += ` ${theme.customCss}`;
		return css;
	}

	$effect(() => {
		if (!browser) return;
		const html = document.documentElement;

		let styleEl = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
		if (!styleEl) {
			styleEl = document.createElement('style');
			styleEl.id = STYLE_ID;
			document.head.appendChild(styleEl);
		}

		// Restore previously stashed accent class (if any).
		const stashedAccent = html.getAttribute(PREV_ACCENT_ATTR);
		if (stashedAccent !== null) {
			for (const c of ACCENT_CLASSES) html.classList.remove(c);
			if (stashedAccent) html.classList.add(stashedAccent);
			html.removeAttribute(PREV_ACCENT_ATTR);
		}

		html.classList.remove(
			'themed',
			'themed-light',
			'themed-dark',
			'themed-auto',
			'themed-force-light',
			'themed-force-dark'
		);
		for (const id of THEME_IDS) html.classList.remove(`themed-${id}`);

		if (!active) {
			styleEl.textContent = '';
			return;
		}

		styleEl.textContent = buildCss(active);
		html.classList.add('themed', `themed-${active.mode}`, `themed-${active.id}`);

		if (active.mode === 'light') html.classList.add('themed-force-light');
		else if (active.mode === 'dark') html.classList.add('themed-force-dark');
		// 'auto': don't force a mode — mode-watcher's .dark (driven by user
		// preference) and our @custom-variant resolution handle it.

		if (active.accentClass) {
			html.setAttribute(PREV_ACCENT_ATTR, findCurrentAccent(html));
			for (const c of ACCENT_CLASSES) html.classList.remove(c);
			html.classList.add(active.accentClass);
		}
	});

	function isTypingTarget(t: EventTarget | null): boolean {
		if (!(t instanceof HTMLElement)) return false;
		if (t.isContentEditable) return true;
		const tag = t.tagName;
		return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
	}

	function onkey(e: KeyboardEvent) {
		if (e.metaKey || e.ctrlKey || e.altKey) return;
		if (isTypingTarget(e.target)) return;

		if (e.key === '0') {
			setTheme('');
			return;
		}
		const idx = ['1', '2', '3', '4'].indexOf(e.key);
		if (idx < 0) return;
		const theme = THEMES[idx];
		if (theme) setTheme(theme.id);
	}
</script>

<svelte:head>
	{@html foucScript}
</svelte:head>

<svelte:window onkeydown={onkey} />

{#if active}
	<div
		class="pointer-events-none fixed right-2 bottom-2 z-[100] rounded-md bg-black/75 px-2.5 py-1 font-mono text-[11px] text-white shadow-lg backdrop-blur"
	>
		theme: <span class="font-semibold">{active.label}</span>
		<span class="opacity-60">— 1-4 to switch, 0 to clear</span>
	</div>
{/if}
