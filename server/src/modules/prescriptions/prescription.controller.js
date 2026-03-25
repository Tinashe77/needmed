import {
  createPrescription,
  listPrescriptions,
  reviewPrescription,
} from "./prescription.service.js";

export const getPrescriptions = async (req, res, next) => {
  try {
    const prescriptions = await listPrescriptions(req.query);
    res.status(200).json({ prescriptions });
  } catch (error) {
    next(error);
  }
};

export const addPrescription = async (req, res, next) => {
  try {
    const prescription = await createPrescription(req.body);
    res.status(201).json({ prescription });
  } catch (error) {
    next(error);
  }
};

export const updatePrescriptionReview = async (req, res, next) => {
  try {
    const prescription = await reviewPrescription(req.params.prescriptionId, req.body, req.user._id.toString());
    res.status(200).json({ prescription });
  } catch (error) {
    next(error);
  }
};

