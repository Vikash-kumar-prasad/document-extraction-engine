import fs from "fs";
import { extractText } from "../services/pdfParser.js";
import { extractWithLLM } from "../services/llmService.js";
import { verifyConfidence } from "../services/confidenceService.js";
import { SCHEMAS } from "../validators/schemas.js";
import Extraction from "../models/Extraction.js";

// Supported file types
const SUPPORTED_TYPES = [
  "application/pdf",
  "text/plain",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

// ── POST /api/extract ─────────────────────────────────────────────────────────
export async function handleExtract(req, res) {
  if (!req.file) {
    return res.status(400).json({
      error: "No file uploaded.",
    });
  }

  const { documentType } = req.body;

  if (!documentType || !SCHEMAS[documentType]) {
    return res.status(400).json({
      error: `Invalid document type. Choose from: ${Object.keys(
        SCHEMAS
      ).join(", ")}`,
    });
  }

  if (!SUPPORTED_TYPES.includes(req.file.mimetype)) {
    fs.unlinkSync(req.file.path);

    return res.status(415).json({
      error: `Unsupported file type: ${req.file.mimetype}. Upload a PDF, TXT, JPG, JPEG, PNG or WEBP file.`,
    });
  }

  let rawText = "";

  try {
    rawText = await extractText(req.file.path, req.file.mimetype);

    console.log("\n======================================");
    console.log("📝 OCR EXTRACTED TEXT");
    console.log("======================================");
    console.log(rawText);
    console.log("======================================\n");
  } catch (err) {
    fs.unlinkSync(req.file.path);

    return res.status(422).json({
      error: `Text extraction failed: ${err.message}`,
    });
  }

  if (!rawText || rawText.length < 20) {
    fs.unlinkSync(req.file.path);

    return res.status(422).json({
      error: "Document appears to be empty or unreadable.",
    });
  }

  let llmResult;

  try {
    llmResult = await extractWithLLM(documentType, rawText);
  } catch (err) {
    fs.unlinkSync(req.file.path);

    return res.status(502).json({
      error: `LLM extraction failed: ${err.message}`,
    });
  }

  // Verify confidence
  const verifiedResult = verifyConfidence(llmResult, rawText);

  // Validate using Zod
  const schema = SCHEMAS[documentType];
  const parsed = schema.safeParse(verifiedResult);

  let finalResult = verifiedResult;
  let status = "success";

  if (!parsed.success) {
    status = "partial";

    finalResult = { ...verifiedResult };

    for (const issue of parsed.error.issues) {
      const fieldName = issue.path[0];

      if (fieldName) {
        finalResult[fieldName] = {
          value: null,
          confidence: "low",
          note: `Schema validation failed: ${issue.message}`,
        };
      }
    }
  }

  // Save extraction
  const extraction = new Extraction({
    filename: req.file.originalname,
    documentType,
    rawText,
    result: finalResult,
    status,
    fileSize: req.file.size,
    mimeType: req.file.mimetype,
  });

  await extraction.save();

  // Delete uploaded file
  fs.unlinkSync(req.file.path);

  return res.status(201).json({
    id: extraction._id,
    filename: extraction.filename,
    documentType,
    status,
    result: finalResult,
    rawText, // Helpful for debugging
    createdAt: extraction.createdAt,
  });
}

// ── GET /api/extractions ──────────────────────────────────────────────────────
export async function listExtractions(req, res) {
  const extractions = await Extraction.find(
    {},
    {
      filename: 1,
      documentType: 1,
      status: 1,
      createdAt: 1,
      fileSize: 1,
    }
  ).sort({ createdAt: -1 });

  return res.json(extractions);
}

// ── GET /api/extractions/:id ──────────────────────────────────────────────────
export async function getExtraction(req, res) {
  const extraction = await Extraction.findById(req.params.id);

  if (!extraction) {
    return res.status(404).json({
      error: "Extraction not found.",
    });
  }

  return res.json(extraction);
}