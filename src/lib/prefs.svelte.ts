import { browser } from '$app/environment';

export type ThemeName = 'flat';
export type CardStyle = 'simplified' | 'traditional';

interface Prefs {
	theme: ThemeName;
	cardStyle: CardStyle;
	muted: boolean;
}

const DEFAULTS: Prefs = {
	theme: 'flat',
	cardStyle: 'simplified',
	muted: false
};

const KEY = {
	theme: 'poker.theme',
	cardStyle: 'poker.cardStyle',
	muted: 'poker.muted'
} as const;

function readInitial(): Prefs {
	if (!browser) return { ...DEFAULTS };
	try {
		const theme = (localStorage.getItem(KEY.theme) as ThemeName | null) ?? DEFAULTS.theme;
		const cardStyle =
			(localStorage.getItem(KEY.cardStyle) as CardStyle | null) ?? DEFAULTS.cardStyle;
		const mutedRaw = localStorage.getItem(KEY.muted);
		const muted = mutedRaw === null ? DEFAULTS.muted : mutedRaw === '1';
		return { theme, cardStyle, muted };
	} catch {
		return { ...DEFAULTS };
	}
}

const initial = readInitial();

export const prefs = $state<Prefs>({ ...initial });

if (browser) {
	$effect.root(() => {
		$effect(() => {
			try {
				localStorage.setItem(KEY.theme, prefs.theme);
			} catch {
				/* quota / privacy mode */
			}
		});
		$effect(() => {
			try {
				localStorage.setItem(KEY.cardStyle, prefs.cardStyle);
			} catch {
				/* */
			}
		});
		$effect(() => {
			try {
				localStorage.setItem(KEY.muted, prefs.muted ? '1' : '0');
			} catch {
				/* */
			}
		});
	});
}
