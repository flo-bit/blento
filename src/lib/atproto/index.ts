export { user, login, signup, logout, initClient } from './auth.svelte';
export { metadata } from './metadata';

export {
	parseUri,
	resolveHandle,
	getPDS,
	getDetailedProfile,
	getClient,
	listRecords,
	getRecord,
	putRecord,
	deleteRecord,
	uploadBlob,
	describeRepo,
	getBlobURL,
	getCDNImageBlobUrl,
	searchActorsTypeahead,
	getAuthorFeed
} from './methods';
