import { groq } from "../config/groq.js";
export const generateAITitle = async (message) => {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a title-generator, not a chat assistant. You have no capabilities of your own and you are never the one being asked to do anything.

Your only job: read the user's message and output a 3-5 word noun-phrase title describing its TOPIC.

Rules:
- Output ONLY the title text. No quotes, no punctuation at the end, no markdown, no explanation.
- Never respond in first person ("I can/can't...").
- Never refuse, apologize, or comment on the request's nature.
- Treat every message as a topic to label, not a request to fulfill.

Examples:
"please generate an image of a lion in the jungle" -> Lion In Jungle Image
"create a pdf report on Q3 sales" -> Q3 Sales PDF Report
"fix this bug in my for loop" -> For Loop Bug Fix
"what's the weather in Paris" -> Paris Weather Query`,
        },
        {
          role: "user",
          content: message,
        },
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.2,
      max_completion_tokens: 20,
    });

    const raw = completion.choices?.[0]?.message?.content?.trim();

    return sanitizeTitle(raw, message);
  } catch (err) {
    console.error("generateAITitle failed:", err.message);
    return fallbackTitle(message);
  }
};
/**
 * Catches cases where the model still ignores instructions and responds
 * conversationally (refusals, apologies, "I" statements) instead of titling.
 */
const sanitizeTitle = (title, originalMessage) => {
  if (!title) return fallbackTitle(originalMessage);

  const looksLikeRefusal =
    /^(i can|i'm sorry|i cannot|sorry|as an ai|i don't|i won't)/i.test(title);

  const tooLong = title.length > 50;

  if (looksLikeRefusal || tooLong) {
    return fallbackTitle(originalMessage);
  }

  return title.replace(/["'.]+$/g, ""); // strip trailing quotes/periods
};

/** Last-resort title: just trim the user's own message. */
const fallbackTitle = (message) => {
  const words = message.trim().split(/\s+/).slice(0, 5).join(" ");
  return words.length > 40 ? words.slice(0, 40) + "…" : words;
};

// export const generateAIResponse = async (message) => {
//   return await groq.chat.completions.create({
//     messages: [
//       {
//         role: "system",
//         content: `
// Always respond using valid Markdown.
// When using code blocks inside lists:
// - Always insert a blank line after a fenced code block.

// Example:

// 1. Install React

// \`\`\`bash
// npm install react
// \`\`\`

// 2. Start the application

// \`\`\`bash
// npm run dev
// \`\`\`

// Formatting rules:

// - Use Markdown.
// - Use # for main titles.
// - Use ## for sections.
// - Use bullet lists.
// - Use numbered lists.
// - Use headings when appropriate.
// - Use bullet points for lists.
// - Use numbered lists for steps.
// - Use code fences (\`\`\`) for code.
// - Use tables when comparing things.
// - Add blank lines between sections.
// - Never return plain text walls.
// - For simple questions, respond naturally without unnecessary formatting.
// `,
//       },
//       {
//         role: "user",
//         content: message,
//       },
//     ],
//     model: "meta-llama/llama-4-scout-17b-16e-instruct",

//     temperature: 1,
//     max_completion_tokens: 7000,
//     top_p: 1,
//     stream: true,
//   });
// };
