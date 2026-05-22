import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import extractRoutes from "./routes/extract.js";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

console.log("API KEY LOADED:", process.env.GROQ_API_KEY ? "✅ Found" : "❌ Missing");
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api", extractRoutes);

app.get("/", (req, res) => {
  res.json({ status: "DocExtract API is running" });
});

mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/docextract")
  .then(() => {
    console.log("✅ Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });