import mongoose from "mongoose";

import { AppError } from "../../utils/app-error.js";
import { Branch } from "../pharmacies/branch.model.js";
import { Pharmacy } from "../pharmacies/pharmacy.model.js";
import { BranchInventory } from "./branch-inventory.model.js";
import { Product } from "./product.model.js";

const ensureObjectId = (value, label) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new AppError(`Invalid ${label}.`, 400);
  }
};

const resolveStockStatus = (stockQuantity, reorderThreshold) => {
  if (stockQuantity <= 0) {
    return "out_of_stock";
  }

  if (stockQuantity <= reorderThreshold) {
    return "low_stock";
  }

  return "in_stock";
};

const serializeInventory = (inventory) => ({
  ...inventory,
  stockStatus: resolveStockStatus(inventory.stockQuantity, inventory.reorderThreshold),
});

export const listProducts = async (query) => {
  const filters = { isActive: true };

  if (query.category) {
    filters.category = query.category;
  }

  if (query.prescriptionOnly === "true") {
    filters.prescriptionOnly = true;
  }

  if (query.search?.trim()) {
    filters.$text = { $search: query.search.trim() };
  }

  const products = await Product.find(filters).sort({ createdAt: -1 }).lean();

  if (!query.branchId) {
    return products.map((product) => ({ ...product, inventory: [] }));
  }

  ensureObjectId(query.branchId, "branch id");

  const inventories = await BranchInventory.find({
    branchId: query.branchId,
    productId: { $in: products.map((product) => product._id) },
  }).lean();

  const inventoryMap = new Map(
    inventories.map((inventory) => [inventory.productId.toString(), serializeInventory(inventory)]),
  );

  return products.map((product) => ({
    ...product,
    inventory: inventoryMap.get(product._id.toString()) ?? null,
  }));
};

export const getProductById = async (productId, branchId) => {
  ensureObjectId(productId, "product id");

  const product = await Product.findById(productId).lean();

  if (!product || !product.isActive) {
    throw new AppError("Product not found.", 404);
  }

  if (!branchId) {
    return { ...product, inventory: null };
  }

  ensureObjectId(branchId, "branch id");

  const inventory = await BranchInventory.findOne({ branchId, productId }).lean();

  return {
    ...product,
    inventory: inventory ? serializeInventory(inventory) : null,
  };
};

export const listAdminProducts = async () => {
  const products = await Product.find().sort({ createdAt: -1 }).lean();
  const productIds = products.map((product) => product._id);
  const inventories = await BranchInventory.find({ productId: { $in: productIds } }).lean();

  const inventoryMap = new Map();

  for (const inventory of inventories) {
    const key = inventory.productId.toString();
    const current = inventoryMap.get(key) ?? [];
    current.push(serializeInventory(inventory));
    inventoryMap.set(key, current);
  }

  return products.map((product) => ({
    ...product,
    inventory: inventoryMap.get(product._id.toString()) ?? [],
  }));
};

export const createProduct = async (payload) => {
  const existing = await Product.findOne({ sku: payload.sku.toUpperCase() });

  if (existing) {
    throw new AppError("A product with this SKU already exists.", 409);
  }

  return Product.create({
    name: payload.name,
    genericName: payload.genericName || null,
    brand: payload.brand || null,
    category: payload.category,
    description: payload.description || "",
    dosageInformation: payload.dosageInformation || null,
    unitType: payload.unitType,
    price: payload.price,
    images: payload.images || [],
    sku: payload.sku.toUpperCase(),
    prescriptionOnly: payload.prescriptionOnly ?? false,
    warnings: payload.warnings || null,
    isActive: payload.isActive ?? true,
  });
};

export const updateProduct = async (productId, payload) => {
  ensureObjectId(productId, "product id");

  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError("Product not found.", 404);
  }

  if (payload.sku && payload.sku.toUpperCase() !== product.sku) {
    const existing = await Product.findOne({ sku: payload.sku.toUpperCase(), _id: { $ne: productId } });

    if (existing) {
      throw new AppError("A product with this SKU already exists.", 409);
    }

    product.sku = payload.sku.toUpperCase();
  }

  const fields = [
    "name",
    "genericName",
    "brand",
    "category",
    "description",
    "dosageInformation",
    "unitType",
    "price",
    "prescriptionOnly",
    "warnings",
    "isActive",
  ];

  for (const field of fields) {
    if (payload[field] !== undefined) {
      product[field] = payload[field];
    }
  }

  if (payload.images !== undefined) {
    product.images = payload.images;
  }

  await product.save();
  return product;
};

export const upsertInventory = async (productId, payload) => {
  ensureObjectId(productId, "product id");
  ensureObjectId(payload.branchId, "branch id");

  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError("Product not found.", 404);
  }

  const branch = await Branch.findById(payload.branchId);
  if (!branch) {
    throw new AppError("Branch not found.", 404);
  }

  const pharmacy = await Pharmacy.findById(branch.pharmacyId);
  if (!pharmacy) {
    throw new AppError("Pharmacy not found.", 404);
  }

  const inventory = await BranchInventory.findOneAndUpdate(
    { branchId: branch._id, productId: product._id },
    {
      pharmacyId: pharmacy._id,
      branchId: branch._id,
      productId: product._id,
      stockQuantity: payload.stockQuantity,
      reorderThreshold: payload.reorderThreshold ?? 0,
      visibilityStatus: payload.visibilityStatus ?? "visible",
    },
    { new: true, upsert: true },
  ).lean();

  return serializeInventory(inventory);
};

