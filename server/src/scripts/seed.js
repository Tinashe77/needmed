import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import mongoose from "mongoose";

import { env } from "../config/env.js";
import { ACCOUNT_STATUS, USER_ROLES } from "../modules/auth/auth.constants.js";
import { User } from "../modules/auth/auth.model.js";
import { Branch } from "../modules/pharmacies/branch.model.js";
import { Pharmacy } from "../modules/pharmacies/pharmacy.model.js";

dotenv.config();

const seed = async () => {
  await mongoose.connect(env.mongodbUri);

  const pharmacy = await Pharmacy.findOneAndUpdate(
    { slug: "needmed-main" },
    {
      name: "NeedMed",
      slug: "needmed-main",
      supportEmail: "support@needmed.local",
      supportPhone: "+263700000001",
      isActive: true,
    },
    { new: true, upsert: true },
  );

  const branch = await Branch.findOneAndUpdate(
    { pharmacyId: pharmacy._id, code: "HRE-001" },
    {
      pharmacyId: pharmacy._id,
      name: "NeedMed Central Branch",
      code: "HRE-001",
      addressLine1: "Avondale",
      city: "Harare",
      country: "Zimbabwe",
      isActive: true,
    },
    { new: true, upsert: true },
  );

  const adminPasswordHash = await bcrypt.hash("ChangeMe123!", 10);

  await User.findOneAndUpdate(
    { email: "admin@needmed.local" },
    {
      firstName: "NeedMed",
      lastName: "Admin",
      email: "admin@needmed.local",
      phone: "+263700000000",
      passwordHash: adminPasswordHash,
      role: USER_ROLES.ADMIN,
      accountStatus: ACCOUNT_STATUS.ACTIVE,
      pharmacyId: pharmacy._id,
      branchId: branch._id,
    },
    { new: true, upsert: true },
  );

  console.log("Seed complete");
  await mongoose.disconnect();
};

seed().catch(async (error) => {
  console.error("Seed failed", error);
  await mongoose.disconnect();
  process.exit(1);
});
