import fs from "fs/promises";
import path from "path";
import mongoose from "mongoose";

import { AppError } from "../../utils/app-error.js";
import { Prescription } from "./prescription.model.js";

const uploadsDir = path.resolve(process.cwd(), "server/uploads/prescriptions");

const ensureObjectId = (value, label) => {
  if (value && !mongoose.Types.ObjectId.isValid(value)) {
    throw new AppError(`Invalid ${label}.`, 400);
  }
};

const persistPrescriptionFile = async ({ fileName, fileData }) => {
  const matches = String(fileData).match(/^data:(.+);base64,(.+)$/);

  if (!matches) {
    throw new AppError("Invalid file data.", 400);
  }

  const ext = path.extname(fileName) || ".bin";
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  const fullPath = path.join(uploadsDir, safeName);

  await fs.mkdir(uploadsDir, { recursive: true });
  await fs.writeFile(fullPath, Buffer.from(matches[2], "base64"));

  return `/uploads/prescriptions/${safeName}`;
};

export const listPrescriptions = async (query = {}) => {
  const filters = {};

  if (query.reviewStatus && query.reviewStatus !== "all") {
    filters.reviewStatus = query.reviewStatus;
  }

  return Prescription.find(filters).sort({ createdAt: -1 }).lean();
};

export const createPrescription = async (payload) => {
  ensureObjectId(payload.pharmacyId, "pharmacy id");
  ensureObjectId(payload.branchId, "branch id");
  ensureObjectId(payload.userId, "user id");

  const fileUrl = await persistPrescriptionFile(payload);

  return Prescription.create({
    userId: payload.userId || null,
    customerName: payload.customerName,
    customerPhone: payload.customerPhone,
    customerEmail: payload.customerEmail || null,
    productName: payload.productName || null,
    notes: payload.notes || "",
    pharmacyId: payload.pharmacyId || null,
    branchId: payload.branchId || null,
    fileName: payload.fileName,
    fileUrl,
    mimeType: payload.mimeType,
    reviewStatus: "pending",
  });
};

export const reviewPrescription = async (prescriptionId, payload, reviewerId) => {
  ensureObjectId(prescriptionId, "prescription id");
  ensureObjectId(reviewerId, "reviewer id");

  const prescription = await Prescription.findById(prescriptionId);

  if (!prescription) {
    throw new AppError("Prescription not found.", 404);
  }

  prescription.reviewStatus = payload.reviewStatus;
  prescription.pharmacistNotes = payload.pharmacistNotes || "";
  prescription.reviewedBy = reviewerId;
  prescription.reviewedAt = new Date();

  await prescription.save();
  return prescription;
};

