import { Router } from "express";

import { authenticate, authorizeRoles } from "../auth/auth.middleware.js";
import { USER_ROLES } from "../auth/auth.constants.js";
import {
  addBranch,
  addPharmacy,
  editBranch,
  editPharmacy,
  getPharmacies,
  removeBranch,
  removePharmacy,
} from "./pharmacy.controller.js";
import {
  validateBranchCreate,
  validateBranchUpdate,
  validatePharmacyCreate,
  validatePharmacyUpdate,
} from "./pharmacy.validators.js";

const router = Router();

router.get("/", authenticate, getPharmacies);
router.post("/", authenticate, authorizeRoles(USER_ROLES.ADMIN), validatePharmacyCreate, addPharmacy);
router.patch(
  "/:pharmacyId",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  validatePharmacyUpdate,
  editPharmacy,
);
router.delete("/:pharmacyId", authenticate, authorizeRoles(USER_ROLES.ADMIN), removePharmacy);
router.post(
  "/:pharmacyId/branches",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  validateBranchCreate,
  addBranch,
);
router.patch(
  "/:pharmacyId/branches/:branchId",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  validateBranchUpdate,
  editBranch,
);
router.delete(
  "/:pharmacyId/branches/:branchId",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  removeBranch,
);

export default router;
