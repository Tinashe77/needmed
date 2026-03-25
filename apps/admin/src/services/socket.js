import { io } from "socket.io-client";

const SOCKET_URL = "http://127.0.0.1:5001";

export const connectAdminSocket = (token) =>
  io(SOCKET_URL, {
    transports: ["websocket", "polling"],
    auth: {
      token,
    },
  });
