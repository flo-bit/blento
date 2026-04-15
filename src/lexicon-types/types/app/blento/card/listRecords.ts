import type {} from '@atcute/lexicons';
import * as v from '@atcute/lexicons/validations';
import type {} from '@atcute/lexicons/ambient';
import * as AppBlentoCard from '../card.js';

const _mainSchema = /*#__PURE__*/ v.query('app.blento.card.listRecords', {
	params: /*#__PURE__*/ v.object({
		/**
		 * Filter by DID or handle (triggers on-demand backfill)
		 */
		actor: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.actorIdentifierString()),
		/**
		 * Filter by cardType
		 */
		cardType: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
		/**
		 * Filter by color
		 */
		color: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
		cursor: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
		/**
		 * Maximum value for h
		 */
		hMax: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
		/**
		 * Minimum value for h
		 */
		hMin: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
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
		 * Maximum value for mobileH
		 */
		mobileHMax: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
		/**
		 * Minimum value for mobileH
		 */
		mobileHMin: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
		/**
		 * Maximum value for mobileW
		 */
		mobileWMax: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
		/**
		 * Minimum value for mobileW
		 */
		mobileWMin: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
		/**
		 * Maximum value for mobileX
		 */
		mobileXMax: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
		/**
		 * Minimum value for mobileX
		 */
		mobileXMin: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
		/**
		 * Maximum value for mobileY
		 */
		mobileYMax: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
		/**
		 * Minimum value for mobileY
		 */
		mobileYMin: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
		/**
		 * Sort direction (default: desc for dates/numbers/counts, asc for strings)
		 */
		order: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string<'asc' | 'desc' | (string & {})>()),
		/**
		 * Filter by page
		 */
		page: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
		/**
		 * Include profile + identity info keyed by DID
		 */
		profiles: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.boolean()),
		/**
		 * Field to sort by (default: time_us)
		 */
		sort: /*#__PURE__*/ v.optional(
			/*#__PURE__*/ v.string<
				| 'cardType'
				| 'color'
				| 'h'
				| 'mobileH'
				| 'mobileW'
				| 'mobileX'
				| 'mobileY'
				| 'page'
				| 'updatedAt'
				| 'version'
				| 'w'
				| 'x'
				| 'y'
				| (string & {})
			>()
		),
		/**
		 * Maximum value for updatedAt
		 */
		updatedAtMax: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
		/**
		 * Minimum value for updatedAt
		 */
		updatedAtMin: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
		/**
		 * Maximum value for version
		 */
		versionMax: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
		/**
		 * Minimum value for version
		 */
		versionMin: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
		/**
		 * Maximum value for w
		 */
		wMax: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
		/**
		 * Minimum value for w
		 */
		wMin: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
		/**
		 * Maximum value for x
		 */
		xMax: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
		/**
		 * Minimum value for x
		 */
		xMin: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
		/**
		 * Maximum value for y
		 */
		yMax: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
		/**
		 * Minimum value for y
		 */
		yMin: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string())
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
		/*#__PURE__*/ v.literal('app.blento.card.listRecords#profileEntry')
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
	$type: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.literal('app.blento.card.listRecords#record')),
	cid: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
	collection: /*#__PURE__*/ v.nsidString(),
	did: /*#__PURE__*/ v.didString(),
	get record() {
		return /*#__PURE__*/ v.optional(AppBlentoCard.mainSchema);
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
		'app.blento.card.listRecords': mainSchema;
	}
}
