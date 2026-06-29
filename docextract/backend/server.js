import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import extractRoutes from "./routes/extract.js";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Environment Variables
dotenv.config({
  path: path.join(__dirname, ".env"),
});

// Debug Logs
console.log(
  "GROQ API:",
  process.env.GROQ_API_KEY ? "✅ Loaded" : "❌ Missing"
);

console.log(
  "GEMINI API:",
  process.env.GEMINI_API_KEY ? "✅ Loaded" : "❌ Missing"
);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", extractRoutes);

// Health Check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🚀 DocExtract API is running",
  });
});

// MongoDB Connection
mongoose
  .connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/docextract"
  )
  .then(() => {
    console.log("✅ Connected to MongoDB");

    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Failed");
    console.error(err.message);
    process.exit(1);
  });