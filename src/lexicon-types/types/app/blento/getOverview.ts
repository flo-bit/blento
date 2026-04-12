import type {} from "@atcute/lexicons";
import * as v from "@atcute/lexicons/validations";
import type {} from "@atcute/lexicons/ambient";

const _collectionStatsSchema = /*#__PURE__*/ v.object({
  $type: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.literal("app.blento.getOverview#collectionStats"),
  ),
  collection: /*#__PURE__*/ v.string(),
  records: /*#__PURE__*/ v.integer(),
  unique_users: /*#__PURE__*/ v.integer(),
});
const _mainSchema = /*#__PURE__*/ v.query("app.blento.getOverview", {
  params: null,
  output: {
    type: "lex",
    schema: /*#__PURE__*/ v.object({
      get collections() {
        return /*#__PURE__*/ v.array(collectionStatsSchema);
      },
      total_records: /*#__PURE__*/ v.integer(),
    }),
  },
});

type collectionStats$schematype = typeof _collectionStatsSchema;
type main$schematype = typeof _mainSchema;

export interface collectionStatsSchema extends collectionStats$schematype {}
export interface mainSchema extends main$schematype {}

export const collectionStatsSchema =
  _collectionStatsSchema as collectionStatsSchema;
export const mainSchema = _mainSchema as mainSchema;

export interface CollectionStats extends v.InferInput<
  typeof collectionStatsSchema
> {}

export interface $params {}
export interface $output extends v.InferXRPCBodyInput<mainSchema["output"]> {}

declare module "@atcute/lexicons/ambient" {
  interface XRPCQueries {
    "app.blento.getOverview": mainSchema;
  }
}
