import jwt from "jsonwebtoken";

import { env } from "../../config/env.js";
import { AppError } from "../../utils/app-error.js";
import { User } from "./auth.model.js";

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new AppError("Authentication required.", 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(decoded.sub);

    if (!user) {
      throw new AppError("User not found.", 401);
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const authorizeRoles =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError("You are not allowed to access this resource.", 403));
    }

    return next();
  };

