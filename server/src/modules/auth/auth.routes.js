import { Router } from "express";

import {
  approveRider,
  createManagedUser,
  deleteUser,
  getManagedUsers,
  getPendingRiders,
  getUsersForAdmin,
  login,
  me,
  register,
  registerRiderAccount,
  setRiderAvailability,
  updateUser,
} from "./auth.controller.js";
import { USER_ROLES } from "./auth.constants.js";
import { authenticate, authorizeRoles } from "./auth.middleware.js";
import {
  validateLogin,
  validateManagedUserCreate,
  validateManagedUserUpdate,
  validateRegisterCustomer,
  validateRegisterRider,
  validateRiderAvailabilityUpdate,
} from "./auth.validators.js";

const router = Router();

router.post("/register", validateRegisterCustomer, register);
router.post("/riders/register", validateRegisterRider, registerRiderAccount);
router.post("/login", validateLogin, login);
router.get("/me", authenticate, me);
router.patch(
  "/rider/availability",
  authenticate,
  authorizeRoles(USER_ROLES.RIDER),
  validateRiderAvailabilityUpdate,
  setRiderAvailability,
);
router.get(
  "/riders/pending",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.PHARMACY_STAFF, USER_ROLES.PHARMACIST),
  getPendingRiders,
);
router.patch(
  "/riders/:riderId/approve",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  approveRider,
);
router.get(
  "/admin/managed-users",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  getManagedUsers,
);
router.get(
  "/admin/users",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  getUsersForAdmin,
);
router.post(
  "/admin/users",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  validateManagedUserCreate,
  createManagedUser,
);
router.patch(
  "/admin/users/:userId",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  validateManagedUserUpdate,
  updateUser,
);
router.delete(
  "/admin/users/:userId",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  deleteUser,
);

export default router;
