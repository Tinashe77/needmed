import {
  createBranch,
  createPharmacy,
  deleteBranch,
  deletePharmacy,
  listPharmacies,
  updateBranch,
  updatePharmacy,
} from "./pharmacy.service.js";

export const getPharmacies = async (req, res, next) => {
  try {
    const pharmacies = await listPharmacies();

    res.status(200).json({ pharmacies });
  } catch (error) {
    next(error);
  }
};

export const addPharmacy = async (req, res, next) => {
  try {
    const pharmacy = await createPharmacy(req.body);

    res.status(201).json({ pharmacy });
  } catch (error) {
    next(error);
  }
};

export const editPharmacy = async (req, res, next) => {
  try {
    const pharmacy = await updatePharmacy(req.params.pharmacyId, req.body);

    res.status(200).json({ pharmacy });
  } catch (error) {
    next(error);
  }
};

export const removePharmacy = async (req, res, next) => {
  try {
    await deletePharmacy(req.params.pharmacyId);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const addBranch = async (req, res, next) => {
  try {
    const branch = await createBranch(req.params.pharmacyId, req.body);

    res.status(201).json({ branch });
  } catch (error) {
    next(error);
  }
};

export const editBranch = async (req, res, next) => {
  try {
    const branch = await updateBranch(req.params.pharmacyId, req.params.branchId, req.body);

    res.status(200).json({ branch });
  } catch (error) {
    next(error);
  }
};

export const removeBranch = async (req, res, next) => {
  try {
    await deleteBranch(req.params.pharmacyId, req.params.branchId);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
