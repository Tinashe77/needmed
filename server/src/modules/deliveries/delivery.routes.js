import { Router } from "express";

import { USER_ROLES } from "../auth/auth.constants.js";
import { authenticate, authorizeRoles } from "../auth/auth.middleware.js";
import {
  acceptRiderDelivery,
  addDelivery,
  assignDeliveryToRider,
  editDeliveryStatus,
  editRiderDeliveryStatus,
  getAvailableRiderDeliveries,
  getDeliveries,
  getRiderDeliveryHistory,
  getRiderDeliveries,
  rejectRiderDelivery,
} from "./delivery.controller.js";
import {
  validateDeliveryAssign,
  validateDeliveryCreate,
  validateDeliveryStatusUpdate,
} from "./delivery.validators.js";

const router = Router();

router.get(
  "/admin",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.PHARMACIST, USER_ROLES.PHARMACY_STAFF),
  getDeliveries,
);
router.post(
  "/admin",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.PHARMACIST, USER_ROLES.PHARMACY_STAFF),
  validateDeliveryCreate,
  addDelivery,
);
router.patch(
  "/admin/:deliveryId/assign",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.PHARMACIST, USER_ROLES.PHARMACY_STAFF),
  validateDeliveryAssign,
  assignDeliveryToRider,
);
router.patch(
  "/admin/:deliveryId/status",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.PHARMACIST, USER_ROLES.PHARMACY_STAFF),
  validateDeliveryStatusUpdate,
  editDeliveryStatus,
);
router.get(
  "/rider/available",
  authenticate,
  authorizeRoles(USER_ROLES.RIDER),
  getAvailableRiderDeliveries,
);
router.get(
  "/rider/history",
  authenticate,
  authorizeRoles(USER_ROLES.RIDER),
  getRiderDeliveryHistory,
);
router.get(
  "/rider",
  authenticate,
  authorizeRoles(USER_ROLES.RIDER),
  getRiderDeliveries,
);
router.post(
  "/rider/:deliveryId/accept",
  authenticate,
  authorizeRoles(USER_ROLES.RIDER),
  acceptRiderDelivery,
);
router.post(
  "/rider/:deliveryId/reject",
  authenticate,
  authorizeRoles(USER_ROLES.RIDER),
  rejectRiderDelivery,
);
router.patch(
  "/rider/:deliveryId/status",
  authenticate,
  authorizeRoles(USER_ROLES.RIDER),
  validateDeliveryStatusUpdate,
  editRiderDeliveryStatus,
);

export default router;
