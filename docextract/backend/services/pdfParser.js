import fs from "fs";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { extractTextFromImage } from "./visionService.js";

/**
 * Extract raw text from uploaded files.
 * Supports:
 * - PDF
 * - TXT
 * - Images (JPG, PNG, JPEG, WEBP)
 */
export async function extractText(filePath, mimeType) {

  // PDF
  if (mimeType === "application/pdf") {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text.trim();
  }

  // TXT
  if (mimeType === "text/plain") {
    return fs.readFileSync(filePath, "utf8").trim();
  }

  // Images
  if (
    mimeType === "image/jpeg" ||
    mimeType === "image/jpg" ||
    mimeType === "image/png" ||
    mimeType === "image/webp"
  ) {
    return await extractTextFromImage(filePath);
  }

  throw new Error(`Unsupported file type: ${mimeType}`);
}