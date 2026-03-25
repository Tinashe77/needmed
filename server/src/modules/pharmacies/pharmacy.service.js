import mongoose from "mongoose";

import { AppError } from "../../utils/app-error.js";
import { Branch } from "./branch.model.js";
import { Pharmacy } from "./pharmacy.model.js";

const ensureObjectId = (value, label) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new AppError(`Invalid ${label}.`, 400);
  }
};

const attachBranches = async (pharmacy) => {
  const branches = await Branch.find({ pharmacyId: pharmacy._id }).sort({ name: 1 }).lean();
  return {
    ...pharmacy.toObject?.() ?? pharmacy,
    branches,
  };
};

export const listPharmacies = async () => {
  const pharmacies = await Pharmacy.find().sort({ createdAt: -1 });
  return Promise.all(pharmacies.map(attachBranches));
};

export const createPharmacy = async (payload) => {
  const existing = await Pharmacy.findOne({ slug: payload.slug.toLowerCase() });

  if (existing) {
    throw new AppError("A pharmacy with this slug already exists.", 409);
  }

  const pharmacy = await Pharmacy.create({
    name: payload.name,
    slug: payload.slug.toLowerCase(),
    supportEmail: payload.supportEmail?.toLowerCase() || null,
    supportPhone: payload.supportPhone || null,
    isActive: payload.isActive ?? true,
  });

  return attachBranches(pharmacy);
};

export const updatePharmacy = async (pharmacyId, payload) => {
  ensureObjectId(pharmacyId, "pharmacy id");

  const pharmacy = await Pharmacy.findById(pharmacyId);

  if (!pharmacy) {
    throw new AppError("Pharmacy not found.", 404);
  }

  if (payload.slug && payload.slug.toLowerCase() !== pharmacy.slug) {
    const existing = await Pharmacy.findOne({ slug: payload.slug.toLowerCase() });

    if (existing) {
      throw new AppError("A pharmacy with this slug already exists.", 409);
    }

    pharmacy.slug = payload.slug.toLowerCase();
  }

  const fields = ["name", "supportPhone", "isActive"];

  for (const field of fields) {
    if (payload[field] !== undefined) {
      pharmacy[field] = payload[field];
    }
  }

  if (payload.supportEmail !== undefined) {
    pharmacy.supportEmail = payload.supportEmail ? payload.supportEmail.toLowerCase() : null;
  }

  await pharmacy.save();
  return attachBranches(pharmacy);
};

export const deletePharmacy = async (pharmacyId) => {
  ensureObjectId(pharmacyId, "pharmacy id");

  const branchCount = await Branch.countDocuments({ pharmacyId });

  if (branchCount > 0) {
    throw new AppError("Delete branches before deleting the pharmacy.", 400);
  }

  const deleted = await Pharmacy.findByIdAndDelete(pharmacyId);

  if (!deleted) {
    throw new AppError("Pharmacy not found.", 404);
  }
};

export const createBranch = async (pharmacyId, payload) => {
  ensureObjectId(pharmacyId, "pharmacy id");

  const pharmacy = await Pharmacy.findById(pharmacyId);

  if (!pharmacy) {
    throw new AppError("Pharmacy not found.", 404);
  }

  const existing = await Branch.findOne({
    pharmacyId,
    code: payload.code.toUpperCase(),
  });

  if (existing) {
    throw new AppError("A branch with this code already exists for the pharmacy.", 409);
  }

  return Branch.create({
    pharmacyId,
    name: payload.name,
    code: payload.code.toUpperCase(),
    addressLine1: payload.addressLine1,
    city: payload.city,
    country: payload.country || "Zimbabwe",
    latitude: payload.latitude ?? null,
    longitude: payload.longitude ?? null,
    isActive: payload.isActive ?? true,
  });
};

export const updateBranch = async (pharmacyId, branchId, payload) => {
  ensureObjectId(pharmacyId, "pharmacy id");
  ensureObjectId(branchId, "branch id");

  const branch = await Branch.findOne({ _id: branchId, pharmacyId });

  if (!branch) {
    throw new AppError("Branch not found.", 404);
  }

  if (payload.code && payload.code.toUpperCase() !== branch.code) {
    const existing = await Branch.findOne({
      pharmacyId,
      code: payload.code.toUpperCase(),
      _id: { $ne: branchId },
    });

    if (existing) {
      throw new AppError("A branch with this code already exists for the pharmacy.", 409);
    }

    branch.code = payload.code.toUpperCase();
  }

  const fields = ["name", "addressLine1", "city", "country", "latitude", "longitude", "isActive"];

  for (const field of fields) {
    if (payload[field] !== undefined) {
      branch[field] = payload[field];
    }
  }

  await branch.save();
  return branch;
};

export const deleteBranch = async (pharmacyId, branchId) => {
  ensureObjectId(pharmacyId, "pharmacy id");
  ensureObjectId(branchId, "branch id");

  const deleted = await Branch.findOneAndDelete({ _id: branchId, pharmacyId });

  if (!deleted) {
    throw new AppError("Branch not found.", 404);
  }
};
