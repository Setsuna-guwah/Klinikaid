import { GoogleGenerativeAI } from "@google/generative-ai";
import { WEB_OCR_ENABLED } from "@/lib/constants";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Pluggable document text extraction using Gemini 2.5 Flash.
 * Gated by WEB_OCR_ENABLED constant.
 * Supports PDF, JPEG, and PNG files.
 *
 * @param fileBuffer The raw Buffer of the uploaded file
 * @param mimeType The file's mime type (e.g. application/pdf, image/jpeg, image/png)
 * @returns The extracted markdown text or null if disabled or failed
 */
export async function extractDocumentText(
  fileBuffer: Buffer,
  mimeType: string
): Promise<string | null> {
  if (!WEB_OCR_ENABLED) {
    return null;
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent([
      {
        inlineData: {
          data: fileBuffer.toString("base64"),
          mimeType: mimeType
        }
      },
      "Extract all clinical, medical, administrative, and schedule text verbatim from this document. Do not summarize, alter, or omit any details. Format it as clean markdown."
    ]);

    const extractedText = result.response.text();
    return extractedText || null;
  } catch (error) {
    console.error("[extractDocumentText] OCR extraction failed:", error);
    return null;
  }
}
