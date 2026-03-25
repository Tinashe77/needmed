import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? "https://needmed.onrender.com";

export const connectRiderSocket = (token) =>
  io(SOCKET_URL, {
    transports: ["websocket", "polling"],
    auth: {
      token,
    },
  });
