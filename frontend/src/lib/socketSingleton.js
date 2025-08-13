import { io } from "socket.io-client";

let _socket;
export function getSocket(baseURL) {
  if (_socket) return _socket;
  _socket = io(baseURL, {
    path: "/socket.io",
    transports: ["websocket"],
    withCredentials: true,
  });
  return _socket;
}
