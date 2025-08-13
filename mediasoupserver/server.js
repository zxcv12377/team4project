// server.js
// 필요 패키지: yarn add dotenv-flow express socket.io
const dotenvFlow = require("dotenv-flow");

// 1) NODE_ENV 기본값 및 .env 자동 로드 (.env, .env.development, .env.production)
process.env.NODE_ENV = process.env.NODE_ENV || "development";
dotenvFlow.config({ default_node_env: "development" });

const isProd = process.env.NODE_ENV === "production";

console.log(`✅ NODE_ENV=${process.env.NODE_ENV}`);
console.log(`📡 ANNOUNCED_IP=${process.env.ANNOUNCED_IP || "(unset)"}`);
console.log(`🔌 PORT=${process.env.PORT || 3001}`);

const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const { createMediasoupWorkerAndRouter } = require("./lib/mediasoup");
const {
  setupSignaling,
  voiceRoomParticipants,
} = require("./handlers/signaling");

const app = express();
const server = http.createServer(app);

// 2) Socket.IO (same path for Nginx proxy: /socket.io)
const io = socketIO(server, {
  path: "/socket.io",
  cors: {
    origin: (origin, cb) => {
      // 서버-서버 호출/같은 오리진/Native 등 Origin 없을 수 있음
      if (!origin) return cb(null, true);

      if (isProd) {
        // 운영: 운영 도메인만 허용
        const allow = ["https://strongberry.p-e.kr"];
        return allow.includes(origin)
          ? cb(null, true)
          : cb(new Error("CORS blocked (prod): " + origin));
      } else {
        // 개발: 다양한 포트 허용
        const allow = new Set([
          "http://localhost:5173",
          "http://127.0.0.1:5173",
          "http://localhost:3000",
          "http://127.0.0.1:3000",
          "https://strongberry.p-e.kr",
          "https://strongberry.p-e.kr:5173",
        ]);
        return allow.has(origin) ||
          origin.startsWith("http://localhost:") ||
          origin.startsWith("http://127.0.0.1:")
          ? cb(null, true)
          : cb(new Error("CORS blocked (dev): " + origin));
      }
    },
    credentials: true,
  },
});

app.use(express.json());

// 3) REST: 현재 음성 방 참가자 조회
app.get("/api/voice-rooms/:roomId/participants", (req, res) => {
  const { roomId } = req.params;
  const map = voiceRoomParticipants.get(roomId);
  res.json(map ? Array.from(map.values()) : []);
});

// 4) mediasoup 초기화 + 시그널링 등록
(async () => {
  try {
    const { worker, router } = await createMediasoupWorkerAndRouter();
    setupSignaling(io, router);
    console.log("🎯 mediasoup worker/router ready");
  } catch (error) {
    console.error("❌ mediasoup init failed:", error);
    process.exit(1);
  }
})();

// 5) 서버 시작
const PORT = Number(process.env.PORT) || 3001;
server.listen(PORT, () => {
  const hostShown = isProd
    ? "https://strongberry.p-e.kr"
    : `http://localhost:${PORT}`;
  console.log(
    `🎤 signaling server listening at ${hostShown} (mode: ${
      isProd ? "prod" : "dev"
    })`
  );
});
