import type {} from '@atcute/lexicons';
import * as v from '@atcute/lexicons/validations';
import type {} from '@atcute/lexicons/ambient';

const _mainSchema = /*#__PURE__*/ v.procedure('app.blento.notifyOfUpdate', {
	params: null,
	input: {
		type: 'lex',
		schema: /*#__PURE__*/ v.object({
			/**
			 * Single AT URI to fetch and index
			 */
			uri: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.resourceUriString()),
			/**
			 * Batch of AT URIs to fetch and index (max 25)
			 * @maxLength 25
			 */
			uris: /*#__PURE__*/ v.optional(
				/*#__PURE__*/ v.constrain(/*#__PURE__*/ v.array(/*#__PURE__*/ v.resourceUriString()), [
					/*#__PURE__*/ v.arrayLength(0, 25)
				])
			)
		})
	},
	output: {
		type: 'lex',
		schema: /*#__PURE__*/ v.object({
			/**
			 * Number of records deleted (not found on PDS)
			 */
			deleted: /*#__PURE__*/ v.integer(),
			/**
			 * Errors for individual URIs that could not be processed
			 */
			errors: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.array(/*#__PURE__*/ v.string())),
			/**
			 * Number of records created or updated
			 */
			indexed: /*#__PURE__*/ v.integer()
		})
	}
});

type main$schematype = typeof _mainSchema;

export interface mainSchema extends main$schematype {}

export const mainSchema = _mainSchema as mainSchema;

export interface $params {}
export interface $input extends v.InferXRPCBodyInput<mainSchema['input']> {}
export interface $output extends v.InferXRPCBodyInput<mainSchema['output']> {}

declare module '@atcute/lexicons/ambient' {
	interface XRPCProcedures {
		'app.blento.notifyOfUpdate': mainSchema;
	}
}
