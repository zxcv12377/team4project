import { io } from "socket.io-client";
// export const socket = io("https://strongberry.p-e.kr:3001", {
//   transports: ["websocket"],
// });

const baseSocketURL =
  import.meta.env.MODE === "production"
    ? undefined // 운영에선 같은 origin
    : import.meta.env.VITE_SOCKET_URL; // 로컬 개발용

export const socket = io(baseSocketURL, {
  path: "/socket.io",
  transports: ["websocket"],
});
