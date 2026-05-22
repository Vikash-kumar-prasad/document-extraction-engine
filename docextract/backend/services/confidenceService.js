/**
 * Confidence verification layer.
 *
 * The LLM self-reports confidence, but we add a second pass:
 * we try to find the extracted value in the raw text using simple
 * string matching. If we can confirm it's there, we trust the LLM's
 * rating. If we can't find it, we downgrade to "medium" or "low".
 *
 * This prevents the LLM from reporting "high" confidence on hallucinated values.
 */

function normalize(str) {
  return String(str ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function isValuePresentInText(value, rawText) {
  if (value === null || value === undefined) return false;
  const normalizedText = normalize(rawText);

  if (Array.isArray(value)) {
    // For arrays (skills, line_items, etc.), check if at least half the items appear
    const primitives = value
      .map((v) => (typeof v === "object" ? Object.values(v).join(" ") : String(v)))
      .filter(Boolean);
    if (primitives.length === 0) return false;
    const found = primitives.filter((v) =>
      normalizedText.includes(normalize(v))
    ).length;
    return found / primitives.length >= 0.5;
  }

  if (typeof value === "object") {
    // For objects, check at least one sub-value
    const subValues = Object.values(value).filter(Boolean);
    return subValues.some((v) => normalizedText.includes(normalize(String(v))));
  }

  return normalizedText.includes(normalize(String(value)));
}

/**
 * Walk through all fields of an extracted result and verify confidence.
 * Returns the result with potentially downgraded confidence scores.
 */
export function verifyConfidence(extractedResult, rawText) {
  const verified = {};

  for (const [fieldName, fieldData] of Object.entries(extractedResult)) {
    if (!fieldData || typeof fieldData !== "object") {
      verified[fieldName] = fieldData;
      continue;
    }

    const { value, confidence, note } = fieldData;

    if (value === null || value === undefined) {
      // Already marked as missing — keep as-is
      verified[fieldName] = { value: null, confidence: "low", note: note || "Field not found in document" };
      continue;
    }

    const foundInText = isValuePresentInText(value, rawText);

    let finalConfidence = confidence;

    if (confidence === "high" && !foundInText) {
      // LLM claimed high but we can't verify it — downgrade
      finalConfidence = "medium";
    } else if (confidence === "medium" && !foundInText) {
      finalConfidence = "low";
    }

    verified[fieldName] = {
      value,
      confidence: finalConfidence,
      ...(note ? { note } : {}),
      ...(finalConfidence !== confidence
        ? { note: "Confidence downgraded: value not directly confirmed in source text" }
        : {}),
    };
  }

  return verified;
}
