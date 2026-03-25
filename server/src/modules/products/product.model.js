import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    genericName: {
      type: String,
      default: null,
      trim: true,
    },
    brand: {
      type: String,
      default: null,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    dosageInformation: {
      type: String,
      default: null,
      trim: true,
    },
    unitType: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    images: {
      type: [String],
      default: [],
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    prescriptionOnly: {
      type: Boolean,
      default: false,
    },
    warnings: {
      type: String,
      default: null,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ name: "text", genericName: "text", brand: "text", description: "text" });

export const Product = mongoose.model("Product", productSchema);

