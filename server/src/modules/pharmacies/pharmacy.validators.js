import { AppError } from "../../utils/app-error.js";

const requireFields = (payload, fields) => {
  for (const field of fields) {
    if (!payload[field] || String(payload[field]).trim() === "") {
      throw new AppError(`${field} is required.`, 400);
    }
  }
};

export const validatePharmacyCreate = (req, res, next) => {
  try {
    requireFields(req.body, ["name", "slug"]);
    next();
  } catch (error) {
    next(error);
  }
};

export const validatePharmacyUpdate = (req, res, next) => next();

export const validateBranchCreate = (req, res, next) => {
  try {
    requireFields(req.body, ["name", "code", "addressLine1", "city"]);
    next();
  } catch (error) {
    next(error);
  }
};

export const validateBranchUpdate = (req, res, next) => next();
