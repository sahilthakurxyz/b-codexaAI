import { streamGroq } from "./groq.adapter.js";

/**
 * Only one provider for now (Groq, free tier). Every chat-style intent
 * (coding / complex_coding / content_writing / live_information / general)
 * routes through here — what differs is just which Groq MODEL is passed in
 * via `handlerConfig.model` (set per-intent in config/models.config.js).
 *
 * Kept as its own file (rather than inlining into the controller) so that
 * adding a second free provider later is a one-line change here, not a
 * rewrite of the controller.
 */
export async function* chatHandler({ model }, message, signal) {
  yield* streamGroq(message, model, signal);
}
