import type {} from '@atcute/lexicons';
import * as v from '@atcute/lexicons/validations';
import type {} from '@atcute/lexicons/ambient';

const _mainSchema = /*#__PURE__*/ v.record(
	/*#__PURE__*/ v.tidString(),
	/*#__PURE__*/ v.object({
		$type: /*#__PURE__*/ v.literal('app.blento.node'),
		content: /*#__PURE__*/ v.unknown(),
		kind: /*#__PURE__*/ v.string<'container' | 'document' | 'leaf' | (string & {})>(),
		layout: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.unknown()),
		page: /*#__PURE__*/ v.string(),
		parent: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
		rank: /*#__PURE__*/ v.string(),
		source: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.unknown()),
		style: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.unknown()),
		updatedAt: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.datetimeString()),
		version: /*#__PURE__*/ v.integer()
	})
);

type main$schematype = typeof _mainSchema;

export interface mainSchema extends main$schematype {}

export const mainSchema = _mainSchema as mainSchema;

export interface Main extends v.InferInput<typeof mainSchema> {}

declare module '@atcute/lexicons/ambient' {
	interface Records {
		'app.blento.node': mainSchema;
	}
}
