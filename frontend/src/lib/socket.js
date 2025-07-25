import { io } from "socket.io-client";
// export const socket = io("https://strongberry.p-e.kr:3001", {
//   transports: ["websocket"],
// });
export const socket = io({
  path: "/socket.io",
  transports: ["websocket"],
});
