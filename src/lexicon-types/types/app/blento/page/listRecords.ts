import type {} from '@atcute/lexicons';
import * as v from '@atcute/lexicons/validations';
import type {} from '@atcute/lexicons/ambient';
import * as AppBlentoPage from '../page.js';

const _mainSchema = /*#__PURE__*/ v.query('app.blento.page.listRecords', {
	params: /*#__PURE__*/ v.object({
		/**
		 * Filter by DID or handle (triggers on-demand backfill)
		 */
		actor: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.actorIdentifierString()),
		cursor: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
		/**
		 * Filter by description
		 */
		description: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
		/**
		 * @minimum 1
		 * @maximum 200
		 * @default 50
		 */
		limit: /*#__PURE__*/ v.optional(
			/*#__PURE__*/ v.constrain(/*#__PURE__*/ v.integer(), [/*#__PURE__*/ v.integerRange(1, 200)]),
			50
		),
		/**
		 * Filter by name
		 */
		name: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
		/**
		 * Sort direction (default: desc for dates/numbers/counts, asc for strings)
		 */
		order: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string<'asc' | 'desc' | (string & {})>()),
		/**
		 * Include profile + identity info keyed by DID
		 */
		profiles: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.boolean()),
		/**
		 * Field to sort by (default: time_us)
		 */
		sort: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string<'description' | 'name' | (string & {})>())
	}),
	output: {
		type: 'lex',
		schema: /*#__PURE__*/ v.object({
			cursor: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
			get profiles() {
				return /*#__PURE__*/ v.optional(/*#__PURE__*/ v.array(profileEntrySchema));
			},
			get records() {
				return /*#__PURE__*/ v.array(recordSchema);
			}
		})
	}
});
const _profileEntrySchema = /*#__PURE__*/ v.object({
	$type: /*#__PURE__*/ v.optional(
		/*#__PURE__*/ v.literal('app.blento.page.listRecords#profileEntry')
	),
	cid: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
	collection: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.nsidString()),
	did: /*#__PURE__*/ v.didString(),
	handle: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
	record: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.unknown()),
	rkey: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
	uri: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.resourceUriString())
});
const _recordSchema = /*#__PURE__*/ v.object({
	$type: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.literal('app.blento.page.listRecords#record')),
	cid: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
	collection: /*#__PURE__*/ v.nsidString(),
	did: /*#__PURE__*/ v.didString(),
	get record() {
		return /*#__PURE__*/ v.optional(AppBlentoPage.mainSchema);
	},
	rkey: /*#__PURE__*/ v.string(),
	time_us: /*#__PURE__*/ v.integer(),
	uri: /*#__PURE__*/ v.resourceUriString()
});

type main$schematype = typeof _mainSchema;
type profileEntry$schematype = typeof _profileEntrySchema;
type record$schematype = typeof _recordSchema;

export interface mainSchema extends main$schematype {}
export interface profileEntrySchema extends profileEntry$schematype {}
export interface recordSchema extends record$schematype {}

export const mainSchema = _mainSchema as mainSchema;
export const profileEntrySchema = _profileEntrySchema as profileEntrySchema;
export const recordSchema = _recordSchema as recordSchema;

export interface ProfileEntry extends v.InferInput<typeof profileEntrySchema> {}
export interface Record extends v.InferInput<typeof recordSchema> {}

export interface $params extends v.InferInput<mainSchema['params']> {}
export interface $output extends v.InferXRPCBodyInput<mainSchema['output']> {}

declare module '@atcute/lexicons/ambient' {
	interface XRPCQueries {
		'app.blento.page.listRecords': mainSchema;
	}
}
