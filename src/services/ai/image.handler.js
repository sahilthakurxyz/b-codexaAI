import { imageProviderConfig } from "../../config/groq.js";

/**
 * Pollinations.ai is a free, keyless image generation API — you build a
 * URL with the prompt baked in and it returns the image directly. No
 * account, no API key, no billing.
 *
 * Docs: https://pollinations.ai
 *
 * Non-streaming: caller awaits this once, then sends ONE SSE event
 * containing the final image URL.
 *
 * @param {{model:string}} _handlerConfig - reserved, unused for Pollinations
 * @param {string} prompt
 * @param {AbortSignal} signal
 * @returns {Promise<{url:string, fileType:"image", mimeType:string}>}
 */
export const imageHandler = async (_handlerConfig, prompt, signal) => {
  const encodedPrompt = encodeURIComponent(prompt);
  // width/height are optional query params Pollinations supports;
  // nologo=true strips their watermark on the free tier.
  const url = `${imageProviderConfig.baseUrl}/${encodedPrompt}?width=1024&height=1024&nologo=true`;

  // Pollinations generates the image lazily on first request to that URL,
  // so we ping it once here to confirm it actually resolves before telling
  // the frontend "done" -- otherwise the user could get a broken <img>.
  const response = await fetch(url, { method: "GET", signal });

  if (!response.ok) {
    throw new Error(
      `Image provider error: ${response.status} ${response.statusText}`,
    );
  }

  return {
    url,
    fileType: "image",
    mimeType: response.headers.get("content-type") || "image/jpeg",
  };
};
