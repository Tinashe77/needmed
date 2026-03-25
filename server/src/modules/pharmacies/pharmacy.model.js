import mongoose from "mongoose";

const pharmacySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    supportEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
    supportPhone: {
      type: String,
      trim: true,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

export const Pharmacy = mongoose.model("Pharmacy", pharmacySchema);
