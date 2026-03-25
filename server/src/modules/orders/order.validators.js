import { AppError } from "../../utils/app-error.js";

const requireFields = (payload, fields) => {
  for (const field of fields) {
    if (!payload[field] || String(payload[field]).trim() === "") {
      throw new AppError(`${field} is required.`, 400);
    }
  }
};

export const validateOrderCreate = (req, res, next) => {
  try {
    requireFields(req.body, ["customerName", "customerPhone", "fulfillmentType", "paymentMethod"]);

    if (!Array.isArray(req.body.items) || req.body.items.length === 0) {
      throw new AppError("items are required.", 400);
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const validateOrderStatusUpdate = (req, res, next) => {
  try {
    requireFields(req.body, ["status"]);
    next();
  } catch (error) {
    next(error);
  }
};

