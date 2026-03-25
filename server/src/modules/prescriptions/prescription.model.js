import mongoose from "mongoose";

const prescriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerPhone: {
      type: String,
      required: true,
      trim: true,
    },
    customerEmail: {
      type: String,
      default: null,
      trim: true,
      lowercase: true,
    },
    productName: {
      type: String,
      default: null,
      trim: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    pharmacyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pharmacy",
      default: null,
      index: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    fileUrl: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
      trim: true,
    },
    reviewStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "requires_follow_up"],
      default: "pending",
      index: true,
    },
    pharmacistNotes: {
      type: String,
      default: "",
      trim: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

prescriptionSchema.index({ createdAt: -1, reviewStatus: 1 });

export const Prescription = mongoose.model("Prescription", prescriptionSchema);

