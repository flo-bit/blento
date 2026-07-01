import type {} from '@atcute/lexicons';
import * as v from '@atcute/lexicons/validations';
import type {} from '@atcute/lexicons/ambient';

const _mainSchema = /*#__PURE__*/ v.record(
	/*#__PURE__*/ v.tidString(),
	/*#__PURE__*/ v.object({
		$type: /*#__PURE__*/ v.literal('app.blento.section'),
		index: /*#__PURE__*/ v.integer(),
		name: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
		page: /*#__PURE__*/ v.string(),
		sectionData: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.unknown()),
		sectionType: /*#__PURE__*/ v.string(),
		updatedAt: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.datetimeString()),
		version: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.integer())
	})
);

type main$schematype = typeof _mainSchema;

export interface mainSchema extends main$schematype {}

export const mainSchema = _mainSchema as mainSchema;

export interface Main extends v.InferInput<typeof mainSchema> {}

declare module '@atcute/lexicons/ambient' {
	interface Records {
		'app.blento.section': mainSchema;
	}
}
