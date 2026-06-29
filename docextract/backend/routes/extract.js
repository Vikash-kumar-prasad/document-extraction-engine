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

// Store uploaded files temporarily
const storage = multer.diskStorage({
  destination: path.join(__dirname, "../uploads"),
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/pdf",
      "text/plain",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only PDF, TXT, JPG, JPEG, PNG and WEBP files are allowed."
        )
      );
    }
  },
});

// Routes
router.post("/extract", upload.single("file"), handleExtract);

router.get("/extractions", listExtractions);

router.get("/extractions/:id", getExtraction);

// Error handler
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      error: err.message,
    });
  }

  if (err) {
    return res.status(400).json({
      error: err.message,
    });
  }

  next();
});

export default router;