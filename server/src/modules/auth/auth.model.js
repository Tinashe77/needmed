import mongoose from "mongoose";

import { ACCOUNT_STATUS, RIDER_AVAILABILITY, USER_ROLES } from "./auth.constants.js";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.CUSTOMER,
    },
    accountStatus: {
      type: String,
      enum: Object.values(ACCOUNT_STATUS),
      default: ACCOUNT_STATUS.ACTIVE,
    },
    pharmacyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pharmacy",
      default: null,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
    },
    riderAvailability: {
      type: String,
      enum: Object.values(RIDER_AVAILABILITY),
      default: RIDER_AVAILABILITY.OFFLINE,
      index: true,
    },
    riderLastActiveAt: {
      type: Date,
      default: null,
    },
    riderCurrentLocation: {
      latitude: {
        type: Number,
        default: null,
      },
      longitude: {
        type: Number,
        default: null,
      },
      accuracy: {
        type: Number,
        default: null,
      },
      updatedAt: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  },
);

userSchema.index({ role: 1, accountStatus: 1 });

export const User = mongoose.model("User", userSchema);
