import { AppError } from "../../utils/app-error.js";
import { RIDER_AVAILABILITY, USER_ROLES } from "./auth.constants.js";

const requireFields = (payload, fields) => {
  for (const field of fields) {
    if (!payload[field] || String(payload[field]).trim() === "") {
      throw new AppError(`${field} is required.`, 400);
    }
  }
};

const ensurePasswordStrength = (password) => {
  if (String(password).length < 8) {
    throw new AppError("Password must be at least 8 characters long.", 400);
  }
};

const allowedManagedRoles = [
  USER_ROLES.ADMIN,
  USER_ROLES.PHARMACIST,
  USER_ROLES.PHARMACY_STAFF,
];

const allowedUserRoles = [...allowedManagedRoles, USER_ROLES.CUSTOMER, USER_ROLES.RIDER];
const allowedStatuses = ["active", "pending_approval", "suspended"];

export const validateRegisterCustomer = (req, res, next) => {
  try {
    requireFields(req.body, ["firstName", "lastName", "email", "phone", "password"]);
    ensurePasswordStrength(req.body.password);
    next();
  } catch (error) {
    next(error);
  }
};

export const validateRegisterRider = (req, res, next) => {
  try {
    requireFields(req.body, ["firstName", "lastName", "email", "phone", "password"]);
    ensurePasswordStrength(req.body.password);
    next();
  } catch (error) {
    next(error);
  }
};

export const validateLogin = (req, res, next) => {
  try {
    requireFields(req.body, ["email", "password"]);
    next();
  } catch (error) {
    next(error);
  }
};

export const validateManagedUserCreate = (req, res, next) => {
  try {
    requireFields(req.body, ["firstName", "lastName", "email", "phone", "password", "role"]);
    ensurePasswordStrength(req.body.password);

    if (!allowedManagedRoles.includes(req.body.role)) {
      throw new AppError("Invalid managed user role.", 400);
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const validateManagedUserUpdate = (req, res, next) => {
  try {
    if (req.body.password) {
      ensurePasswordStrength(req.body.password);
    }

    if (req.body.role && !allowedUserRoles.includes(req.body.role)) {
      throw new AppError("Invalid user role.", 400);
    }

    if (req.body.accountStatus && !allowedStatuses.includes(req.body.accountStatus)) {
      throw new AppError("Invalid account status.", 400);
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const validateRiderAvailabilityUpdate = (req, res, next) => {
  try {
    requireFields(req.body, ["status"]);

    if (!Object.values(RIDER_AVAILABILITY).includes(req.body.status)) {
      throw new AppError("Invalid rider availability status.", 400);
    }

    next();
  } catch (error) {
    next(error);
  }
};
