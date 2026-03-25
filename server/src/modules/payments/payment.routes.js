import { Router } from "express";

import { USER_ROLES } from "../auth/auth.constants.js";
import { authenticate, authorizeRoles } from "../auth/auth.middleware.js";
import {
  callback,
  createSession,
  editPaymentStatus,
  getPayments,
  initCodPayment,
} from "./payment.controller.js";
import {
  validatePaymentCallback,
  validatePaymentSessionCreate,
  validatePaymentStatusUpdate,
} from "./payment.validators.js";

const router = Router();

router.post("/session", validatePaymentSessionCreate, createSession);
router.post("/cod", validatePaymentSessionCreate, initCodPayment);
router.post("/callback", validatePaymentCallback, callback);
router.get(
  "/admin",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.PHARMACIST, USER_ROLES.PHARMACY_STAFF),
  getPayments,
);
router.patch(
  "/admin/:paymentId/status",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.PHARMACIST, USER_ROLES.PHARMACY_STAFF),
  validatePaymentStatusUpdate,
  editPaymentStatus,
);

export default router;

