import Groq from "groq-sdk";

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Pollinations.ai image endpoint — no key needed, just a URL pattern.
// https://image.pollinations.ai/prompt/<url-encoded-prompt>
export const imageProviderConfig = {
  baseUrl: "https://image.pollinations.ai/prompt",
};
