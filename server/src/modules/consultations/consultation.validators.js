import { AppError } from "../../utils/app-error.js";

const allowedStatuses = ["intake_in_progress", "ready_for_review", "in_review", "waiting_for_customer", "completed", "closed"];

export const validateConsultationStatusUpdate = (req, res, next) => {
  if (!allowedStatuses.includes(req.body.status)) {
    return next(new AppError("A valid consultation status is required.", 400));
  }

  return next();
};

export const validateConsultationReply = (req, res, next) => {
  if (!String(req.body.body ?? "").trim()) {
    return next(new AppError("Reply message is required.", 400));
  }

  if (req.body.status && !allowedStatuses.includes(req.body.status)) {
    return next(new AppError("Reply status is invalid.", 400));
  }

  return next();
};
