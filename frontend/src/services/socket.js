import { io } from "socket.io-client";

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io("http://localhost:4000", {
      transports: ["websocket"],
      reconnection: false, // IMPORTANT: stop infinite retry loop
    });
  }
  return socket;
}
