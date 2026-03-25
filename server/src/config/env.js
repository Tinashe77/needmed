import dotenv from "dotenv";

dotenv.config();

const parseCorsOrigins = () =>
  (process.env.CORS_ORIGIN ?? "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 5001),
  mongodbUri:
    process.env.MONGO_URI ??
    process.env.MONGODB_URI ??
    "mongodb://127.0.0.1:27017/needmed",
  jwtSecret: process.env.JWT_SECRET ?? "change-this-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "1d",
  corsOrigins: parseCorsOrigins(),
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ?? "",
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN ?? "",
  twilioWhatsappFrom: process.env.TWILIO_WHATSAPP_FROM ?? "",
};
