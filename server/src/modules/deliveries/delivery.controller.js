import {
  acceptDeliveryForRider,
  assignDelivery,
  createDelivery,
  listAvailableDeliveriesForRider,
  listDeliveryHistoryForRider,
  listDeliveries,
  listDeliveriesForRider,
  rejectDeliveryForRider,
  updateDeliveryStatus,
} from "./delivery.service.js";

export const getDeliveries = async (req, res, next) => {
  try {
    const deliveries = await listDeliveries();
    res.status(200).json({ deliveries });
  } catch (error) {
    next(error);
  }
};

export const getRiderDeliveries = async (req, res, next) => {
  try {
    const deliveries = await listDeliveriesForRider(req.user._id.toString());
    res.status(200).json({ deliveries });
  } catch (error) {
    next(error);
  }
};

export const getAvailableRiderDeliveries = async (req, res, next) => {
  try {
    const deliveries = await listAvailableDeliveriesForRider(req.user._id.toString());
    res.status(200).json({ deliveries });
  } catch (error) {
    next(error);
  }
};

export const getRiderDeliveryHistory = async (req, res, next) => {
  try {
    const deliveries = await listDeliveryHistoryForRider(req.user._id.toString());
    res.status(200).json({ deliveries });
  } catch (error) {
    next(error);
  }
};

export const addDelivery = async (req, res, next) => {
  try {
    const delivery = await createDelivery(req.body.orderId);
    res.status(201).json({ delivery });
  } catch (error) {
    next(error);
  }
};

export const assignDeliveryToRider = async (req, res, next) => {
  try {
    const delivery = await assignDelivery(req.params.deliveryId, req.body.riderId);
    res.status(200).json({ delivery });
  } catch (error) {
    next(error);
  }
};

export const editDeliveryStatus = async (req, res, next) => {
  try {
    const delivery = await updateDeliveryStatus(req.params.deliveryId, req.body);
    res.status(200).json({ delivery });
  } catch (error) {
    next(error);
  }
};

export const editRiderDeliveryStatus = async (req, res, next) => {
  try {
    const delivery = await updateDeliveryStatus(req.params.deliveryId, req.body, req.user._id.toString());
    res.status(200).json({ delivery });
  } catch (error) {
    next(error);
  }
};

export const acceptRiderDelivery = async (req, res, next) => {
  try {
    const delivery = await acceptDeliveryForRider(req.params.deliveryId, req.user._id.toString());
    res.status(200).json({ delivery });
  } catch (error) {
    next(error);
  }
};

export const rejectRiderDelivery = async (req, res, next) => {
  try {
    const delivery = await rejectDeliveryForRider(req.params.deliveryId, req.user._id.toString());
    res.status(200).json({ delivery });
  } catch (error) {
    next(error);
  }
};
