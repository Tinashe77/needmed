import mongoose from "mongoose";

import { AppError } from "../../utils/app-error.js";
import { Order } from "../orders/order.model.js";
import { Payment } from "./payment.model.js";

const ensureObjectId = (value, label) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new AppError(`Invalid ${label}.`, 400);
  }
};

const sessionReference = () => `MOCK-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const syncOrderPaymentStatus = async (orderId, paymentStatus) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new AppError("Order not found.", 404);
  }

  order.paymentStatus = paymentStatus;

  if (paymentStatus === "paid" && order.paymentMethod === "online" && order.status === "PENDING_PAYMENT") {
    order.status = "PENDING_PHARMACY_REVIEW";
  }

  if (paymentStatus === "failed" && order.paymentMethod === "online") {
    order.status = "PENDING_PAYMENT";
  }

  await order.save();
  return order;
};

export const initializeCodPayment = async (orderId) => {
  ensureObjectId(orderId, "order id");
  const order = await Order.findById(orderId);

  if (!order) {
    throw new AppError("Order not found.", 404);
  }

  const existing = await Payment.findOne({ orderId: order._id });
  if (existing) {
    return existing;
  }

  const payment = await Payment.create({
    orderId: order._id,
    orderNumber: order.orderNumber,
    amount: order.totalAmount,
    paymentMethod: order.paymentMethod,
    provider: "manual",
    status: order.paymentStatus,
  });

  return payment;
};

export const createMockPaymentSession = async (orderId) => {
  ensureObjectId(orderId, "order id");
  const order = await Order.findById(orderId);

  if (!order) {
    throw new AppError("Order not found.", 404);
  }

  if (order.paymentMethod !== "online") {
    throw new AppError("This order is not configured for online payment.", 400);
  }

  let payment = await Payment.findOne({ orderId: order._id });

  if (!payment) {
    payment = await Payment.create({
      orderId: order._id,
      orderNumber: order.orderNumber,
      amount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      provider: "mockpay",
      sessionReference: sessionReference(),
      status: "pending",
    });
  }

  order.paymentStatus = "pending";
  order.status = "PENDING_PAYMENT";
  await order.save();

  return {
    payment,
    paymentUrl: `/mock-pay/${payment.sessionReference}`,
  };
};

export const handleMockPaymentCallback = async ({ sessionReference: ref, status }) => {
  const payment = await Payment.findOne({ sessionReference: ref });

  if (!payment) {
    throw new AppError("Payment session not found.", 404);
  }

  payment.status = status;
  payment.paidAt = status === "paid" ? new Date() : null;
  await payment.save();

  await syncOrderPaymentStatus(payment.orderId, status);
  return payment;
};

export const listPayments = async () => Payment.find().sort({ createdAt: -1 }).lean();

export const updatePaymentStatus = async (paymentId, { status, notes }) => {
  ensureObjectId(paymentId, "payment id");
  const payment = await Payment.findById(paymentId);

  if (!payment) {
    throw new AppError("Payment not found.", 404);
  }

  payment.status = status;
  if (notes !== undefined) {
    payment.notes = notes;
  }
  if (status === "paid") {
    payment.paidAt = new Date();
  }

  await payment.save();
  await syncOrderPaymentStatus(payment.orderId, status);
  return payment;
};

