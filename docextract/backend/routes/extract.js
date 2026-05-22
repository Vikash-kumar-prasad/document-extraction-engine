import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import {
  handleExtract,
  listExtractions,
  getExtraction,
} from "../controllers/extractionController.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer config — store files temporarily in /uploads
const storage = multer.diskStorage({
  destination: path.join(__dirname, "../uploads"),
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ["application/pdf", "text/plain"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only PDF and plain text files are allowed."));
  },
});

// Routes
router.post("/extract", upload.single("file"), handleExtract);
router.get("/extractions", listExtractions);
router.get("/extractions/:id", getExtraction);

// Multer error handler
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

export default router;
