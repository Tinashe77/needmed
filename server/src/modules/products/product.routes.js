import { Router } from "express";

import { USER_ROLES } from "../auth/auth.constants.js";
import { authenticate, authorizeRoles } from "../auth/auth.middleware.js";
import {
  addProduct,
  editProduct,
  getAdminProducts,
  getProduct,
  getProducts,
  saveInventory,
} from "./product.controller.js";
import {
  validateInventoryUpsert,
  validateProductCreate,
  validateProductUpdate,
} from "./product.validators.js";

const router = Router();

router.get(
  "/admin/all",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.PHARMACIST, USER_ROLES.PHARMACY_STAFF),
  getAdminProducts,
);
router.post(
  "/admin",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.PHARMACIST, USER_ROLES.PHARMACY_STAFF),
  validateProductCreate,
  addProduct,
);
router.patch(
  "/admin/:productId",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.PHARMACIST, USER_ROLES.PHARMACY_STAFF),
  validateProductUpdate,
  editProduct,
);
router.put(
  "/admin/:productId/inventory",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.PHARMACIST, USER_ROLES.PHARMACY_STAFF),
  validateInventoryUpsert,
  saveInventory,
);
router.get("/", getProducts);
router.get("/:productId", getProduct);

export default router;
