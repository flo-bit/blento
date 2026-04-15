import type {} from '@atcute/lexicons';
import * as v from '@atcute/lexicons/validations';
import type {} from '@atcute/lexicons/ambient';

const _mainSchema = /*#__PURE__*/ v.query('app.blento.getProfile', {
	params: /*#__PURE__*/ v.object({
		/**
		 * DID or handle of the user
		 */
		actor: /*#__PURE__*/ v.actorIdentifierString()
	}),
	output: {
		type: 'lex',
		schema: /*#__PURE__*/ v.object({
			get profiles() {
				return /*#__PURE__*/ v.array(profileEntrySchema);
			}
		})
	}
});
const _profileEntrySchema = /*#__PURE__*/ v.object({
	$type: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.literal('app.blento.getProfile#profileEntry')),
	cid: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
	collection: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.nsidString()),
	did: /*#__PURE__*/ v.didString(),
	handle: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
	record: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.unknown()),
	rkey: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
	uri: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.resourceUriString())
});

type main$schematype = typeof _mainSchema;
type profileEntry$schematype = typeof _profileEntrySchema;

export interface mainSchema extends main$schematype {}
export interface profileEntrySchema extends profileEntry$schematype {}

export const mainSchema = _mainSchema as mainSchema;
export const profileEntrySchema = _profileEntrySchema as profileEntrySchema;

export interface ProfileEntry extends v.InferInput<typeof profileEntrySchema> {}

export interface $params extends v.InferInput<mainSchema['params']> {}
export interface $output extends v.InferXRPCBodyInput<mainSchema['output']> {}

declare module '@atcute/lexicons/ambient' {
	interface XRPCQueries {
		'app.blento.getProfile': mainSchema;
	}
}
