import {
  createMockPaymentSession,
  handleMockPaymentCallback,
  initializeCodPayment,
  listPayments,
  updatePaymentStatus,
} from "./payment.service.js";

export const createSession = async (req, res, next) => {
  try {
    const result = await createMockPaymentSession(req.body.orderId);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const initCodPayment = async (req, res, next) => {
  try {
    const payment = await initializeCodPayment(req.body.orderId);
    res.status(201).json({ payment });
  } catch (error) {
    next(error);
  }
};

export const callback = async (req, res, next) => {
  try {
    const payment = await handleMockPaymentCallback(req.body);
    res.status(200).json({ payment });
  } catch (error) {
    next(error);
  }
};

export const getPayments = async (req, res, next) => {
  try {
    const payments = await listPayments();
    res.status(200).json({ payments });
  } catch (error) {
    next(error);
  }
};

export const editPaymentStatus = async (req, res, next) => {
  try {
    const payment = await updatePaymentStatus(req.params.paymentId, req.body);
    res.status(200).json({ payment });
  } catch (error) {
    next(error);
  }
};

