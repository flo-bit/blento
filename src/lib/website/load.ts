import {
	type Collection,
	type DownloadedData,
	type IndividualCollections,
	type ListCollections
} from './types';
import { getRecord, listRecords, resolveHandle } from '$lib/oauth/atproto';
import type { Record as ListRecord } from '@atproto/api/dist/client/types/com/atproto/repo/listRecords';
import { data } from './data';
import { CardDefinitionsByType } from '$lib/cards';
import type { Item } from '$lib/types';

type LoadedData = {
	did: string;
	data: DownloadedData;
	additionalData: Record<string, unknown>;
	updatedAt: number;
};

export async function loadData(
	handle: string,
	platform?: App.Platform,
	forceUpdate: boolean = false
): Promise<LoadedData> {
	console.log(handle);
	if (!forceUpdate) {
		try {
			const cachedResult = await platform?.env?.USER_DATA_CACHE?.get(handle);

			if (cachedResult) {
				const result = JSON.parse(cachedResult);
				const update = result.updatedAt;
				const timePassed = (Date.now() - update) / 1000;
				console.log(
					'using cached result for handle',
					handle,
					'last update',
					timePassed,
					'seconds ago'
				);
				return migrateData(JSON.parse(cachedResult));
			}
		} catch (error) {
			console.log('getting cached result failed', error);
		}
	}

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
					const record = getRecord({ did, collection, rkey }).catch((error) => {
						console.error('error getting record', rkey, 'for collection', collection);
					});
					promises.push({
						collection,
						rkey,
						record
					});
				}
			} else if (cfg === 'all') {
				const records = listRecords({ did, collection }).catch((error) => {
					console.error('error getting records for collection', collection);
				});
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
		Object.values(downloadedData['app.blento.card']).map((v) => v.value.cardType) as string[]
	);

	const cardTypesArray = Array.from(cardTypes);

	const additionDataPromises: Record<string, Promise<unknown>> = {};

	const loadOptions = { did, handle, platform };

	for (const cardType of cardTypesArray) {
		const cardDef = CardDefinitionsByType[cardType];

		if (cardDef.loadData) {
			additionDataPromises[cardType] = cardDef
				.loadData(
					Object.values(downloadedData['app.blento.card'])
						.filter((v) => cardType == v.value.cardType)
						.map((v) => v.value) as Item[],
					loadOptions
				)
				.catch((error) => {
					console.error('error getting additional data for', cardType, error);
				});
		}
	}

	await Promise.all(Object.values(additionDataPromises));

	const additionalData: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(additionDataPromises)) {
		try {
			additionalData[key] = await value;
		} catch (error) {
			console.log('error loading', key, error);
		}
	}

	const result = {
		did,
		data: JSON.parse(JSON.stringify(downloadedData)) as DownloadedData,
		additionalData,
		updatedAt: Date.now()
	};

	await platform?.env?.USER_DATA_CACHE?.put(handle, JSON.stringify(result));

	return migrateData(result);
}

function migrateFromV0ToV1(data: LoadedData): LoadedData {
	for (const card of Object.values(data.data['app.blento.card']).map((i) => i.value) as Item[]) {
		if (card.version) continue;
		card.x *= 2;
		card.y *= 2;
		card.h *= 2;
		card.w *= 2;
		card.mobileX *= 2;
		card.mobileY *= 2;
		card.mobileH *= 2;
		card.mobileW *= 2;
		card.version = 1;
	}

	return data;
}

function migrateData(data: LoadedData): LoadedData {
	return migrateFromV0ToV1(data);
}
