import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import { env } from "../../config/env.js";
import { AppError } from "../../utils/app-error.js";
import { ACCOUNT_STATUS, RIDER_AVAILABILITY, USER_ROLES } from "./auth.constants.js";
import { User } from "./auth.model.js";

const signToken = (user) =>
  jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      pharmacyId: user.pharmacyId,
      branchId: user.branchId,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  );

export const registerCustomer = async (payload) => {
  const existingUser = await User.findOne({ email: payload.email.toLowerCase() });

  if (existingUser) {
    throw new AppError("An account with this email already exists.", 409);
  }

  const passwordHash = await bcrypt.hash(payload.password, 10);

  const user = await User.create({
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email.toLowerCase(),
    phone: payload.phone,
    passwordHash,
    role: USER_ROLES.CUSTOMER,
    accountStatus: ACCOUNT_STATUS.ACTIVE,
    riderAvailability: RIDER_AVAILABILITY.OFFLINE,
  });

  return {
    user,
    token: signToken(user),
  };
};

export const registerRider = async (payload) => {
  const existingUser = await User.findOne({ email: payload.email.toLowerCase() });

  if (existingUser) {
    throw new AppError("An account with this email already exists.", 409);
  }

  const passwordHash = await bcrypt.hash(payload.password, 10);

  const user = await User.create({
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email.toLowerCase(),
    phone: payload.phone,
    passwordHash,
    role: USER_ROLES.RIDER,
    accountStatus: ACCOUNT_STATUS.PENDING_APPROVAL,
    riderAvailability: RIDER_AVAILABILITY.OFFLINE,
  });

  return {
    user,
    token: signToken(user),
  };
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    throw new AppError("Invalid email or password.", 401);
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError("Invalid email or password.", 401);
  }

  if (user.accountStatus !== ACCOUNT_STATUS.ACTIVE) {
    throw new AppError("This account is not active.", 403);
  }

  return {
    user,
    token: signToken(user),
  };
};

export const getCurrentUserProfile = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  return user;
};

export const listPendingRiders = async () =>
  User.find({
    role: USER_ROLES.RIDER,
    accountStatus: ACCOUNT_STATUS.PENDING_APPROVAL,
  })
    .sort({ createdAt: -1 })
    .lean();

export const approveRiderAccount = async (riderId) => {
  if (!mongoose.Types.ObjectId.isValid(riderId)) {
    throw new AppError("Invalid rider id.", 400);
  }

  const rider = await User.findOneAndUpdate(
    {
      _id: riderId,
      role: USER_ROLES.RIDER,
    },
    { accountStatus: ACCOUNT_STATUS.ACTIVE },
    { new: true },
  );

  if (!rider) {
    throw new AppError("Rider not found.", 404);
  }

  return rider;
};

export const listManagedUsers = async () =>
  User.find({
    role: {
      $in: [USER_ROLES.ADMIN, USER_ROLES.PHARMACIST, USER_ROLES.PHARMACY_STAFF],
    },
  })
    .sort({ createdAt: -1 })
    .lean();

export const listUsersForAdmin = async (query) => {
  const filters = {};

  if (query.role && query.role !== "all") {
    filters.role = query.role;
  }

  if (query.accountStatus && query.accountStatus !== "all") {
    filters.accountStatus = query.accountStatus;
  }

  if (query.search?.trim()) {
    const regex = new RegExp(query.search.trim(), "i");
    filters.$or = [
      { firstName: regex },
      { lastName: regex },
      { email: regex },
      { phone: regex },
    ];
  }

  return User.find(filters).sort({ createdAt: -1 }).lean();
};

export const createManagedUserAccount = async (payload) => {
  const existingUser = await User.findOne({ email: payload.email.toLowerCase() });

  if (existingUser) {
    throw new AppError("An account with this email already exists.", 409);
  }

  const passwordHash = await bcrypt.hash(payload.password, 10);

  return User.create({
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email.toLowerCase(),
    phone: payload.phone,
    passwordHash,
    role: payload.role,
    accountStatus: payload.accountStatus ?? ACCOUNT_STATUS.ACTIVE,
    pharmacyId: payload.pharmacyId || null,
    branchId: payload.branchId || null,
    riderAvailability: payload.role === USER_ROLES.RIDER ? RIDER_AVAILABILITY.OFFLINE : RIDER_AVAILABILITY.OFFLINE,
  });
};

export const updateUserAccount = async (userId, payload, currentUserId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError("Invalid user id.", 400);
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  if (userId === currentUserId && payload.accountStatus && payload.accountStatus !== ACCOUNT_STATUS.ACTIVE) {
    throw new AppError("You cannot deactivate your own account.", 400);
  }

  if (payload.email && payload.email.toLowerCase() !== user.email) {
    const existingUser = await User.findOne({ email: payload.email.toLowerCase() });

    if (existingUser) {
      throw new AppError("An account with this email already exists.", 409);
    }

    user.email = payload.email.toLowerCase();
  }

  const editableFields = ["firstName", "lastName", "phone", "role", "accountStatus"];

  for (const field of editableFields) {
    if (payload[field] !== undefined) {
      user[field] = payload[field];
    }
  }

  if (payload.password) {
    user.passwordHash = await bcrypt.hash(payload.password, 10);
  }

  if (payload.pharmacyId !== undefined) {
    user.pharmacyId = payload.pharmacyId || null;
  }

  if (payload.branchId !== undefined) {
    user.branchId = payload.branchId || null;
  }

  if (user.role !== USER_ROLES.RIDER) {
    user.riderAvailability = RIDER_AVAILABILITY.OFFLINE;
  }

  await user.save();
  return user;
};

export const updateRiderAvailability = async (userId, status) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError("Invalid rider id.", 400);
  }

  const rider = await User.findOne({
    _id: userId,
    role: USER_ROLES.RIDER,
    accountStatus: ACCOUNT_STATUS.ACTIVE,
  });

  if (!rider) {
    throw new AppError("Active rider account not found.", 404);
  }

  rider.riderAvailability = status;
  rider.riderLastActiveAt = new Date();
  await rider.save();

  return rider;
};

export const deleteUserAccount = async (userId, currentUserId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError("Invalid user id.", 400);
  }

  if (userId === currentUserId) {
    throw new AppError("You cannot delete your own account.", 400);
  }

  const deletedUser = await User.findByIdAndDelete(userId);

  if (!deletedUser) {
    throw new AppError("User not found.", 404);
  }
};
