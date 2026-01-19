import type { CardDefinition } from '../types';
import BigSocialCard from './BigSocialCard.svelte';
import CreateBigSocialCardModal from './CreateBigSocialCardModal.svelte';

export const BigSocialCardDefinition = {
	type: 'bigsocial',
	contentComponent: BigSocialCard,
	creationModalComponent: CreateBigSocialCardModal,

	createNew: (card) => {
		card.cardType = 'bigsocial';
		card.cardData = {
			href: '',
			platform: ''
		};
		card.w = 2;
		card.h = 2;
		card.mobileW = 4;
		card.mobileH = 4;
	},

	canChange: (item) => {
		const href = item.cardData?.href;
		if (!href) return false;
		return Boolean(detectPlatform(href));
	},
	change: (item) => {
		const href = item.cardData?.href;
		const platform = href ? detectPlatform(href) : null;
		if (!href || !platform) return item;
		item.cardData = {
			...item.cardData,
			platform,
			color: platformsData[platform].hex
		};
		return item;
	},
	name: 'Social Icon',
	allowSetColor: false,
	defaultColor: 'transparent',
	minW: 2,
	minH: 2,
	onUrlHandler: (url, item) => {
		const platform = detectPlatform(url);
		if (!platform) return null;

		item.cardData.platform = platform;
		item.cardData.color = platformsData[platform].hex;
		item.cardData.href = url;

		return item;
	},
	urlHandlerPriority: 1
} as CardDefinition & { type: 'bigsocial' };

import {
	siInstagram,
	siFacebook,
	siX,
	siYoutube,
	siTiktok,
	siBluesky,
	siThreads,
	siSnapchat,
	siPinterest,
	siTwitch,
	siDiscord,
	siGithub,
	siSpotify,
	siReddit,
	siWhatsapp,
	siTelegram,
	siMastodon,
	siBehance,
	siDribbble,
	siMedium,
	siDevdotto,
	siHashnode,
	siPatreon,
	siKofi,
	siBuymeacoffee,
	siSubstack,
	siSoundcloud,
	siBandcamp,
	siApplepodcasts,
	siFigma,
	siNotion,
	siSignal,
	siWechat,
	siLine,
	siArchiveofourown,
	type SimpleIcon
} from 'simple-icons';

export const platformPatterns: Record<string, RegExp> = {
	instagram: /(?:instagram\.com|instagr\.am)/i,
	facebook: /(?:facebook\.com|fb\.com|fb\.me)/i,
	twitter: /(?:twitter\.com)/i,
	x: /(?:x\.com)/i,
	youtube: /(?:youtube\.com|youtu\.be)/i,
	tiktok: /(?:tiktok\.com)/i,
	linkedin: /(?:linkedin\.com)/i,
	bluesky: /(?:bsky\.app|bsky\.social)/i,
	threads: /(?:threads\.net)/i,
	snapchat: /(?:snapchat\.com)/i,
	pinterest: /(?:pinterest\.com|pin\.it)/i,
	twitch: /(?:twitch\.tv)/i,
	discord: /(?:discord\.gg|discord\.com)/i,
	github: /(?:github\.com)/i,
	spotify: /(?:spotify\.com|open\.spotify\.com)/i,
	reddit: /(?:reddit\.com)/i,
	whatsapp: /(?:whatsapp\.com|wa\.me)/i,
	telegram: /(?:t\.me|telegram\.org)/i,
	mastodon: /(?:mastodon\.social|mastodon\.online|mstdn\.social)/i,

	// professional / creator
	behance: /(?:behance\.net)/i,
	dribbble: /(?:dribbble\.com)/i,
	medium: /(?:medium\.com)/i,
	devto: /(?:dev\.to)/i,
	hashnode: /(?:hashnode\.com)/i,

	// support / monetization
	patreon: /(?:patreon\.com)/i,
	kofi: /(?:ko-fi\.com|kofi\.com)/i,
	buymeacoffee: /(?:buymeacoffee\.com)/i,
	substack: /(?:substack\.com)/i,

	// audio / podcasts
	soundcloud: /(?:soundcloud\.com)/i,
	bandcamp: /(?:bandcamp\.com)/i,
	applepodcasts: /(?:podcasts\.apple\.com)/i,
	googlepodcasts: /(?:podcasts\.google\.com)/i,

	// tools / misc
	figma: /(?:figma\.com)/i,
	notion: /(?:notion\.so)/i,

	// chat / messaging
	slack: /(?:slack\.com)/i,
	signal: /(?:signal\.org|signal\.me)/i,
	wechat: /(?:wechat\.com|weixin\.qq\.com)/i,
	line: /(?:line\.me)/i,
	skype: /(?:skype\.com)/i,

	ao3: /(?:archiveofourown\.org)/i,

	germ: /(?:ger\.mx)/i
};

export const platformsData: Record<string, SimpleIcon> = {
	instagram: siInstagram,
	facebook: siFacebook,
	twitter: siX,
	x: siX,
	youtube: siYoutube,
	tiktok: siTiktok,
	bluesky: siBluesky,
	threads: siThreads,
	snapchat: siSnapchat,
	pinterest: siPinterest,
	twitch: siTwitch,
	discord: siDiscord,
	github: siGithub,
	spotify: siSpotify,
	reddit: siReddit,
	whatsapp: siWhatsapp,
	telegram: siTelegram,
	mastodon: siMastodon,

	// professional / creator
	behance: siBehance,
	dribbble: siDribbble,
	medium: siMedium,
	devto: siDevdotto,
	hashnode: siHashnode,
	linkedin: {
		slug: 'linkedin',
		path: '',
		title: 'LinkedIn',
		hex: '0A66C2',
		source: 'https://brand.linkedin.com',
		guidelines: 'https://brand.linkedin.com/policies',
		svg: `<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>LinkedIn</title><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`
	},

	germ: {
		slug: 'germ',
		path: '',
		title: 'Germ Network',
		hex: '7EE35A',
		source: '',
		svg: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_2_3)">
<path d="M9.97852 2.31976C10.9816 4.81045 13.9828 5.28448 15.4834 3.19552C15.6921 2.89824 15.9489 2.6572 16.0371 2.6572C16.3501 2.6572 18.2841 4.7301 18.6933 5.50945C19.2791 6.62624 19.247 6.65838 18.1476 6.32093C15.018 5.34876 12.4742 6.21648 11.1742 8.69111C10.2112 10.539 11.1822 13.4475 13.0841 14.3956C14.1674 14.9339 14.7933 14.8054 16.2378 13.7207C18.0513 12.3629 19.0303 13.1342 17.626 14.8134C15.652 17.1836 12.3378 18.2039 9.32852 17.3764C8.21309 17.0711 8.11679 16.9506 8.20506 15.9623C8.35753 14.3956 7.77173 12.7405 6.63223 11.5112C5.68532 10.4908 5.75754 10.2739 7.2421 9.7838C10.797 8.59469 10.8933 4.15162 7.38655 3.17945C6.99334 3.06696 6.6884 2.92234 6.71247 2.85807C6.79272 2.62507 9.08778 1.50024 9.56926 1.46007C9.60136 1.46007 9.78592 1.84572 9.97852 2.31976Z" fill="#4183FF"/>
<path d="M18.1316 7.74304C19.7445 8.54648 19.9773 9.14104 19.4958 11.1979L19.4935 11.2075C19.255 12.2183 19.2534 12.2252 18.7415 11.8728C17.8587 11.2782 17.0563 11.463 15.5316 12.6039C14.2637 13.56 13.8625 13.568 12.9797 12.6441C10.1791 9.71149 14.2637 5.83083 18.1316 7.74304Z" fill="#22F137"/>
<path d="M6.50383 4.35248C8.08469 4.64976 8.71864 5.3809 8.55012 6.71462C8.42975 7.65466 8.03654 8.05638 6.6563 8.62683C4.30507 9.599 4.04026 10.5631 5.62914 12.3789C6.45568 13.327 6.82482 14.1706 6.89704 15.2714C6.96926 16.4122 6.88902 16.4122 5.66927 15.1589C3.20569 12.6521 2.61989 9.15711 4.13655 5.96741C4.96309 4.24 5.15569 4.10341 6.50383 4.35248Z" fill="#22F137"/>
<path d="M13.7581 1.58862C14.7371 1.89393 14.681 1.83769 14.4483 2.28762C13.6618 3.80614 11.1341 3.15534 11.1341 1.43596C11.1341 1.10655 12.4341 1.18689 13.7581 1.58862Z" fill="#22F137"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M9.40876 0.19865C2.66804 1.65289 -0.260969 9.79987 3.97606 15.3115C8.39765 21.0723 17.6983 19.7867 20.3143 13.0378C23.1069 5.83083 16.952 -1.41628 9.40876 0.19865ZM14.4483 2.28762C14.681 1.83769 14.7371 1.89393 13.7581 1.58862C12.4341 1.18689 11.1341 1.10655 11.1341 1.43596C11.1341 3.15534 13.6618 3.80614 14.4483 2.28762ZM15.4834 3.19552C13.9828 5.28448 10.9816 4.81045 9.97852 2.31976C9.78592 1.84572 9.60136 1.46007 9.56926 1.46007C9.08778 1.50024 6.79272 2.62507 6.71247 2.85807C6.6884 2.92234 6.99334 3.06696 7.38655 3.17945C10.8933 4.15162 10.797 8.59469 7.2421 9.7838C5.75754 10.2739 5.68532 10.4908 6.63223 11.5112C7.77173 12.7405 8.35753 14.3956 8.20506 15.9623C8.11679 16.9506 8.21309 17.0711 9.32852 17.3764C12.3378 18.2039 15.652 17.1836 17.626 14.8134C19.0303 13.1342 18.0513 12.3629 16.2378 13.7207C14.7933 14.8054 14.1674 14.9339 13.0841 14.3956C11.1822 13.4475 10.2112 10.539 11.1742 8.69111C12.4742 6.21648 15.018 5.34876 18.1476 6.32093C19.247 6.65838 19.2791 6.62624 18.6933 5.50945C18.2841 4.7301 16.3501 2.6572 16.0371 2.6572C15.9489 2.6572 15.6921 2.89824 15.4834 3.19552ZM8.55012 6.71462C8.71864 5.3809 8.08469 4.64976 6.50383 4.35248C5.15569 4.10341 4.96309 4.24 4.13655 5.96741C2.61989 9.15711 3.20569 12.6521 5.66927 15.1589C6.88902 16.4122 6.96926 16.4122 6.89704 15.2714C6.82482 14.1706 6.45568 13.327 5.62914 12.3789C4.04026 10.5631 4.30507 9.599 6.6563 8.62683C8.03654 8.05638 8.42975 7.65466 8.55012 6.71462ZM19.4958 11.1979C19.9773 9.14104 19.7445 8.54648 18.1316 7.74304C14.2637 5.83083 10.1791 9.71149 12.9797 12.6441C13.8625 13.568 14.2637 13.56 15.5316 12.6039C17.0563 11.463 17.8587 11.2782 18.7415 11.8728C19.2534 12.2252 19.255 12.2183 19.4935 11.2075L19.4958 11.1979Z" fill="black"/>
<path d="M11.11 21.3936C11.0939 21.4097 10.5402 21.4579 9.89025 21.4981C7.15383 21.6668 5.5489 22.5586 6.71247 23.2657C8.25321 24.2057 14.7371 24.2057 16.2779 23.2657C17.3853 22.5988 15.9248 21.707 13.4211 21.5222C11.4711 21.3776 11.1501 21.3615 11.11 21.3936Z" fill="black"/>
</g>
<defs>
<clipPath id="clip0_2_3">
<rect width="24" height="24" fill="white"/>
</clipPath>
</defs>
</svg>`
	},

	// support / monetization
	patreon: siPatreon,
	kofi: siKofi,
	buymeacoffee: siBuymeacoffee,
	substack: siSubstack,

	// audio / podcasts
	soundcloud: siSoundcloud,
	bandcamp: siBandcamp,
	applepodcasts: siApplepodcasts,

	// tools / misc
	figma: siFigma,
	notion: siNotion,

	// chat / messaging
	signal: siSignal,
	wechat: siWechat,
	line: siLine,

	ao3: siArchiveofourown
};

export function detectPlatform(url: string): string | null {
	for (const [platform, pattern] of Object.entries(platformPatterns)) {
		if (pattern.test(url) && platformsData[platform]) {
			return platform;
		}
	}
	return null;
}
