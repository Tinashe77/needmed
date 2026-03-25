import jwt from "jsonwebtoken";
import { Server } from "socket.io";

import { env } from "../config/env.js";
import { USER_ROLES } from "../modules/auth/auth.constants.js";
import { User } from "../modules/auth/auth.model.js";

let io = null;

const isAllowedLocalOrigin = (origin) => /^http:\/\/(127\.0\.0\.1|localhost):5\d{3}$/.test(origin);

const allowOrigin = (origin) => {
  if (!origin) {
    return true;
  }

  return env.corsOrigins.includes(origin) || (env.nodeEnv !== "production" && isAllowedLocalOrigin(origin));
};

const joinAvailabilityRoom = (socket, user) => {
  if (user.role === "rider" && user.riderAvailability === "online") {
    socket.join("riders:online");
  } else {
    socket.leave("riders:online");
  }
};

const joinOperationsRoom = (socket, user) => {
  if ([USER_ROLES.ADMIN, USER_ROLES.PHARMACIST, USER_ROLES.PHARMACY_STAFF].includes(user.role)) {
    socket.join("ops:dashboard");
  }
};

export const initializeSocketServer = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin(origin, callback) {
        callback(allowOrigin(origin) ? null : new Error("Socket origin not allowed."), allowOrigin(origin));
      },
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        throw new Error("Authentication required.");
      }

      const decoded = jwt.verify(token, env.jwtSecret);
      const user = await User.findById(decoded.sub);

      if (!user) {
        throw new Error("User not found.");
      }

      socket.user = user;
      next();
    } catch (error) {
      next(error);
    }
  });

  io.on("connection", (socket) => {
    const user = socket.user;
    socket.join(`user:${user._id.toString()}`);
    joinOperationsRoom(socket, user);

    if (user.role === "rider") {
      socket.join(`rider:${user._id.toString()}`);
      joinAvailabilityRoom(socket, user);
      io.emit("rider:connected", {
        riderId: user._id.toString(),
        riderAvailability: user.riderAvailability,
      });
    }

    socket.on("rider:status:update", async (payload = {}) => {
      if (socket.user.role !== "rider") {
        return;
      }

      const rider = await User.findById(socket.user._id);
      if (!rider) {
        return;
      }

      rider.riderAvailability = payload.status === "online" ? "online" : "offline";
      rider.riderLastActiveAt = new Date();
      await rider.save();
      socket.user = rider;
      joinAvailabilityRoom(socket, rider);

      io.emit("rider:status:updated", {
        riderId: rider._id.toString(),
        riderAvailability: rider.riderAvailability,
        riderLastActiveAt: rider.riderLastActiveAt,
      });
    });

    socket.on("rider:location:update", async (payload = {}) => {
      if (socket.user.role !== "rider") {
        return;
      }

      const rider = await User.findById(socket.user._id);
      if (!rider) {
        return;
      }

      rider.riderCurrentLocation = {
        latitude: Number(payload.latitude) || null,
        longitude: Number(payload.longitude) || null,
        accuracy: Number(payload.accuracy) || null,
        updatedAt: new Date(),
      };
      rider.riderLastActiveAt = new Date();
      await rider.save();

      io.emit("rider:location:updated", {
        riderId: rider._id.toString(),
        location: rider.riderCurrentLocation,
      });
    });

    socket.on("disconnect", () => {
      if (socket.user?.role === "rider") {
        io.emit("rider:disconnected", {
          riderId: socket.user._id.toString(),
        });
      }
    });
  });

  return io;
};

export const getSocketServer = () => io;

export const emitToOnlineRiders = (event, payload) => {
  io?.to("riders:online").emit(event, payload);
};

export const emitToOperations = (event, payload) => {
  io?.to("ops:dashboard").emit(event, payload);
};

export const emitToRider = (riderId, event, payload) => {
  io?.to(`rider:${riderId}`).emit(event, payload);
};

export const emitToUser = (userId, event, payload) => {
  io?.to(`user:${userId}`).emit(event, payload);
};
