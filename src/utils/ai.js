import { groq } from "../config/groq.js";
export const generateAITitle = async (message) => {
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          "Generate a very short conversation title in less than 5 words. Only return the title.",
      },
      {
        role: "user",
        content: message,
      },
    ],
    model: "llama-3.1-8b-instant",
    temperature: 0.3,
    max_completion_tokens: 6,
  });
  return completion.choices[0]?.message?.content;
};
export const generateAIResponse = async (message) => {
  return await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `
Always respond using valid Markdown.
When using code blocks inside lists:
- Always insert a blank line after a fenced code block.

Example:

1. Install React

\`\`\`bash
npm install react
\`\`\`

2. Start the application

\`\`\`bash
npm run dev
\`\`\`

Formatting rules:

- Use Markdown.
- Use # for main titles.
- Use ## for sections.
- Use bullet lists.
- Use numbered lists.
- Use headings when appropriate.
- Use bullet points for lists.
- Use numbered lists for steps.
- Use code fences (\`\`\`) for code.
- Use tables when comparing things.
- Add blank lines between sections.
- Never return plain text walls.
- For simple questions, respond naturally without unnecessary formatting.
`,
      },
      {
        role: "user",
        content: message,
      },
    ],
    model: "meta-llama/llama-4-scout-17b-16e-instruct",

    temperature: 1,
    max_completion_tokens: 7000,
    top_p: 1,
    stream: true,
  });
};
