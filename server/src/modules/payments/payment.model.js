import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["cash_on_delivery", "online"],
      required: true,
    },
    provider: {
      type: String,
      default: "mockpay",
      trim: true,
    },
    sessionReference: {
      type: String,
      default: null,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded", "partially_refunded"],
      default: "pending",
      index: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

paymentSchema.index({ createdAt: -1, status: 1 });

export const Payment = mongoose.model("Payment", paymentSchema);

