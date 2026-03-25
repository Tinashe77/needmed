import mongoose from "mongoose";

const riderProofSchema = new mongoose.Schema(
  {
    photoUrl: {
      type: String,
      default: "",
      trim: true,
    },
    method: {
      type: String,
      enum: ["none", "otp", "photo"],
      default: "none",
    },
    otpCode: {
      type: String,
      default: "",
      trim: true,
    },
    otpVerifiedAt: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false },
);

const deliverySchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
      unique: true,
    },
    orderNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
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
    riderId: {
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
    deliveryAddress: {
      type: String,
      required: true,
      trim: true,
    },
    deliveryFee: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["cash_on_delivery", "online"],
      required: true,
      default: "cash_on_delivery",
    },
    codAmountDue: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    codAmountCollected: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    deliveryOtp: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: [
        "PENDING_ASSIGNMENT",
        "ASSIGNED",
        "ACCEPTED",
        "ARRIVED_AT_PHARMACY",
        "PICKED_UP",
        "IN_TRANSIT",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "FAILED",
        "CANCELLED",
      ],
      default: "PENDING_ASSIGNMENT",
      index: true,
    },
    proofOfDelivery: {
      type: String,
      default: "",
      trim: true,
    },
    codCollected: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    proof: {
      type: riderProofSchema,
      default: () => ({}),
    },
    rejectedRiderIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
  },
  { timestamps: true },
);

deliverySchema.index({ createdAt: -1, status: 1 });

export const Delivery = mongoose.model("Delivery", deliverySchema);
