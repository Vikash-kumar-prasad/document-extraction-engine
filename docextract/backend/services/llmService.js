import Groq from "groq-sdk";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

function getClient() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

const SCHEMA_DESCRIPTIONS = {
  invoice: `{
  "vendor": {"value": "...", "confidence": "high|medium|low", "note": "optional"},
  "invoice_number": {"value": "...", "confidence": "..."},
  "date": {"value": "...", "confidence": "..."},
  "due_date": {"value": "...", "confidence": "..."},
  "line_items": {"value": [{"description":"...","quantity":...,"unit_price":...,"total":...}], "confidence": "..."},
  "subtotal": {"value": "...", "confidence": "..."},
  "tax": {"value": "...", "confidence": "..."},
  "total": {"value": "...", "confidence": "..."},
  "currency": {"value": "...", "confidence": "..."},
  "payment_terms": {"value": "...", "confidence": "..."}
}`,

  resume: `{
  "full_name": {"value": "...", "confidence": "high|medium|low", "note": "optional"},
  "email": {"value": "...", "confidence": "..."},
  "phone": {"value": "...", "confidence": "..."},
  "location": {"value": "...", "confidence": "..."},
  "summary": {"value": "...", "confidence": "..."},
  "skills": {"value": ["skill1","skill2"], "confidence": "..."},
  "experience": {"value": [{"company":"...","role":"...","duration":"...","description":"..."}], "confidence": "..."},
  "education": {"value": [{"institution":"...","degree":"...","year":"..."}], "confidence": "..."},
  "certifications": {"value": ["cert1"], "confidence": "..."},
  "links": {"value": {"linkedin":"...","github":"..."}, "confidence": "..."}
}`,

  contract: `{
  "contract_title": {"value": "...", "confidence": "high|medium|low", "note": "optional"},
  "parties": {"value": [{"name":"...","role":"...","address":"..."}], "confidence": "..."},
  "effective_date": {"value": "...", "confidence": "..."},
  "expiration_date": {"value": "...", "confidence": "..."},
  "governing_law": {"value": "...", "confidence": "..."},
  "payment_amount": {"value": "...", "confidence": "..."},
  "payment_terms": {"value": "...", "confidence": "..."},
  "key_obligations": {"value": ["obligation1"], "confidence": "..."},
  "termination_clause": {"value": "...", "confidence": "..."},
  "confidentiality": {"value": "...", "confidence": "..."}
}`,
};

function buildPrompt(docType, rawText) {
  return `You are a precise document data extraction engine. Extract structured data from the document text below.

Document Type: ${docType.toUpperCase()}

STRICT RULES:
1. Extract ONLY values explicitly present in the document. Never infer or fabricate.
2. Confidence levels:
   - "high" = clearly and unambiguously stated
   - "medium" = partially visible or needs minor interpretation  
   - "low" = barely present or ambiguous
3. If a field is missing, return: {"value": null, "confidence": "low", "note": "Field not found in document"}
4. Return ONLY valid JSON — no markdown, no explanation, no extra text.

Required JSON structure:
${SCHEMA_DESCRIPTIONS[docType]}

Document Text:
---
${rawText}
---

Return only the JSON object:`;
}

// Groq deprecated llama-3.3-70b-versatile on 2026-06-17. Primary + fallback
// so a future deprecation doesn't silently break extraction again.
const PRIMARY_MODEL = "openai/gpt-oss-120b";
const FALLBACK_MODEL = "qwen/qwen3.6-27b";

async function callGroq(client, model, docType, rawText) {
  const completion = await client.chat.completions.create({
    model,
    messages: [{ role: "user", content: buildPrompt(docType, rawText) }],
    temperature: 0.1,
    max_tokens: 2000,
  });

  return completion.choices[0].message.content;
}

export async function extractWithLLM(docType, rawText) {
  const client = getClient();

  let responseText;
  try {
    responseText = await callGroq(client, PRIMARY_MODEL, docType, rawText);
  } catch (err) {
    // If the primary model is unavailable/deprecated/rate-limited, retry once with the fallback.
    if (err?.status === 404 || err?.status === 400 || err?.status === 429) {
      responseText = await callGroq(client, FALLBACK_MODEL, docType, rawText);
    } else {
      throw err;
    }
  }

  const cleaned = responseText
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error(`Groq returned invalid JSON. Raw: ${cleaned.slice(0, 200)}`);
  }
}