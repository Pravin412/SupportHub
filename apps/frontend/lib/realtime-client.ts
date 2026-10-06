import { io } from "socket.io-client";

export function connectRealtime(apiUrl: string) {
  const url = new URL(apiUrl);
  const prefix = url.pathname.replace(/\/$/, "");
  return io(url.origin, {
    path: `${prefix}/socket.io`,
    transports: ["websocket", "polling"],
    reconnection: true
  });
}
