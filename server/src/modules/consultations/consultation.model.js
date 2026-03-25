import mongoose from "mongoose";

const transcriptEntrySchema = new mongoose.Schema(
  {
    direction: {
      type: String,
      enum: ["inbound", "outbound"],
      required: true,
    },
    senderType: {
      type: String,
      enum: ["customer", "system", "pharmacist"],
      required: true,
    },
    body: {
      type: String,
      default: "",
      trim: true,
    },
    mediaUrls: {
      type: [String],
      default: [],
    },
    receivedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const consultationSchema = new mongoose.Schema(
  {
    channel: {
      type: String,
      enum: ["whatsapp"],
      default: "whatsapp",
      index: true,
    },
    customerWhatsapp: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    customerPhone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    customerName: {
      type: String,
      default: "",
      trim: true,
    },
    customerEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    requestedSummary: {
      type: String,
      default: "",
      trim: true,
    },
    requestedItems: {
      type: [String],
      default: [],
    },
    fulfillmentType: {
      type: String,
      enum: ["delivery", "pickup", "unknown"],
      default: "unknown",
    },
    deliveryAddress: {
      type: String,
      default: "",
      trim: true,
    },
    paymentMethod: {
      type: String,
      enum: ["cash_on_delivery", "online", "undecided"],
      default: "undecided",
    },
    prescriptionRequired: {
      type: String,
      enum: ["yes", "no", "unknown"],
      default: "unknown",
    },
    prescriptionMediaUrls: {
      type: [String],
      default: [],
    },
    additionalNotes: {
      type: String,
      default: "",
      trim: true,
    },
    intakeStep: {
      type: String,
      enum: [
        "awaiting_name",
        "awaiting_items",
        "awaiting_fulfillment",
        "awaiting_address",
        "awaiting_payment",
        "awaiting_prescription",
        "awaiting_notes",
        "completed",
      ],
      default: "awaiting_name",
      index: true,
    },
    status: {
      type: String,
      enum: ["intake_in_progress", "ready_for_review", "in_review", "waiting_for_customer", "completed", "closed"],
      default: "intake_in_progress",
      index: true,
    },
    pharmacistNotes: {
      type: String,
      default: "",
      trim: true,
    },
    assignedToUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    transcript: {
      type: [transcriptEntrySchema],
      default: [],
    },
    lastInboundAt: {
      type: Date,
      default: null,
    },
    lastOutboundAt: {
      type: Date,
      default: null,
    },
    lastTwilioMessageSid: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true },
);

consultationSchema.index({ createdAt: -1, status: 1 });

export const Consultation = mongoose.model("Consultation", consultationSchema);
