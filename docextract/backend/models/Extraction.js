import mongoose from "mongoose";

const extractionSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    documentType: {
      type: String,
      enum: ["invoice", "resume", "contract"],
      required: true,
    },
    rawText: { type: String },
    result: { type: mongoose.Schema.Types.Mixed },
    status: {
      type: String,
      enum: ["success", "partial", "failed"],
      default: "success",
    },
    errorMessage: { type: String },
    fileSize: { type: Number },
    mimeType: { type: String },
  },
  { timestamps: true }
);

const Extraction = mongoose.model("Extraction", extractionSchema);
export default Extraction;
