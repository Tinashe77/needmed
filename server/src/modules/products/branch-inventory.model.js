import mongoose from "mongoose";

const branchInventorySchema = new mongoose.Schema(
  {
    pharmacyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pharmacy",
      required: true,
      index: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    stockQuantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    reorderThreshold: {
      type: Number,
      min: 0,
      default: 0,
    },
    visibilityStatus: {
      type: String,
      enum: ["visible", "hidden"],
      default: "visible",
    },
  },
  { timestamps: true },
);

branchInventorySchema.index({ branchId: 1, productId: 1 }, { unique: true });

export const BranchInventory = mongoose.model("BranchInventory", branchInventorySchema);

