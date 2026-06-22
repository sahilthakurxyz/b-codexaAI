export const SYSTEM_PROMPT = `
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
- Use code fences (\`\`\`) for code.
- Use tables when comparing things.
- Add blank lines between sections.
- Never return plain text walls.
- For simple questions, respond naturally without unnecessary formatting.
`;
