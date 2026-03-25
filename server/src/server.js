import mongoose from "mongoose";
import http from "http";

import app from "./app.js";
import { env } from "./config/env.js";
import { initializeSocketServer } from "./realtime/socket.js";

const start = async () => {
  try {
    await mongoose.connect(env.mongodbUri);
    const server = http.createServer(app);
    initializeSocketServer(server);
    server.listen(env.port, () => {
      console.log(`NeedMed API listening on port ${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
};

start();
