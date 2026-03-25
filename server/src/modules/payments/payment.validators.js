import { AppError } from "../../utils/app-error.js";

const requireFields = (payload, fields) => {
  for (const field of fields) {
    if (!payload[field] || String(payload[field]).trim() === "") {
      throw new AppError(`${field} is required.`, 400);
    }
  }
};

export const validatePaymentSessionCreate = (req, res, next) => {
  try {
    requireFields(req.body, ["orderId"]);
    next();
  } catch (error) {
    next(error);
  }
};

export const validatePaymentCallback = (req, res, next) => {
  try {
    requireFields(req.body, ["sessionReference", "status"]);
    next();
  } catch (error) {
    next(error);
  }
};

export const validatePaymentStatusUpdate = (req, res, next) => {
  try {
    requireFields(req.body, ["status"]);
    next();
  } catch (error) {
    next(error);
  }
};

