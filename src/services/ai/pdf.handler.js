import PDFDocument from "pdfkit";
import { createWriteStream } from "fs";
import { mkdir } from "fs/promises";
import path from "path";
import { groq } from "../../config/groq.js";
const OUTPUT_DIR = "./generated/pdfs";
/**
 * Two-step process:
 *  1. Ask an LLM to draft the document content as structured text.
 *  2. Render that content into an actual PDF file on disk (or upload to S3/Cloud Storage).
 *
 * Non-streaming: caller awaits the full file, then sends ONE SSE event.
 *
 * @param {{model:string}} _handlerConfig - reserved for future PDF-specific models
 * @param {string} prompt
 * @param {AbortSignal} signal
 * @returns {Promise<{url:string, fileType:"pdf", mimeType:string}>}
 */
export const pdfHandler = async ({ model }, prompt, signal) => {
  const draft = await groq.chat.completions.create(
    {
      model,
      temperature: 0.7,
      max_completion_tokens: 4000,
      messages: [
        {
          role: "system",
          content:
            "Draft clear, well-structured document content (title, sections, paragraphs) for a PDF the user requested. Plain text with line breaks between sections, no markdown symbols.",
        },
        { role: "user", content: prompt },
      ],
    },
    { signal },
  );

  const content =
    draft.choices?.[0]?.message?.content ?? "No content generated.";

  await mkdir(OUTPUT_DIR, { recursive: true });
  const fileName = `doc-${Date.now()}.pdf`;
  const filePath = path.join(OUTPUT_DIR, fileName);

  await renderPdf(content, filePath);

  return {
    url: `${process.env.PUBLIC_BASE_URL}/files/pdfs/${fileName}`,
    fileType: "pdf",
    mimeType: "application/pdf",
  };
};

const renderPdf = (content, filePath) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = createWriteStream(filePath);

    doc.pipe(stream);
    doc.fontSize(12).text(content, { align: "left" });
    doc.end();

    stream.on("finish", resolve);
    stream.on("error", reject);
  });
