import {
  getConsultationById,
  listConsultations,
  processWhatsappWebhook,
  replyToConsultation,
  updateConsultationStatus,
} from "./consultation.service.js";

export const handleWhatsappWebhook = async (req, res, next) => {
  try {
    const result = await processWhatsappWebhook(req.body);
    res.set("Content-Type", "text/xml");
    res.status(200).send(result.twiml);
  } catch (error) {
    next(error);
  }
};

export const getAdminConsultations = async (req, res, next) => {
  try {
    const consultations = await listConsultations();
    res.status(200).json({ consultations });
  } catch (error) {
    next(error);
  }
};

export const getAdminConsultation = async (req, res, next) => {
  try {
    const consultation = await getConsultationById(req.params.consultationId);
    res.status(200).json({ consultation });
  } catch (error) {
    next(error);
  }
};

export const patchConsultationStatus = async (req, res, next) => {
  try {
    const consultation = await updateConsultationStatus(req.params.consultationId, req.body, req.user._id);
    res.status(200).json({ consultation });
  } catch (error) {
    next(error);
  }
};

export const postConsultationReply = async (req, res, next) => {
  try {
    const consultation = await replyToConsultation(req.params.consultationId, req.body, req.user);
    res.status(200).json({ consultation });
  } catch (error) {
    next(error);
  }
};
