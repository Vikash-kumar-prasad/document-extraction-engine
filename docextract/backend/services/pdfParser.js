import fs from "fs";
import pdfParse from "pdf-parse/lib/pdf-parse.js";

/**
 * Extract raw text from a file based on its MIME type.
 * Supports: PDF, plain text.
 */
export async function extractText(filePath, mimeType) {
  if (mimeType === "application/pdf") {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text.trim();
  }

  if (mimeType === "text/plain") {
    return fs.readFileSync(filePath, "utf-8").trim();
  }

  throw new Error(`Unsupported file type: ${mimeType}`);
}
