import fs from "fs/promises";
import path from "path";
import mongoose from "mongoose";

import { AppError } from "../../utils/app-error.js";
import { emitToOnlineRiders, emitToOperations, emitToRider } from "../../realtime/socket.js";
import { USER_ROLES } from "../auth/auth.constants.js";
import { User } from "../auth/auth.model.js";
import { Order } from "../orders/order.model.js";
import { Delivery } from "./delivery.model.js";

const uploadsDir = path.resolve(process.cwd(), "server/uploads/deliveries");

const ensureObjectId = (value, label) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new AppError(`Invalid ${label}.`, 400);
  }
};

const createDeliveryOtp = () => String(Math.floor(1000 + Math.random() * 9000));

const persistDeliveryProofPhoto = async ({ fileName, fileData }) => {
  const matches = String(fileData).match(/^data:(.+);base64,(.+)$/);

  if (!matches) {
    throw new AppError("Invalid delivery proof file data.", 400);
  }

  const ext = path.extname(fileName || "") || ".jpg";
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  const fullPath = path.join(uploadsDir, safeName);

  await fs.mkdir(uploadsDir, { recursive: true });
  await fs.writeFile(fullPath, Buffer.from(matches[2], "base64"));

  return `/uploads/deliveries/${safeName}`;
};

const syncOrderStatusFromDelivery = async (delivery) => {
  const order = await Order.findById(delivery.orderId);

  if (!order) {
    throw new AppError("Order not found.", 404);
  }

  const mapping = {
    PENDING_ASSIGNMENT: "READY_FOR_DISPATCH",
    ASSIGNED: "READY_FOR_DISPATCH",
    ACCEPTED: "READY_FOR_DISPATCH",
    ARRIVED_AT_PHARMACY: "READY_FOR_DISPATCH",
    PICKED_UP: "OUT_FOR_DELIVERY",
    IN_TRANSIT: "OUT_FOR_DELIVERY",
    OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
    DELIVERED: "DELIVERED",
    FAILED: "FAILED_DELIVERY",
    CANCELLED: "CANCELLED",
  };

  const nextOrderStatus = mapping[delivery.status];
  if (nextOrderStatus) {
    order.status = nextOrderStatus;
  }

  await order.save();
  return order;
};

export const listDeliveries = async () =>
  Delivery.find()
    .populate("riderId", "firstName lastName email phone accountStatus riderAvailability riderCurrentLocation")
    .sort({ createdAt: -1 })
    .lean();

export const listAvailableDeliveriesForRider = async (riderId) => {
  ensureObjectId(riderId, "rider id");

  return Delivery.find({
    riderId: null,
    status: "PENDING_ASSIGNMENT",
    rejectedRiderIds: { $ne: riderId },
  })
    .sort({ createdAt: -1 })
    .lean();
};

export const listDeliveriesForRider = async (riderId) =>
  Delivery.find({
    riderId,
    status: {
      $in: ["ASSIGNED", "ACCEPTED", "ARRIVED_AT_PHARMACY", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"],
    },
  })
    .populate("riderId", "firstName lastName email phone accountStatus riderAvailability riderCurrentLocation")
    .sort({ createdAt: -1 })
    .lean();

export const listDeliveryHistoryForRider = async (riderId) =>
  Delivery.find({
    riderId,
    status: {
      $in: ["DELIVERED", "FAILED", "CANCELLED"],
    },
  })
    .populate("riderId", "firstName lastName email phone accountStatus riderAvailability riderCurrentLocation")
    .sort({ updatedAt: -1 })
    .lean();

export const createDelivery = async (orderId) => {
  ensureObjectId(orderId, "order id");

  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError("Order not found.", 404);
  }

  if (order.fulfillmentType !== "delivery") {
    throw new AppError("This order is not a delivery order.", 400);
  }

  const existing = await Delivery.findOne({ orderId: order._id });
  if (existing) {
    return existing;
  }

  const delivery = await Delivery.create({
    orderId: order._id,
    orderNumber: order.orderNumber,
    pharmacyId: order.pharmacyId,
    branchId: order.branchId,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    deliveryAddress: order.deliveryAddress,
    deliveryFee: order.deliveryFee,
    paymentMethod: order.paymentMethod,
    codAmountDue: order.paymentMethod === "cash_on_delivery" ? order.totalAmount : 0,
    codAmountCollected: 0,
    deliveryOtp: createDeliveryOtp(),
    status: "PENDING_ASSIGNMENT",
  });

  await syncOrderStatusFromDelivery(delivery);
  emitToOnlineRiders("delivery:new_request", { delivery });
  emitToOperations("delivery:created", { delivery });
  return delivery;
};

export const assignDelivery = async (deliveryId, riderId) => {
  ensureObjectId(deliveryId, "delivery id");
  ensureObjectId(riderId, "rider id");

  const rider = await User.findOne({
    _id: riderId,
    role: USER_ROLES.RIDER,
    accountStatus: "active",
  });
  if (!rider) {
    throw new AppError("Rider not found.", 404);
  }

  const delivery = await Delivery.findById(deliveryId);
  if (!delivery) {
    throw new AppError("Delivery not found.", 404);
  }

  delivery.riderId = rider._id;
  delivery.status = "ASSIGNED";
  await delivery.save();
  await syncOrderStatusFromDelivery(delivery);
  emitToRider(rider._id.toString(), "delivery:assigned", { delivery });
  emitToOperations("delivery:assigned", {
    delivery,
    riderId: rider._id.toString(),
  });
  return delivery;
};

export const acceptDeliveryForRider = async (deliveryId, riderId) => {
  ensureObjectId(deliveryId, "delivery id");
  ensureObjectId(riderId, "rider id");

  const rider = await User.findOne({
    _id: riderId,
    role: USER_ROLES.RIDER,
    accountStatus: "active",
    riderAvailability: "online",
  });

  if (!rider) {
    throw new AppError("Online rider account not found.", 404);
  }

  const delivery = await Delivery.findById(deliveryId);
  if (!delivery) {
    throw new AppError("Delivery not found.", 404);
  }

  if (delivery.riderId && delivery.riderId.toString() !== riderId) {
    throw new AppError("Delivery has already been claimed.", 409);
  }

  if (!["PENDING_ASSIGNMENT", "ASSIGNED"].includes(delivery.status)) {
    throw new AppError("Delivery can no longer be accepted.", 400);
  }

  if (delivery.rejectedRiderIds.some((item) => item.toString() === riderId)) {
    throw new AppError("You already rejected this delivery request.", 400);
  }

  delivery.riderId = rider._id;
  delivery.status = "ACCEPTED";
  await delivery.save();
  await syncOrderStatusFromDelivery(delivery);
  emitToRider(rider._id.toString(), "delivery:accepted", { delivery });
  emitToOnlineRiders("delivery:accepted", {
    deliveryId: delivery._id.toString(),
    riderId: rider._id.toString(),
  });
  emitToOperations("delivery:accepted", {
    delivery,
    riderId: rider._id.toString(),
  });
  return delivery;
};

export const rejectDeliveryForRider = async (deliveryId, riderId) => {
  ensureObjectId(deliveryId, "delivery id");
  ensureObjectId(riderId, "rider id");

  const delivery = await Delivery.findById(deliveryId);
  if (!delivery) {
    throw new AppError("Delivery not found.", 404);
  }

  if (delivery.riderId) {
    throw new AppError("Assigned deliveries cannot be rejected from the request feed.", 400);
  }

  if (delivery.status !== "PENDING_ASSIGNMENT") {
    throw new AppError("Delivery request is no longer available.", 400);
  }

  if (!delivery.rejectedRiderIds.some((item) => item.toString() === riderId)) {
    delivery.rejectedRiderIds.push(riderId);
    await delivery.save();
  }

  emitToRider(riderId, "delivery:rejected", {
    deliveryId: delivery._id.toString(),
  });
  emitToOperations("delivery:rejected", {
    deliveryId: delivery._id.toString(),
    riderId,
  });
  return delivery;
};

export const updateDeliveryStatus = async (deliveryId, payload, riderId = null) => {
  ensureObjectId(deliveryId, "delivery id");

  const delivery = await Delivery.findById(deliveryId);
  if (!delivery) {
    throw new AppError("Delivery not found.", 404);
  }

  if (riderId) {
    ensureObjectId(riderId, "rider id");
    if (!delivery.riderId || delivery.riderId.toString() !== riderId) {
      throw new AppError("This delivery is not assigned to the current rider.", 403);
    }
  }

  if (payload.status === "DELIVERED") {
    const otpMatches = payload.deliveryOtp && String(payload.deliveryOtp).trim() === delivery.deliveryOtp;
    let photoUrl = delivery.proof?.photoUrl || "";

    if (payload.proofPhotoData) {
      photoUrl = await persistDeliveryProofPhoto({
        fileName: payload.proofPhotoName || "delivery-proof.jpg",
        fileData: payload.proofPhotoData,
      });
    }

    if (!otpMatches && !photoUrl) {
      throw new AppError("Delivery completion requires a valid OTP or photo proof.", 400);
    }

    if (delivery.paymentMethod === "cash_on_delivery" && !payload.codCollected) {
      throw new AppError("Cash on delivery orders must be marked as collected before completion.", 400);
    }

    delivery.proof = {
      photoUrl,
      method: otpMatches ? "otp" : "photo",
      otpCode: otpMatches ? delivery.deliveryOtp : "",
      otpVerifiedAt: otpMatches ? new Date() : null,
      deliveredAt: new Date(),
    };

    if (delivery.paymentMethod === "cash_on_delivery") {
      delivery.codAmountCollected = Number(payload.codAmountCollected || delivery.codAmountDue || 0);
    }
  }

  delivery.status = payload.status;
  if (payload.notes !== undefined) {
    delivery.notes = payload.notes;
  }
  if (payload.proofOfDelivery !== undefined) {
    delivery.proofOfDelivery = payload.proofOfDelivery;
  }
  if (payload.codCollected !== undefined) {
    delivery.codCollected = payload.codCollected;
  }
  if (payload.status !== "DELIVERED" && payload.codAmountCollected !== undefined) {
    delivery.codAmountCollected = Number(payload.codAmountCollected || 0);
  }

  await delivery.save();
  await syncOrderStatusFromDelivery(delivery);
  if (delivery.riderId) {
    emitToRider(delivery.riderId.toString(), "delivery:status_updated", { delivery });
  }
  emitToOperations("delivery:status_updated", { delivery });
  return delivery;
};
