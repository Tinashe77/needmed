import mongoose from "mongoose";

import { env } from "../../config/env.js";
import { AppError } from "../../utils/app-error.js";
import { Consultation } from "./consultation.model.js";

const TWIML_HEADER = '<?xml version="1.0" encoding="UTF-8"?>';

const ensureObjectId = (value, label) => {
  if (value && !mongoose.Types.ObjectId.isValid(value)) {
    throw new AppError(`Invalid ${label}.`, 400);
  }
};

const escapeXml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const normalizeWhatsappAddress = (value) => String(value ?? "").replace(/^whatsapp:/i, "").trim();

const parseMediaUrls = (payload) => {
  const mediaCount = Number(payload.NumMedia || 0);
  return Array.from({ length: mediaCount }, (_, index) => payload[`MediaUrl${index}`]).filter(Boolean);
};

const createTwimlMessage = (message) =>
  `${TWIML_HEADER}<Response><Message>${escapeXml(message)}</Message></Response>`;

const createEmptyTwiml = () => `${TWIML_HEADER}<Response></Response>`;

const summarizeConsultation = (consultation) => {
  const lines = [
    `Name: ${consultation.customerName || "Not provided"}`,
    `Phone: ${consultation.customerPhone || "Not provided"}`,
    `Items: ${consultation.requestedSummary || "Not provided"}`,
    `Fulfillment: ${consultation.fulfillmentType === "unknown" ? "Not provided" : consultation.fulfillmentType}`,
    `Address: ${consultation.deliveryAddress || "Not required / not provided"}`,
    `Payment: ${consultation.paymentMethod === "undecided" ? "Not provided" : consultation.paymentMethod}`,
    `Prescription: ${consultation.prescriptionRequired}`,
    `Notes: ${consultation.additionalNotes || "None"}`,
  ];

  return lines.join("\n");
};

const buildInitialPrompt = () =>
  [
    "Welcome to NeedMed on WhatsApp.",
    "I will collect your order request and send it to the pharmacy team for review.",
    "Please reply with your full name.",
  ].join(" ");

const buildCompletionPrompt = (consultation) =>
  [
    "Thank you. Your request has been sent to the NeedMed pharmacy portal for review.",
    "A pharmacist will continue the process from there and may message you here if more information is needed.",
    "",
    summarizeConsultation(consultation),
  ].join("\n");

const buildInProgressPrompt = () =>
  "Your request is already in the NeedMed review queue. A pharmacist will respond here on WhatsApp if more information is needed.";

const buildManualModePrompt = () =>
  "NeedMed has received your message and pushed it to the pharmacy portal. A pharmacist will continue with you here on WhatsApp shortly.";

const appendTranscript = (consultation, entry) => {
  consultation.transcript.push(entry);
};

const splitRequestedItems = (body) =>
  String(body ?? "")
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);

const parseFulfillment = (body) => {
  const normalized = String(body ?? "").trim().toLowerCase();

  if (["delivery", "deliver", "send"].includes(normalized)) {
    return "delivery";
  }

  if (["pickup", "pick up", "collection", "collect"].includes(normalized)) {
    return "pickup";
  }

  return null;
};

const parsePaymentMethod = (body) => {
  const normalized = String(body ?? "").trim().toLowerCase();

  if (normalized.includes("cash") || normalized.includes("cod")) {
    return "cash_on_delivery";
  }

  if (normalized.includes("online") || normalized.includes("card") || normalized.includes("ecocash")) {
    return "online";
  }

  return null;
};

const parsePrescriptionAnswer = (body, mediaUrls) => {
  if (mediaUrls.length > 0) {
    return { required: "yes", complete: true };
  }

  const normalized = String(body ?? "").trim().toLowerCase();

  if (["yes", "y"].includes(normalized)) {
    return { required: "yes", complete: false };
  }

  if (["no", "n"].includes(normalized)) {
    return { required: "no", complete: true };
  }

  return null;
};

const nextStepResponse = async (consultation, body, mediaUrls) => {
  switch (consultation.intakeStep) {
    case "awaiting_name": {
      if (!body) {
        return "Please reply with your full name so I can open the request properly.";
      }

      consultation.customerName = body;
      consultation.intakeStep = "awaiting_items";
      return "What medicines or products do you need? You can list them in one message.";
    }

    case "awaiting_items": {
      if (!body) {
        return "Please list the medicine or products you need.";
      }

      consultation.requestedSummary = body;
      consultation.requestedItems = splitRequestedItems(body);
      consultation.intakeStep = "awaiting_fulfillment";
      return "Do you want delivery or pickup?";
    }

    case "awaiting_fulfillment": {
      const fulfillmentType = parseFulfillment(body);

      if (!fulfillmentType) {
        return "Please reply with either DELIVERY or PICKUP.";
      }

      consultation.fulfillmentType = fulfillmentType;
      consultation.intakeStep = fulfillmentType === "delivery" ? "awaiting_address" : "awaiting_payment";
      return fulfillmentType === "delivery"
        ? "Please send the full delivery address."
        : "What payment method do you prefer? Reply with CASH ON DELIVERY or ONLINE.";
    }

    case "awaiting_address": {
      if (!body) {
        return "Please send the delivery address so the pharmacy can complete the request.";
      }

      consultation.deliveryAddress = body;
      consultation.intakeStep = "awaiting_payment";
      return "What payment method do you prefer? Reply with CASH ON DELIVERY or ONLINE.";
    }

    case "awaiting_payment": {
      const paymentMethod = parsePaymentMethod(body);

      if (!paymentMethod) {
        return "Please reply with CASH ON DELIVERY or ONLINE.";
      }

      consultation.paymentMethod = paymentMethod;
      consultation.intakeStep = "awaiting_prescription";
      return "Do any of the requested items require a prescription? Reply YES or NO. If you already have the prescription, you can send the image or PDF now.";
    }

    case "awaiting_prescription": {
      const parsed = parsePrescriptionAnswer(body, mediaUrls);

      if (!parsed) {
        return "Please reply YES or NO. You can also attach the prescription image or PDF in this chat.";
      }

      consultation.prescriptionRequired = parsed.required;
      if (mediaUrls.length > 0) {
        consultation.prescriptionMediaUrls = [...consultation.prescriptionMediaUrls, ...mediaUrls];
      }

      if (parsed.required === "yes" && !parsed.complete) {
        return "Please attach the prescription image or PDF now. If you do not have it yet, reply NO and the pharmacist will follow up.";
      }

      consultation.intakeStep = "awaiting_notes";
      return "Any extra notes for the pharmacist? If none, reply NONE.";
    }

    case "awaiting_notes": {
      consultation.additionalNotes = body && body.toLowerCase() !== "none" ? body : "";
      consultation.intakeStep = "completed";
      consultation.status = "ready_for_review";
      return buildCompletionPrompt(consultation);
    }

    case "completed":
    default:
      consultation.status = consultation.status === "closed" ? "closed" : "ready_for_review";
      return buildInProgressPrompt();
  }
};

export const processWhatsappWebhook = async (payload) => {
  const from = normalizeWhatsappAddress(payload.From);
  const messageBody = String(payload.Body ?? "").trim();
  const mediaUrls = parseMediaUrls(payload);

  if (!from) {
    throw new AppError("Incoming WhatsApp message did not include a sender.", 400);
  }

  const intakeMode = String(env.whatsappIntakeMode ?? "guided").toLowerCase();
  const isManualMode = intakeMode === "manual";

  let consultation = await Consultation.findOne({
    channel: "whatsapp",
    customerWhatsapp: from,
    status: { $ne: "closed" },
  }).sort({ createdAt: -1 });

  if (!consultation) {
    consultation = new Consultation({
      channel: "whatsapp",
      customerWhatsapp: from,
      customerPhone: from,
      status: isManualMode ? "ready_for_review" : "intake_in_progress",
      intakeStep: isManualMode ? "completed" : "awaiting_name",
    });
  }

  appendTranscript(consultation, {
    direction: "inbound",
    senderType: "customer",
    body: messageBody,
    mediaUrls,
    receivedAt: new Date(),
  });

  consultation.lastInboundAt = new Date();
  consultation.lastTwilioMessageSid = payload.MessageSid || consultation.lastTwilioMessageSid;

  if (isManualMode) {
    if (!consultation.requestedSummary && messageBody) {
      consultation.requestedSummary = messageBody;
      consultation.requestedItems = splitRequestedItems(messageBody);
    }

    if (!consultation.customerName && payload.ProfileName) {
      consultation.customerName = String(payload.ProfileName).trim();
    }

    if (mediaUrls.length > 0) {
      consultation.prescriptionMediaUrls = [...consultation.prescriptionMediaUrls, ...mediaUrls];
    }

    consultation.status = consultation.status === "closed" ? "closed" : "ready_for_review";
    consultation.intakeStep = "completed";

    const shouldSendAck =
      consultation.transcript.filter((entry) => entry.direction === "inbound").length === 1 ||
      messageBody.toLowerCase() === "restart";

    if (shouldSendAck) {
      const reply = buildManualModePrompt();

      appendTranscript(consultation, {
        direction: "outbound",
        senderType: "system",
        body: reply,
        mediaUrls: [],
        receivedAt: new Date(),
      });

      consultation.lastOutboundAt = new Date();
      await consultation.save();

      return {
        consultation,
        twiml: createTwimlMessage(reply),
      };
    }

    await consultation.save();

    return {
      consultation,
      twiml: createEmptyTwiml(),
    };
  }

  const normalizedCommand = messageBody.toLowerCase();
  let reply;

  if (normalizedCommand === "restart") {
    consultation.customerName = "";
    consultation.customerEmail = "";
    consultation.requestedSummary = "";
    consultation.requestedItems = [];
    consultation.fulfillmentType = "unknown";
    consultation.deliveryAddress = "";
    consultation.paymentMethod = "undecided";
    consultation.prescriptionRequired = "unknown";
    consultation.prescriptionMediaUrls = [];
    consultation.additionalNotes = "";
    consultation.intakeStep = "awaiting_name";
    consultation.status = "intake_in_progress";
    reply = buildInitialPrompt();
  } else if (!messageBody && mediaUrls.length === 0) {
    reply = "I did not receive any text or file. Please send the requested details so I can continue your NeedMed order request.";
  } else if (consultation.status !== "intake_in_progress" && consultation.intakeStep === "completed") {
    consultation.status = "ready_for_review";
    reply = buildInProgressPrompt();
  } else {
    reply = await nextStepResponse(consultation, messageBody, mediaUrls);
  }

  appendTranscript(consultation, {
    direction: "outbound",
    senderType: "system",
    body: reply,
    mediaUrls: [],
    receivedAt: new Date(),
  });

  consultation.lastOutboundAt = new Date();

  await consultation.save();

  return {
    consultation,
    twiml: createTwimlMessage(reply),
  };
};

export const listConsultations = async () =>
  Consultation.find()
    .populate("assignedToUserId", "firstName lastName email role")
    .sort({ updatedAt: -1 })
    .lean();

export const getConsultationById = async (consultationId) => {
  ensureObjectId(consultationId, "consultation id");

  const consultation = await Consultation.findById(consultationId).populate("assignedToUserId", "firstName lastName email role").lean();

  if (!consultation) {
    throw new AppError("Consultation not found.", 404);
  }

  return consultation;
};

export const updateConsultationStatus = async (consultationId, payload, actorUserId) => {
  ensureObjectId(consultationId, "consultation id");
  ensureObjectId(actorUserId, "user id");

  const consultation = await Consultation.findById(consultationId);

  if (!consultation) {
    throw new AppError("Consultation not found.", 404);
  }

  consultation.status = payload.status;
  if (payload.pharmacistNotes !== undefined) {
    consultation.pharmacistNotes = payload.pharmacistNotes;
  }
  consultation.assignedToUserId = actorUserId;

  await consultation.save();
  return consultation.populate("assignedToUserId", "firstName lastName email role");
};

const requireTwilioConfig = () => {
  if (!env.twilioAccountSid || !env.twilioAuthToken || !env.twilioWhatsappFrom) {
    throw new AppError("Twilio WhatsApp configuration is incomplete.", 500);
  }
};

const sendWhatsappMessage = async ({ to, body }) => {
  requireTwilioConfig();

  const params = new URLSearchParams();
  params.set("From", `whatsapp:${env.twilioWhatsappFrom}`);
  params.set("To", `whatsapp:${normalizeWhatsappAddress(to)}`);
  params.set("Body", body);

  const auth = Buffer.from(`${env.twilioAccountSid}:${env.twilioAuthToken}`).toString("base64");

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${env.twilioAccountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new AppError(data.message ?? "Twilio WhatsApp message failed.", 502);
  }

  return data;
};

export const replyToConsultation = async (consultationId, payload, actorUser) => {
  ensureObjectId(consultationId, "consultation id");

  const consultation = await Consultation.findById(consultationId);

  if (!consultation) {
    throw new AppError("Consultation not found.", 404);
  }

  const body = String(payload.body ?? "").trim();
  if (!body) {
    throw new AppError("Reply message is required.", 400);
  }

  const twilioMessage = await sendWhatsappMessage({
    to: consultation.customerWhatsapp,
    body,
  });

  appendTranscript(consultation, {
    direction: "outbound",
    senderType: "pharmacist",
    body,
    mediaUrls: [],
    receivedAt: new Date(),
  });

  consultation.status = payload.status || "waiting_for_customer";
  consultation.assignedToUserId = actorUser?._id || consultation.assignedToUserId;
  consultation.lastOutboundAt = new Date();
  consultation.lastTwilioMessageSid = twilioMessage.sid || consultation.lastTwilioMessageSid;

  if (payload.pharmacistNotes !== undefined) {
    consultation.pharmacistNotes = payload.pharmacistNotes;
  }

  await consultation.save();

  return consultation.populate("assignedToUserId", "firstName lastName email role");
};
