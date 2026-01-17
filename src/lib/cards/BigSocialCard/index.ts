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

	ao3: /(?:archiveofourown\.org)/i
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
