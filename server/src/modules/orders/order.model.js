import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    prescriptionOnly: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    customerId: {
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
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: "At least one order item is required.",
      },
    },
    fulfillmentType: {
      type: String,
      enum: ["delivery", "pickup"],
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["cash_on_delivery", "online"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded", "partially_refunded"],
      default: "pending",
      index: true,
    },
    deliveryAddress: {
      type: String,
      default: "",
      trim: true,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    deliveryFee: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: [
        "DRAFT",
        "PENDING_PAYMENT",
        "PENDING_PHARMACY_REVIEW",
        "APPROVED",
        "PARTIALLY_AVAILABLE",
        "REJECTED",
        "PREPARING",
        "READY_FOR_DISPATCH",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED",
        "FAILED_DELIVERY",
      ],
      default: "PENDING_PHARMACY_REVIEW",
      index: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true },
);

orderSchema.index({ createdAt: -1, status: 1 });

export const Order = mongoose.model("Order", orderSchema);
