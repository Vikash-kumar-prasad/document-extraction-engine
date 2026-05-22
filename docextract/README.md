# DocExtract — AI Document Extraction Engine

A full-stack document extraction engine that parses PDFs and text files and returns clean, validated, structured JSON with per-field confidence scoring — powered by Groq AI.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + React Router |
| Styling | Custom CSS (no framework) |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| LLM | Groq API (`llama-3.3-70b-versatile`) |
| PDF Parsing | `pdf-parse` |
| Validation | Zod v3 |

> **Why Groq?** Groq's hardware-accelerated inference delivers significantly lower latency than standard LLM APIs, which directly improves UX — extractions return in seconds rather than tens of seconds.

---

## Setup

### Prerequisites
- Node.js v18+
- MongoDB running locally (`mongod`) or a MongoDB Atlas URI
- A Groq API key — get one free at https://console.groq.com

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/docextract.git
cd docextract
```

### 2. Backend setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env — add your GROQ_API_KEY and MONGODB_URI
npm run dev
# Server starts at http://localhost:5000
```

### 3. Frontend setup
```bash
cd frontend
npm install
npm run dev
# App opens at http://localhost:3000
```

---

## API Reference

### `POST /api/extract`
Upload a document and receive structured JSON.

**Form data:**
- `file` — PDF or `.txt` file (max 10 MB)
- `documentType` — `invoice` | `resume` | `contract`

**Response:**
```json
{
  "id": "...",
  "filename": "invoice.pdf",
  "documentType": "invoice",
  "status": "success",
  "result": {
    "vendor": { "value": "Acme Corp", "confidence": "high" },
    "total":  { "value": "2450.00", "confidence": "high" },
    "due_date": { "value": null, "confidence": "low", "note": "Field not found in document" }
  },
  "createdAt": "..."
}
```

### `GET /api/extractions`
Returns a list of all past extractions (metadata only).

### `GET /api/extractions/:id`
Returns the full result for a single extraction.

---

## Document Schemas

### Invoice
`vendor`, `invoice_number`, `date`, `due_date`, `line_items`, `subtotal`, `tax`, `total`, `currency`, `payment_terms`

### Resume / CV
`full_name`, `email`, `phone`, `location`, `summary`, `skills`, `experience`, `education`, `certifications`, `links`

### Contract
`contract_title`, `parties`, `effective_date`, `expiration_date`, `governing_law`, `payment_amount`, `payment_terms`, `key_obligations`, `termination_clause`, `confidentiality`

Every field is wrapped as:
```json
{ "value": "...", "confidence": "high|medium|low", "note": "optional explanation" }
```

---

## Prompt Design

The extraction prompt is designed around three core principles:

**1. Zero hallucination contract**
The prompt opens with an explicit rule: *"Extract ONLY values that are explicitly present in the document text. Never infer, guess, or fabricate."* If a field is missing, the model must return `{"value": null, "note": "Field not found"}` — a null with honesty is always better than a fabricated value.

**2. Concrete confidence definitions**
Rather than leaving "confidence" vague, the prompt defines each level operationally:
- `high` → value is clearly and unambiguously stated
- `medium` → value is partially visible or requires minor interpretation
- `low` → value is barely present, ambiguous, or inferred from weak context

**3. Schema as structure, not constraint**
The prompt provides a concrete JSON template with the exact field names and nesting expected. This acts as a strong output anchor — the model knows exactly what shape to produce, which minimises schema mismatches.

---

## Confidence Scoring — Dual-Layer Verification

The LLM self-reports confidence, but we add a second verification pass in `confidenceService.js`:

1. After the LLM returns a result, we scan the raw document text for each extracted value.
2. If the LLM reported `high` confidence but we cannot find the value in the source text, we **downgrade to `medium`**.
3. If the LLM reported `medium` but we still can't find it, we **downgrade to `low`**.

This prevents the model from over-reporting confidence on values it inferred rather than read directly. The idea is borrowed from explainable AI — similar to how Grad-CAM verifies that a neural network is attending to the right region before trusting its classification.

---

## Schema Validation

After LLM extraction and confidence verification, the result is passed through a **Zod schema** matching the selected document type. If any field fails validation:
- The extraction is marked `partial` (not `failed`)
- The invalid field is replaced with `{value: null, confidence: "low", note: "Schema validation failed: ..."}`
- Valid fields are preserved and returned

This means a partial extraction is always better than an error — the caller gets as much clean data as possible.

---

## Handling Extraction Failures

| Scenario | Handling |
|---|---|
| Unsupported file type | 415 error before LLM call |
| Empty / unreadable PDF | 422 error after text extraction |
| LLM returns invalid JSON | Caught, 502 error with message |
| Schema mismatch | Partial result — bad fields nulled, good fields kept |
| Missing required field | `{value: null, confidence: "low", note: "..."}` |

---

## How Would I Improve Accuracy?

**For complex layouts (tables, multi-column invoices):**
- Use `pdfplumber` (Python) instead of `pdf-parse` — it preserves spatial layout and can extract tables as structured data before passing to the LLM
- Pass table data separately as structured rows, not as raw text

**For scanned documents:**
- Add an OCR step using Tesseract, or switch to a vision-capable model (e.g. `llava` via Groq or another provider) — send the page as an image so the model reads it visually
- Vision models handle rotated text, stamps, and handwriting far better than text extraction alone

**For higher accuracy generally:**
- Add few-shot examples in the prompt (2–3 real document samples per type) to anchor the model's output style
- Add a post-extraction validation step: re-ask the model "does this extracted value appear verbatim in the source?" for any `medium` or `low` confidence fields
- Use Groq's JSON mode to enforce valid JSON output at the API level, eliminating parse errors entirely

---

## Project Structure

```
docextract/
├── backend/
│   ├── server.js                    # Express app entry point
│   ├── routes/extract.js            # Route definitions + multer config
│   ├── controllers/
│   │   └── extractionController.js  # Request handling + pipeline orchestration
│   ├── services/
│   │   ├── pdfParser.js             # PDF/text extraction
│   │   ├── llmService.js            # Groq API + prompt
│   │   └── confidenceService.js     # Dual-layer confidence verification
│   ├── models/Extraction.js         # Mongoose schema
│   ├── validators/schemas.js        # Zod schemas for all document types
│   └── .env.example
└── frontend/
    └── src/
        ├── App.jsx                    # Router + sidebar
        ├── pages/
        │   ├── UploadPage.jsx         # Main upload + result view
        │   ├── HistoryPage.jsx        # Past extractions list
        │   └── ResultPage.jsx         # Single extraction detail
        └── components/
            ├── ExtractionResult.jsx   # Field-by-field result renderer
            ├── ConfidenceBadge.jsx    # high/medium/low badge
            └── FieldValue.jsx         # Handles nested/array/primitive values
```
