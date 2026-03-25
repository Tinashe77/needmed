import {
  approveRiderAccount,
  createManagedUserAccount,
  deleteUserAccount,
  getCurrentUserProfile,
  listManagedUsers,
  listPendingRiders,
  listUsersForAdmin,
  loginUser,
  registerCustomer,
  registerRider,
  updateRiderAvailability,
  updateUserAccount,
} from "./auth.service.js";

const serializeUser = (user) => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  phone: user.phone,
  role: user.role,
  accountStatus: user.accountStatus,
  pharmacyId: user.pharmacyId,
  branchId: user.branchId,
  riderAvailability: user.riderAvailability,
  riderLastActiveAt: user.riderLastActiveAt,
});

export const register = async (req, res, next) => {
  try {
    const result = await registerCustomer(req.body);

    res.status(201).json({
      user: serializeUser(result.user),
      token: result.token,
    });
  } catch (error) {
    next(error);
  }
};

export const registerRiderAccount = async (req, res, next) => {
  try {
    const result = await registerRider(req.body);

    res.status(201).json({
      user: serializeUser(result.user),
      token: result.token,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const result = await loginUser(req.body);

    res.status(200).json({
      user: serializeUser(result.user),
      token: result.token,
    });
  } catch (error) {
    next(error);
  }
};

export const me = async (req, res, next) => {
  try {
    const user = await getCurrentUserProfile(req.user._id);

    res.status(200).json({
      user: serializeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

export const getPendingRiders = async (req, res, next) => {
  try {
    const riders = await listPendingRiders();

    res.status(200).json({
      riders: riders.map(serializeUser),
    });
  } catch (error) {
    next(error);
  }
};

export const approveRider = async (req, res, next) => {
  try {
    const rider = await approveRiderAccount(req.params.riderId);

    res.status(200).json({
      user: serializeUser(rider),
    });
  } catch (error) {
    next(error);
  }
};

export const createManagedUser = async (req, res, next) => {
  try {
    const user = await createManagedUserAccount(req.body);

    res.status(201).json({
      user: serializeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

export const getManagedUsers = async (req, res, next) => {
  try {
    const users = await listManagedUsers();

    res.status(200).json({
      users: users.map(serializeUser),
    });
  } catch (error) {
    next(error);
  }
};

export const getUsersForAdmin = async (req, res, next) => {
  try {
    const users = await listUsersForAdmin(req.query);

    res.status(200).json({
      users: users.map(serializeUser),
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const user = await updateUserAccount(req.params.userId, req.body, req.user._id.toString());

    res.status(200).json({
      user: serializeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    await deleteUserAccount(req.params.userId, req.user._id.toString());
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const setRiderAvailability = async (req, res, next) => {
  try {
    const rider = await updateRiderAvailability(req.user._id.toString(), req.body.status);

    res.status(200).json({
      user: serializeUser(rider),
    });
  } catch (error) {
    next(error);
  }
};
