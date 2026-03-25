import { Router } from "express";

import { USER_ROLES } from "../auth/auth.constants.js";
import { authenticate, authorizeRoles } from "../auth/auth.middleware.js";
import {
  addOrder,
  editOrderStatus,
  getAdminOrders,
  getCustomerOrders,
} from "./order.controller.js";
import { validateOrderCreate, validateOrderStatusUpdate } from "./order.validators.js";

const router = Router();

router.post("/", validateOrderCreate, addOrder);
router.get("/customer", getCustomerOrders);
router.get(
  "/admin",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.PHARMACIST, USER_ROLES.PHARMACY_STAFF),
  getAdminOrders,
);
router.patch(
  "/admin/:orderId/status",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.PHARMACIST, USER_ROLES.PHARMACY_STAFF),
  validateOrderStatusUpdate,
  editOrderStatus,
);

export default router;

