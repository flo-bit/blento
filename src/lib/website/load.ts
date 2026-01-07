import {
	type Collection,
	type DownloadedData,
	type IndividualCollections,
	type ListCollections
} from './types';
import { getRecord, listRecords, resolveHandle } from '$lib/oauth/atproto';
import type { Record as ListRecord } from '@atproto/api/dist/client/types/com/atproto/repo/listRecords';
import { data } from './data';
import { AtpBaseClient } from '@atproto/api';
import { env } from '$env/dynamic/private';

export async function loadData(handle: string) {
	const did = await resolveHandle({ handle });

	const downloadedData = {} as DownloadedData;

	const promises: {
		collection: string;
		rkey?: string;
		record: Promise<ListRecord> | Promise<Record<string, ListRecord>>;
	}[] = [];

	for (const collection of Object.keys(data) as Collection[]) {
		const cfg = data[collection];

		try {
			if (Array.isArray(cfg)) {
				for (const rkey of cfg) {
					const record = getRecord({ did, collection, rkey });
					promises.push({
						collection,
						rkey,
						record
					});
				}
			} else if (cfg === 'all') {
				const records = listRecords({ did, collection });
				promises.push({ collection, record: records });
			}
		} catch (error) {
			console.error('failed getting', collection, cfg, error);
		}
	}

	await Promise.all(promises.map((v) => v.record));

	for (const promise of promises) {
		if (promise.rkey) {
			downloadedData[promise.collection as IndividualCollections] ??= {} as Record<
				string,
				ListRecord
			>;
			downloadedData[promise.collection as IndividualCollections][promise.rkey] =
				(await promise.record) as ListRecord;
		} else {
			downloadedData[promise.collection as ListCollections] ??= (await promise.record) as Record<
				string,
				ListRecord
			>;
		}
	}

	const cardTypes = new Set(
		Object.values(downloadedData['app.blento.card']).map((v) => v.value.cardType)
	);

	let recentRecords;
	if (cardTypes.has('updatedBlentos')) {
		try {
			// https://ufos-api.microcosm.blue/records?collection=app.blento.card
			const response = await fetch(
				'https://ufos-api.microcosm.blue/records?collection=app.blento.card'
			);
			recentRecords = await response.json();
		} catch (error) {
			console.error('failed to fetch recent records', error);
		}
	}

	let recentPosts;

	if (cardTypes.has('latestPost')) {
		try {
			const agent = new AtpBaseClient({ service: 'https://api.bsky.app' });
			const authorFeed = await agent.app.bsky.feed.getAuthorFeed({
				actor: did,
				filter: 'posts_no_replies',
				limit: 2
			});
			console.log(authorFeed.data);
			recentPosts = JSON.parse(JSON.stringify(authorFeed.data));
		} catch (error) {
			console.error('failed to fetch recent posts', error);
		}
	}

	let metrics;
	// try {
	// 	const endAt = Date.now();

	// 	const startAt = new Date();
	// 	startAt.setFullYear(startAt.getFullYear() - 1);

	// 	const params = new URLSearchParams({
	// 		startAt: startAt.getTime().toString(),
	// 		endAt: endAt.toString(),
	// 		unit: 'year',
	// 		timezone: 'America/Los_Angeles',
	// 		path: '/' + handle
	// 	});

	// 	const url = `https://umami-wispy-dream-8048.fly.dev/api/websites/${env.ANALYTICS_WEBSITE_ID}/stats?${params}`;

	// 	console.log(url);
	// 	const metricsResponse = await fetch(url, {
	// 		method: 'GET',
	// 		headers: {
	// 			Authorization: 'Bearer ' + env.ANALYTICS_TOKEN
	// 		}
	// 	});

	// 	metrics = await metricsResponse.json();
	// 	console.log(metrics);
	// } catch (error) {
	// 	console.error(error);
	// }

	return {
		did,
		data: JSON.parse(JSON.stringify(downloadedData)) as DownloadedData,
		additionalData: {
			recentRecords,
			recentPosts,
			metrics
		}
	};
}
