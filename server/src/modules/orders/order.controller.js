import {
  createOrder,
  getOrdersForCustomer,
  listOrders,
  updateOrderStatus,
} from "./order.service.js";

export const addOrder = async (req, res, next) => {
  try {
    const order = await createOrder(req.body);
    res.status(201).json({ order });
  } catch (error) {
    next(error);
  }
};

export const getAdminOrders = async (req, res, next) => {
  try {
    const orders = await listOrders();
    res.status(200).json({ orders });
  } catch (error) {
    next(error);
  }
};

export const getCustomerOrders = async (req, res, next) => {
  try {
    const orders = await getOrdersForCustomer(req.query.customerId, req.query.customerEmail);
    res.status(200).json({ orders });
  } catch (error) {
    next(error);
  }
};

export const editOrderStatus = async (req, res, next) => {
  try {
    const order = await updateOrderStatus(req.params.orderId, req.body);
    res.status(200).json({ order });
  } catch (error) {
    next(error);
  }
};

