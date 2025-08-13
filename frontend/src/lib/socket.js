import { io } from "socket.io-client";

const baseSocketURL =
  import.meta.env.MODE === "production"
    ? undefined // same-origin (운영)
    : import.meta.env.VITE_SOCKET_URL || "http://localhost:3001"; // 로컬 fallback

export const socket = io(baseSocketURL, {
  path: "/socket.io",
  transports: ["polling", "websocket"], // ws 고정
  withCredentials: true, // 서버 CORS credentials 지원
  reconnectionAttempts: 5, // 최대 재연결 시도
  reconnectionDelay: 1000, // 재연결 딜레이(ms)
});
