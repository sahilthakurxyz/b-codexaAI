import {
  INTENT_TYPES,
  MODEL_MAP,
  TYPE_PRIORITY,
} from "../config/models.config.js";

/**
 * Given the array of types returned by the classifier, pick the single
 * handler config to actually execute, using TYPE_PRIORITY as tie-breaker.
 *
 * @param {string[]} types
 * @returns {{provider:string, model:string, stream:boolean, handler:string, matchedType:string}}
 */
export const resolveHandler = (types = []) => {
  const matchedType =
    TYPE_PRIORITY.find((t) => types.includes(t)) || INTENT_TYPES.GENERAL;

  const config = MODEL_MAP[matchedType] || MODEL_MAP[INTENT_TYPES.GENERAL];

  return { ...config, matchedType };
};
