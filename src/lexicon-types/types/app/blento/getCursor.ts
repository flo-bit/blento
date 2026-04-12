import type {} from "@atcute/lexicons";
import * as v from "@atcute/lexicons/validations";
import type {} from "@atcute/lexicons/ambient";

const _mainSchema = /*#__PURE__*/ v.query("app.blento.getCursor", {
  params: null,
  output: {
    type: "lex",
    schema: /*#__PURE__*/ v.object({
      date: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
      seconds_ago: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.integer()),
      time_us: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.integer()),
    }),
  },
});

type main$schematype = typeof _mainSchema;

export interface mainSchema extends main$schematype {}

export const mainSchema = _mainSchema as mainSchema;

export interface $params {}
export interface $output extends v.InferXRPCBodyInput<mainSchema["output"]> {}

declare module "@atcute/lexicons/ambient" {
  interface XRPCQueries {
    "app.blento.getCursor": mainSchema;
  }
}
