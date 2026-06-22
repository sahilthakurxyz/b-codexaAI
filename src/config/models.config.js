/**
 * Central registry: maps an intent "type" to the provider/model that should
 * handle it, whether the response is streamed, and which handler module to call.
 *
 * Add new models/providers here only — nothing else in the app should
 * hardcode a model name.
 */

export const INTENT_TYPES = {
  CODING: "coding",
  COMPLEX_CODING: "complex_coding",
  CONTENT_WRITING: "content_writing",
  LIVE_INFORMATION: "live_information",
  IMAGE_GENERATION: "image_generation",
  PDF_GENERATION: "pdf_generation",
  GENERAL: "general",
};

/**
 * Priority order used when a message matches multiple types.
 * Earlier = wins. File-producing types should usually win over chat types
 * because they change the whole response shape (non-stream vs stream).
 */
export const TYPE_PRIORITY = [
  INTENT_TYPES.PDF_GENERATION,
  INTENT_TYPES.IMAGE_GENERATION,
  INTENT_TYPES.COMPLEX_CODING,
  INTENT_TYPES.LIVE_INFORMATION,
  INTENT_TYPES.CONTENT_WRITING,
  INTENT_TYPES.CODING,
  INTENT_TYPES.GENERAL,
];

export const MODEL_MAP = {
  [INTENT_TYPES.CODING]: {
    provider: "groq",
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    stream: true,
    handler: "chatHandler",
  },
  [INTENT_TYPES.COMPLEX_CODING]: {
    provider: "groq",
    // Bigger free Groq model for harder reasoning/multi-file problems.
    // Check your Groq console for the exact id available to you
    // (e.g. an OpenAI-oss or larger Llama variant) and swap it in here.
    model: "openai/gpt-oss-120b",
    stream: true,
    handler: "chatHandler",
  },
  [INTENT_TYPES.CONTENT_WRITING]: {
    provider: "groq",
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    stream: true,
    handler: "chatHandler",
  },
  [INTENT_TYPES.LIVE_INFORMATION]: {
    provider: "groq",
    // Groq's "compound" model has built-in web search/browsing tools,
    // so it's the only one of your free models that can answer
    // "what's happening right now" style questions.
    model: "groq/compound",
    stream: true,
    handler: "chatHandler",
  },
  [INTENT_TYPES.IMAGE_GENERATION]: {
    provider: "image",
    model: "pollinations-default",
    stream: false,
    handler: "imageHandler",
  },
  [INTENT_TYPES.PDF_GENERATION]: {
    provider: "pdf",
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    stream: false,
    handler: "pdfHandler",
  },
  [INTENT_TYPES.GENERAL]: {
    provider: "groq",
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    stream: true,
    handler: "chatHandler",
  },
};

// Small/fast model used ONLY for classification — never for the real answer.
export const CLASSIFIER_MODEL = {
  provider: "groq",
  model: "llama-3.1-8b-instant",
};
