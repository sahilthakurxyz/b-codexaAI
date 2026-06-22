import { groq } from "../../config/groq.js";
import { SYSTEM_PROMPT } from "../prompts/systemPrompt.js";
/**
 * @param {string} message
 * @param {string} model
 * @param {AbortSignal} signal
 * @returns {AsyncGenerator<string>} yields text tokens
 */
export async function* streamGroq(message, model, signal) {
  const stream = await groq.chat.completions.create(
    {
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message },
      ],
      temperature: 1,
      max_completion_tokens: 7000,
      top_p: 1,
      stream: true,
    },
    { signal },
  );

  for await (const chunk of stream) {
    const token = chunk.choices?.[0]?.delta?.content;
    if (token) yield token;
  }
}
