import {
  createProduct,
  getProductById,
  listAdminProducts,
  listProducts,
  updateProduct,
  upsertInventory,
} from "./product.service.js";

export const getProducts = async (req, res, next) => {
  try {
    const products = await listProducts(req.query);
    res.status(200).json({ products });
  } catch (error) {
    next(error);
  }
};

export const getProduct = async (req, res, next) => {
  try {
    const product = await getProductById(req.params.productId, req.query.branchId);
    res.status(200).json({ product });
  } catch (error) {
    next(error);
  }
};

export const getAdminProducts = async (req, res, next) => {
  try {
    const products = await listAdminProducts();
    res.status(200).json({ products });
  } catch (error) {
    next(error);
  }
};

export const addProduct = async (req, res, next) => {
  try {
    const product = await createProduct(req.body);
    res.status(201).json({ product });
  } catch (error) {
    next(error);
  }
};

export const editProduct = async (req, res, next) => {
  try {
    const product = await updateProduct(req.params.productId, req.body);
    res.status(200).json({ product });
  } catch (error) {
    next(error);
  }
};

export const saveInventory = async (req, res, next) => {
  try {
    const inventory = await upsertInventory(req.params.productId, req.body);
    res.status(200).json({ inventory });
  } catch (error) {
    next(error);
  }
};

