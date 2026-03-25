import { AppError } from "../../utils/app-error.js";

const requireFields = (payload, fields) => {
  for (const field of fields) {
    if (!payload[field] || String(payload[field]).trim() === "") {
      throw new AppError(`${field} is required.`, 400);
    }
  }
};

export const validateDeliveryCreate = (req, res, next) => {
  try {
    requireFields(req.body, ["orderId"]);
    next();
  } catch (error) {
    next(error);
  }
};

export const validateDeliveryAssign = (req, res, next) => {
  try {
    requireFields(req.body, ["riderId"]);
    next();
  } catch (error) {
    next(error);
  }
};

export const validateDeliveryStatusUpdate = (req, res, next) => {
  try {
    requireFields(req.body, ["status"]);

    if (req.body.codAmountCollected !== undefined && Number.isNaN(Number(req.body.codAmountCollected))) {
      throw new AppError("codAmountCollected must be a number.", 400);
    }

    next();
  } catch (error) {
    next(error);
  }
};
