import express from "express";

import { authenticate, authorizeRoles } from "../auth/auth.middleware.js";
import {
  getAdminConsultation,
  getAdminConsultations,
  handleWhatsappWebhook,
  patchConsultationStatus,
  postConsultationReply,
} from "./consultation.controller.js";
import { validateConsultationReply, validateConsultationStatusUpdate } from "./consultation.validators.js";

const router = express.Router();

router.post("/twilio/webhook", handleWhatsappWebhook);

router.get(
  "/admin",
  authenticate,
  authorizeRoles("admin", "pharmacist", "pharmacy_staff"),
  getAdminConsultations,
);

router.get(
  "/admin/:consultationId",
  authenticate,
  authorizeRoles("admin", "pharmacist", "pharmacy_staff"),
  getAdminConsultation,
);

router.patch(
  "/admin/:consultationId/status",
  authenticate,
  authorizeRoles("admin", "pharmacist", "pharmacy_staff"),
  validateConsultationStatusUpdate,
  patchConsultationStatus,
);

router.post(
  "/admin/:consultationId/reply",
  authenticate,
  authorizeRoles("admin", "pharmacist", "pharmacy_staff"),
  validateConsultationReply,
  postConsultationReply,
);

export default router;
