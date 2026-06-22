import { groq } from "../config/groq.js";
import { CLASSIFIER_MODEL, INTENT_TYPES } from "../config/models.config.js";
const VALID_TYPES = new Set(Object.values(INTENT_TYPES));
const SYSTEM_PROMPT = `You are an intent classifier for an AI routing system.
Return ONLY raw JSON. No markdown, no code fences, no explanation.

Schema:
{
  "types": ["coding" | "complex_coding" | "content_writing" | "image_generation" | "pdf_generation" | "live_information" | "general"],
  "cleanedMessage": "string"
}

Definitions:
- coding: simple code snippets, syntax questions, small fixes.
- complex_coding: architecture, debugging across files, refactors, system design, anything needing deep reasoning.
- content_writing: blog posts, emails, essays, marketing copy, social posts.
- live_information: needs current/real-time facts (news, prices, weather, scores, "today", "latest").
- image_generation: user wants an image/picture/illustration created.
- pdf_generation: user wants a document/pdf/report/invoice file produced.
- general: greetings, simple Q&A, anything not fitting above.

Rules:
- "types" may contain more than one value if the message genuinely matches multiple.
- "cleanedMessage" = the user's request rewritten clearly, grammatically, with filler removed. Preserve all technical detail. Do not answer the request — only restate it.
- If unsure, default to "general".`;

/**
 * Classify a raw user message into intent type(s) + a cleaned-up restatement.
 * Uses a small, cheap, temperature=0 model so routing is fast and deterministic.
 *
 * @param {string} message
 * @returns {Promise<{types: string[], cleanedMessage: string}>}
 */
export const classifyMessage = async (message) => {
  try {
    const response = await groq.chat.completions.create({
      model: CLASSIFIER_MODEL.model,
      temperature: 0,
      max_completion_tokens: 300,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message },
      ],
    });

    const raw = response.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);

    const types = Array.isArray(parsed.types)
      ? parsed.types.filter((t) => VALID_TYPES.has(t))
      : [];

    return {
      types: types.length ? types : [INTENT_TYPES.GENERAL],
      cleanedMessage:
        typeof parsed.cleanedMessage === "string" &&
        parsed.cleanedMessage.trim()
          ? parsed.cleanedMessage.trim()
          : message,
    };
  } catch (err) {
    console.error(
      "classifyMessage failed, falling back to general:",
      err.message,
    );
    return { types: [INTENT_TYPES.GENERAL], cleanedMessage: message };
  }
};
