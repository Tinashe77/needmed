import mongoose from "mongoose";

const branchSchema = new mongoose.Schema(
  {
    pharmacyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pharmacy",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    addressLine1: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
      default: "Zimbabwe",
    },
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

branchSchema.index({ pharmacyId: 1, code: 1 }, { unique: true });

export const Branch = mongoose.model("Branch", branchSchema);

