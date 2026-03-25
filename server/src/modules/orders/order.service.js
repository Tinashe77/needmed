import mongoose from "mongoose";

import { AppError } from "../../utils/app-error.js";
import { Branch } from "../pharmacies/branch.model.js";
import { Pharmacy } from "../pharmacies/pharmacy.model.js";
import { Product } from "../products/product.model.js";
import { Order } from "./order.model.js";

const ensureObjectId = (value, label) => {
  if (value && !mongoose.Types.ObjectId.isValid(value)) {
    throw new AppError(`Invalid ${label}.`, 400);
  }
};

const generateOrderNumber = () => `NM-${Date.now()}`;

export const listOrders = async () => Order.find().sort({ createdAt: -1 }).lean();

export const getOrdersForCustomer = async (customerId, customerEmail) => {
  const filters = {};

  if (customerId) {
    filters.customerId = customerId;
  } else if (customerEmail) {
    filters.customerEmail = customerEmail.toLowerCase();
  } else {
    throw new AppError("customerId or customerEmail is required.", 400);
  }

  return Order.find(filters).sort({ createdAt: -1 }).lean();
};

export const createOrder = async (payload) => {
  ensureObjectId(payload.customerId, "customer id");
  ensureObjectId(payload.branchId, "branch id");
  ensureObjectId(payload.pharmacyId, "pharmacy id");

  let resolvedBranchId = payload.branchId || null;
  let resolvedPharmacyId = payload.pharmacyId || null;

  if (!resolvedBranchId) {
    const firstBranch = await Branch.findOne().sort({ createdAt: 1 });
    if (!firstBranch) {
      throw new AppError("No pharmacy branch is configured yet.", 400);
    }

    resolvedBranchId = firstBranch._id;
    resolvedPharmacyId = firstBranch.pharmacyId;
  }

  const branch = await Branch.findById(resolvedBranchId);
  if (!branch) {
    throw new AppError("Branch not found.", 404);
  }

  const pharmacy = await Pharmacy.findById(resolvedPharmacyId || branch.pharmacyId);
  if (!pharmacy) {
    throw new AppError("Pharmacy not found.", 404);
  }

  const productIds = payload.items.map((item) => item.productId);
  const products = await Product.find({ _id: { $in: productIds } }).lean();
  const productMap = new Map(products.map((product) => [product._id.toString(), product]));

  const items = payload.items.map((item) => {
    const product = productMap.get(item.productId);

    if (!product) {
      throw new AppError("One or more products could not be found.", 400);
    }

    const quantity = Math.max(1, Number(item.quantity) || 1);
    const unitPrice = Number(product.price);

    return {
      productId: product._id,
      productName: product.name,
      unitPrice,
      quantity,
      lineTotal: unitPrice * quantity,
      prescriptionOnly: product.prescriptionOnly,
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const deliveryFee = payload.fulfillmentType === "delivery" ? 3 : 0;

  return Order.create({
    orderNumber: generateOrderNumber(),
    customerId: payload.customerId || null,
    customerName: payload.customerName,
    customerPhone: payload.customerPhone,
    customerEmail: payload.customerEmail?.toLowerCase() || null,
    pharmacyId: pharmacy._id,
    branchId: branch._id,
    items,
    fulfillmentType: payload.fulfillmentType,
    paymentMethod: payload.paymentMethod,
    deliveryAddress: payload.deliveryAddress || "",
    subtotal,
    deliveryFee,
    totalAmount: subtotal + deliveryFee,
    status: payload.paymentMethod === "online" ? "PENDING_PAYMENT" : "PENDING_PHARMACY_REVIEW",
    paymentStatus: "pending",
    notes: payload.notes || "",
  });
};

export const updateOrderStatus = async (orderId, payload) => {
  ensureObjectId(orderId, "order id");

  const order = await Order.findById(orderId);

  if (!order) {
    throw new AppError("Order not found.", 404);
  }

  order.status = payload.status;
  if (payload.notes !== undefined) {
    order.notes = payload.notes;
  }

  await order.save();
  return order;
};
