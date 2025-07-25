const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const { createMediasoupWorkerAndRouter } = require("./lib/mediasoup");
const { setupSignaling, voiceRoomParticipants } = require("./handlers/signaling");
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: { origin: "https://strongberry.p-e.kr:5173", credentials: true },
});

app.use(express.json());

app.get("/api/voice-rooms/:roomId/participants", (req, res) => {
  const { roomId } = req.params;
  const participantsMap = voiceRoomParticipants.get(roomId);
  if (!participantsMap) {
    return res.json([]);
  }

  const participants = Array.from(participantsMap.values());
  res.json(participants);
});

(async () => {
  const { worker, router } = await createMediasoupWorkerAndRouter();
  setupSignaling(io, router);
})();

server.listen(3001, () => {
  console.log("🎤 mediasoup signaling 서버 실행 중 → https://strongberry.p-e.kr:3001");
});
