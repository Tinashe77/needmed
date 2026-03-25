import cors from "cors";
import express from "express";
import morgan from "morgan";

import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";
import authRoutes from "./modules/auth/auth.routes.js";
import consultationRoutes from "./modules/consultations/consultation.routes.js";
import deliveryRoutes from "./modules/deliveries/delivery.routes.js";
import healthRoutes from "./modules/health/health.routes.js";
import orderRoutes from "./modules/orders/order.routes.js";
import paymentRoutes from "./modules/payments/payment.routes.js";
import pharmacyRoutes from "./modules/pharmacies/pharmacy.routes.js";
import prescriptionRoutes from "./modules/prescriptions/prescription.routes.js";
import productRoutes from "./modules/products/product.routes.js";

const app = express();

const isAllowedLocalOrigin = (origin) => /^http:\/\/(127\.0\.0\.1|localhost):5\d{3}$/.test(origin);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (env.corsOrigins.includes(origin) || (env.nodeEnv !== "production" && isAllowedLocalOrigin(origin))) {
        callback(null, true);
        return;
      }

      callback(new Error("CORS origin not allowed."));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use("/uploads", express.static("server/uploads"));

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/consultations", consultationRoutes);
app.use("/api/deliveries", deliveryRoutes);
app.use("/api/pharmacies", pharmacyRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/products", productRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
