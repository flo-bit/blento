import type {} from '@atcute/lexicons';
import * as v from '@atcute/lexicons/validations';
import type {} from '@atcute/lexicons/ambient';

const _mainSchema = /*#__PURE__*/ v.record(
	/*#__PURE__*/ v.tidString(),
	/*#__PURE__*/ v.object({
		$type: /*#__PURE__*/ v.literal('app.blento.card'),
		cardData: /*#__PURE__*/ v.unknown(),
		cardType: /*#__PURE__*/ v.string(),
		color: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
		h: /*#__PURE__*/ v.integer(),
		mobileH: /*#__PURE__*/ v.integer(),
		mobileW: /*#__PURE__*/ v.integer(),
		mobileX: /*#__PURE__*/ v.integer(),
		mobileY: /*#__PURE__*/ v.integer(),
		page: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
		updatedAt: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.datetimeString()),
		version: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.integer()),
		w: /*#__PURE__*/ v.integer(),
		x: /*#__PURE__*/ v.integer(),
		y: /*#__PURE__*/ v.integer()
	})
);

type main$schematype = typeof _mainSchema;

export interface mainSchema extends main$schematype {}

export const mainSchema = _mainSchema as mainSchema;

export interface Main extends v.InferInput<typeof mainSchema> {}

declare module '@atcute/lexicons/ambient' {
	interface Records {
		'app.blento.card': mainSchema;
	}
}
