import { Router } from "express";

import { USER_ROLES } from "../auth/auth.constants.js";
import { authenticate, authorizeRoles } from "../auth/auth.middleware.js";
import {
  addPrescription,
  getPrescriptions,
  updatePrescriptionReview,
} from "./prescription.controller.js";
import {
  validatePrescriptionCreate,
  validatePrescriptionReview,
} from "./prescription.validators.js";

const router = Router();

router.post("/", validatePrescriptionCreate, addPrescription);
router.get(
  "/admin",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.PHARMACIST, USER_ROLES.PHARMACY_STAFF),
  getPrescriptions,
);
router.patch(
  "/admin/:prescriptionId/review",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.PHARMACIST, USER_ROLES.PHARMACY_STAFF),
  validatePrescriptionReview,
  updatePrescriptionReview,
);

export default router;

