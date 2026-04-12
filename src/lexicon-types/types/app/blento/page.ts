import type {} from "@atcute/lexicons";
import * as v from "@atcute/lexicons/validations";
import type {} from "@atcute/lexicons/ambient";

const _mainSchema = /*#__PURE__*/ v.record(
  /*#__PURE__*/ v.string(),
  /*#__PURE__*/ v.object({
    $type: /*#__PURE__*/ v.literal("app.blento.page"),
    description: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
    /**
     * @accept image/*
     */
    icon: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.blob()),
    name: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
    get preferences() {
      return /*#__PURE__*/ v.optional(preferencesSchema);
    },
    url: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.genericUriString()),
  }),
);
const _preferencesSchema = /*#__PURE__*/ v.object({
  $type: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.literal("app.blento.page#preferences"),
  ),
  accentColor: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
  baseColor: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
  editedOn: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.integer()),
  hideProfile: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.boolean()),
  hideProfileSection: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.boolean()),
  profilePosition: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
});

type main$schematype = typeof _mainSchema;
type preferences$schematype = typeof _preferencesSchema;

export interface mainSchema extends main$schematype {}
export interface preferencesSchema extends preferences$schematype {}

export const mainSchema = _mainSchema as mainSchema;
export const preferencesSchema = _preferencesSchema as preferencesSchema;

export interface Main extends v.InferInput<typeof mainSchema> {}
export interface Preferences extends v.InferInput<typeof preferencesSchema> {}

declare module "@atcute/lexicons/ambient" {
  interface Records {
    "app.blento.page": mainSchema;
  }
}
