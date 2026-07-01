import type {} from '@atcute/lexicons';
import * as v from '@atcute/lexicons/validations';

const _cardSchema = /*#__PURE__*/ v.object({
	$type: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.literal('app.blento.defs#card')),
	cardType: /*#__PURE__*/ v.string()
});
const _containerSchema = /*#__PURE__*/ v.object({
	$type: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.literal('app.blento.defs#container')),
	containerType: /*#__PURE__*/ v.string()
});
const _gridCellSchema = /*#__PURE__*/ v.object({
	$type: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.literal('app.blento.defs#gridCell')),
	h: /*#__PURE__*/ v.integer(),
	mobileH: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.integer()),
	mobileW: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.integer()),
	mobileX: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.integer()),
	mobileY: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.integer()),
	rotation: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.integer()),
	w: /*#__PURE__*/ v.integer(),
	x: /*#__PURE__*/ v.integer(),
	y: /*#__PURE__*/ v.integer()
});

type card$schematype = typeof _cardSchema;
type container$schematype = typeof _containerSchema;
type gridCell$schematype = typeof _gridCellSchema;

export interface cardSchema extends card$schematype {}
export interface containerSchema extends container$schematype {}
export interface gridCellSchema extends gridCell$schematype {}

export const cardSchema = _cardSchema as cardSchema;
export const containerSchema = _containerSchema as containerSchema;
export const gridCellSchema = _gridCellSchema as gridCellSchema;

export interface Card extends v.InferInput<typeof cardSchema> {}
export interface Container extends v.InferInput<typeof containerSchema> {}
export interface GridCell extends v.InferInput<typeof gridCellSchema> {}
