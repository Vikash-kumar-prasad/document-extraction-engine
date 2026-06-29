import Tesseract from "tesseract.js";

export async function extractTextFromImage(imagePath) {
  const {
    data: { text },
  } = await Tesseract.recognize(
    imagePath,
    "eng+hin",
    {
      logger: (m) => console.log(m),
    }
  );

  if (!text || text.trim().length === 0) {
    throw new Error("No text detected in image.");
  }

  return text.trim();
}