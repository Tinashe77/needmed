import { AppError } from "../../utils/app-error.js";

const requireFields = (payload, fields) => {
  for (const field of fields) {
    if (payload[field] === undefined || payload[field] === null || String(payload[field]).trim() === "") {
      throw new AppError(`${field} is required.`, 400);
    }
  }
};

export const validateProductCreate = (req, res, next) => {
  try {
    requireFields(req.body, ["name", "category", "unitType", "price", "sku"]);
    next();
  } catch (error) {
    next(error);
  }
};

export const validateProductUpdate = (req, res, next) => next();

export const validateInventoryUpsert = (req, res, next) => {
  try {
    requireFields(req.body, ["branchId", "stockQuantity"]);
    next();
  } catch (error) {
    next(error);
  }
};

