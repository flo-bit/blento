export type ThemeTokens = {
	'--theme-page-bg': string;
	'--theme-page-fg': string;
	'--theme-page-muted': string;
	'--theme-card-bg': string;
	'--theme-card-fg': string;
	'--theme-card-border-width': string;
	'--theme-card-border-style': string;
	'--theme-card-border-color': string;
	'--theme-card-radius': string;
	'--theme-card-shadow': string;
	'--theme-accent': string;
	'--theme-font-body': string;
	'--theme-font-display': string;
};

export type CardVariantConfig = {
	/** Override picker label; defaults to capitalized variant id. */
	label?: string;
	/** Omit this variant from the per-card picker. */
	hide?: boolean;
	/**
	 * Class added to the card's inner wrapper. The default theme uses `'light'`
	 * for accent/colored variants so dark utilities are suppressed (saturated bg
	 * needs dark text). Themes whose accent variant doesn't fill the card (e.g.
	 * Terminal's border-only treatment) should override this to `''`.
	 */
	wrapperClass?: string;
	/**
	 * Extra class on the card's outer element. The default theme uses `'accent'`
	 * for accent/colored variants so card-internal `accent:` utilities fire (the
	 * dimmer accent shades designed for saturated bgs). Themes that don't fill
	 * the card with accent (e.g. Terminal) should override this to `''`.
	 */
	outerClass?: string;
};

export type CardVariantsConfig = {
	base?: CardVariantConfig;
	accent?: CardVariantConfig;
	transparent?: CardVariantConfig;
	colored?: CardVariantConfig & {
		/** Restrict which tailwind palettes are pickable for the "colored" variant. */
		palettes?: string[];
	};
};

export type Theme = {
	id: string;
	label: string;
	/** 'auto' = respect the existing dark/light toggle (use darkTokens for overrides) */
	mode: 'light' | 'dark' | 'auto';
	tokens: ThemeTokens;
	/** Overrides applied when html.dark is set (only meaningful when mode === 'auto'). */
	darkTokens?: Partial<ThemeTokens>;
	/** Tailwind palette name to push onto <html> so foxui's accent-* utilities pick it up. */
	accentClass?: string;
	/** Per-variant picker config (labels, hidden, palette restrictions). */
	cardVariants?: CardVariantsConfig;
	/** Theme-scoped CSS appended after token rules; targets `.themed-<id>`. */
	customCss?: string;
};

export const THEMES: Theme[] = [
	{
		id: 'paper',
		label: 'Paper',
		mode: 'light',
		tokens: {
			'--theme-page-bg': '#fafaf7',
			'--theme-page-fg': '#15151a',
			'--theme-page-muted': '#8b8b94',
			'--theme-card-bg': '#ffffff',
			'--theme-card-fg': '#15151a',
			'--theme-card-border-width': '1px',
			'--theme-card-border-style': 'solid',
			'--theme-card-border-color': '#e6e6e0',
			'--theme-card-radius': '14px',
			'--theme-card-shadow': '0 1px 0 rgba(0,0,0,0.02)',
			'--theme-accent': '#2452ff',
			'--theme-font-body': "'Inter', system-ui, sans-serif",
			'--theme-font-display': "'Inter', system-ui, sans-serif"
		}
	},
	{
		id: 'mocha',
		label: 'Mocha Dark',
		mode: 'dark',
		tokens: {
			'--theme-page-bg': '#1a1410',
			'--theme-page-fg': '#f3e6d4',
			'--theme-page-muted': '#9a8770',
			'--theme-card-bg': '#251c16',
			'--theme-card-fg': '#f3e6d4',
			'--theme-card-border-width': '1px',
			'--theme-card-border-style': 'solid',
			'--theme-card-border-color': '#2f2620',
			'--theme-card-radius': '20px',
			'--theme-card-shadow': 'inset 0 1px 0 rgba(255,255,255,0.04)',
			'--theme-accent': '#e88a4a',
			'--theme-font-body': "'DM Sans', system-ui, sans-serif",
			'--theme-font-display': "'DM Sans', system-ui, sans-serif"
		}
	},
	{
		id: 'neo',
		label: 'Neo Sketch',
		mode: 'light',
		tokens: {
			'--theme-page-bg': '#fffdf5',
			'--theme-page-fg': '#0a0a0a',
			'--theme-page-muted': '#666666',
			'--theme-card-bg': '#ffffff',
			'--theme-card-fg': '#0a0a0a',
			'--theme-card-border-width': '2px',
			'--theme-card-border-style': 'solid',
			'--theme-card-border-color': '#111111',
			'--theme-card-radius': '10px',
			'--theme-card-shadow': '4px 4px 0 #111',
			'--theme-accent': '#0a0a0a',
			'--theme-font-body': "'Space Grotesk', system-ui, sans-serif",
			'--theme-font-display': "'Space Grotesk', system-ui, sans-serif"
		}
	},
	{
		id: 'terminal',
		label: 'Terminal',
		mode: 'auto',
		accentClass: 'emerald',
		tokens: {
			'--theme-page-bg': '#ffffff',
			'--theme-page-fg': '#0a0a0a',
			'--theme-page-muted': '#737373',
			'--theme-card-bg': 'transparent',
			'--theme-card-fg': '#0a0a0a',
			'--theme-card-border-width': '1px',
			'--theme-card-border-style': 'dashed',
			'--theme-card-border-color': '#0a0a0a',
			'--theme-card-radius': '0px',
			'--theme-card-shadow': 'none',
			'--theme-accent': '#10b981',
			'--theme-font-body': "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
			'--theme-font-display': "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace"
		},
		darkTokens: {
			'--theme-page-bg': '#000000',
			'--theme-page-fg': '#e5e5e5',
			'--theme-page-muted': '#737373',
			'--theme-card-fg': '#e5e5e5',
			'--theme-card-border-color': '#e5e5e5'
		},
		cardVariants: {
			base: { label: 'card' },
			accent: { label: 'highlighted', wrapperClass: '', outerClass: '' },
			transparent: { hide: true },
			colored: { label: 'tinted', wrapperClass: '', outerClass: '' }
		},
		// Terminal interprets "color" as a border treatment, not a fill.
		// variant-accent / variant-colored: card bg stays transparent, accent
		// palette drives the border color instead of the background.
		customCss: `
			html.themed-terminal .themed-card.variant-accent,
			html.themed-terminal .themed-card.variant-colored {
				background: transparent;
				border-color: var(--accent-500);
			}
		`
	}
];

export const ALL_TOKEN_KEYS = Object.keys(THEMES[0].tokens) as (keyof ThemeTokens)[];

export const THEME_IDS = THEMES.map((t) => t.id);

export const ACCENT_CLASSES = [
	'red',
	'orange',
	'amber',
	'yellow',
	'lime',
	'green',
	'emerald',
	'teal',
	'cyan',
	'sky',
	'blue',
	'indigo',
	'violet',
	'purple',
	'fuchsia',
	'pink',
	'rose'
];
