import { AppError } from "../../utils/app-error.js";

const requireFields = (payload, fields) => {
  for (const field of fields) {
    if (!payload[field] || String(payload[field]).trim() === "") {
      throw new AppError(`${field} is required.`, 400);
    }
  }
};

export const validatePrescriptionCreate = (req, res, next) => {
  try {
    requireFields(req.body, ["customerName", "customerPhone", "fileName", "fileData", "mimeType"]);
    next();
  } catch (error) {
    next(error);
  }
};

export const validatePrescriptionReview = (req, res, next) => {
  try {
    requireFields(req.body, ["reviewStatus"]);

    if (!["pending", "approved", "rejected", "requires_follow_up"].includes(req.body.reviewStatus)) {
      throw new AppError("Invalid review status.", 400);
    }

    next();
  } catch (error) {
    next(error);
  }
};

