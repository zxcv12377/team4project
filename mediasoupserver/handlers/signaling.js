const {
  addUserToRoom,
  removeUserFromRoom,
  findUserRoom,
  getRoomUsers,
} = require("../lib/rooms");
const { createWebRtcTransport } = require("../lib/transports");

// 상태 저장용 맵들
const voiceRooms = new Map(); // roomId -> Set<socketId>
const voiceRoomParticipants = new Map(); // roomId -> Map<socketId, memberInfo>
const peers = new Map(); // socketId -> { socket }
const transports = new Map(); // socketId -> sendTransport
const producers = new Map(); // socketId -> Map<producerId, producer>
const consumers = new Map(); // socketId -> Map<consumerId, consumer>
const consumerTransports = new Map(); // socketId -> recvTransport
const speakingState = new Map(); // roomId -> Map<memberId, { memberId, speaking }>

// 사용자가 방을 나갈 시 호출 (인원 카운트시에도 필요)
function cleanupSocket(socketId) {
  // 모든 consumers 종료
  const cmap = consumers.get(socketId);
  if (cmap) {
    for (const c of cmap.values()) {
      try {
        c.close();
      } catch {}
    }
    consumers.delete(socketId);
  }

  // 수신용 recvTransport 종료
  const recvT = consumerTransports.get(socketId);
  if (recvT) {
    try {
      recvT.close();
    } catch {}
    consumerTransports.delete(socketId);
  }

  // 모든 producers 종료
  const pmap = producers.get(socketId);
  if (pmap) {
    for (const p of pmap.values()) {
      try {
        p.close();
      } catch {}
    }
    producers.delete(socketId);
  }

  // 송신용 sendTransport 종료
  const sendT = transports.get(socketId);
  if (sendT) {
    try {
      sendT.close();
    } catch {}
    transports.delete(socketId);
  }
}

function leaveVoiceRoom(io, socket) {
  for (const [roomId, userMap] of voiceRoomParticipants.entries()) {
    if (!userMap.has(socket.id)) continue;

    // 참가자 제거
    const member = userMap.get(socket.id);
    userMap.delete(socket.id);
    if (userMap.size === 0) {
      voiceRoomParticipants.delete(roomId);
    }

    // voiceRooms 소켓 집합에서 제거
    const socketSet = voiceRooms.get(roomId);
    if (socketSet) {
      socketSet.delete(socket.id);
      if (socketSet.size === 0) {
        voiceRooms.delete(roomId);
      }
    }

    // speaking 상태 제거
    const s = speakingState.get(roomId);
    if (s && member?.memberId) {
      s.delete(member.memberId);
      if (s.size === 0) speakingState.delete(roomId);
    }

    // ✅ 리소스 정리 (공통)
    cleanupSocket(socket.id);

    // 유저 수/참가자 목록 브로드캐스트
    const size = socketSet?.size || 0;
    io.to(roomId).emit("userCount", size);

    const remaining = Array.from(userMap.values()).map((m) => ({
      memberId: m.memberId,
      name: m.name,
      profile: m.profile,
    }));
    io.to(roomId).emit("voiceRoomParticipants", remaining);

    console.log(`❌ ${socket.id} left voice room: ${roomId} (size: ${size})`);
  }
}

function setupSignaling(io, router) {
  io.on("connection", (socket) => {
    peers.set(socket.id, { socket });

    // 말하기 상태 전송 (후에 말할때마다 포인트를 주는 기능을 할 때 사용)
    socket.on("speaking", ({ roomId, memberId, speaking }) => {
      if (!roomId || !memberId) return;

      const current = speakingState.get(roomId) || new Map();
      current.set(memberId, { memberId, speaking });
      speakingState.set(roomId, current);

      io.to(roomId).emit("speaking-users", Array.from(current.values()));
    });

    console.log(`✅ 클라이언트 연결됨 : ${socket.id}`);

    // 방 참여
    socket.on("joinRoom", ({ roomId, member }, callback) => {
      console.log(`🔔 Room Joined: ${roomId} by ${socket.id}`);

      // ✅ 이미 같은 소켓이 같은 방에 들어와 있으면 무시
      if (!voiceRooms.has(roomId)) voiceRooms.set(roomId, new Set());
      const socketSet = voiceRooms.get(roomId);
      if (socketSet.has(socket.id)) {
        console.warn(
          `⚠️ duplicate joinRoom ignored: room=${roomId}, socket=${socket.id}`
        );
        return typeof callback === "function" ? callback() : undefined;
      }

      socket.join(roomId);

      // 방에 유저 등록
      if (!voiceRooms.has(roomId)) {
        voiceRooms.set(roomId, new Set());
      }
      voiceRooms.get(roomId).add(socket.id);

      // 유저 정보 따로 저장
      if (!voiceRoomParticipants.has(roomId)) {
        voiceRoomParticipants.set(roomId, new Map());
      }
      voiceRoomParticipants.get(roomId).set(socket.id, member); // member = { memberId, name, profile }

      // 기존 producer 정보를 사용자에게 전달
      console.log("� 현재 producers 목록:");
      for (const [peerId, producerMap] of producers.entries()) {
        if (peerId === socket.id) continue;
        for (const [producerId] of producerMap.entries()) {
          console.log(`→ producerId: ${producerId}, peerId: ${peerId}`);
          socket.emit("newProducer", {
            producerId,
            socketId: peerId,
          });
        }
      }
      // 참여자 목록을 배열로 만들어서 브로드캐스트
      // const participants = Array.from(
      //   voiceRoomParticipants
      //     .get(roomId)
      //     .values()
      //     .map((m) => ({
      //       memberId: m.memberId,
      //       name: m.name,
      //       profile: m.profile,
      //     }))
      // );
      const participants = Array.from(
        voiceRoomParticipants.get(roomId).values()
      ).map((m) => ({
        memberId: m.memberId,
        name: m.name,
        profile: m.profile,
      }));
      io.to(roomId).emit("voiceRoomParticipants", participants);

      // 유저 수 갱신 브로드캐스트
      io.to(roomId).emit("userCount", participants.length);

      const size = participants.length;

      console.log(
        `🎧 ${socket.id} joined voice room: ${roomId} (size: ${size})`
      );
      if (typeof callback === "function") {
        console.log("✅ joinRoom callback 호출됨");
        callback();
      }
    });

    // 라우터 RTP capabilities 전송
    socket.on("getRtpCapabilities", (dummy, callback) => {
      console.log("🎧 getRtpCapabilities 요청 들어옴");
      callback(router.rtpCapabilities);
    });

    // 송신용 트랜스포트 생성
    socket.on("createTransport", async (callback) => {
      try {
        const transport = await createWebRtcTransport(router);
        transports.set(socket.id, transport);
        callback({
          id: transport.id,
          iceParameters: transport.iceParameters,
          iceCandidates: transport.iceCandidates,
          dtlsParameters: transport.dtlsParameters,
        });
      } catch (error) {
        console.error("❌ createTransport 실패:", error);
        callback?.({ error: error.message });
      }
    });

    // 송신용 트랜스 포트 연결 요청
    socket.on("connectTransport", async ({ dtlsParameters }, callback) => {
      try {
        const transport = transports.get(socket.id);
        if (!transport)
          return callback?.({ error: "send transport not found" });
        await transport.connect({ dtlsParameters });
        callback?.("ok");
      } catch (error) {
        console.error("❌ connectTransport 실패:", error);
        callback?.({ error: error.message });
      }
    });
    // 오디오 트랙 produce 요청
    socket.on("produce", async ({ kind, rtpParameters }, callback) => {
      console.log("🎤 서버에 produce 요청 도착");
      const transport = transports.get(socket.id);
      if (!transport) {
        console.warn(`[produce] ❌ 전송용 transport 없음: ${socket.id}`);
        console.log(
          "현재 transports 맵 상태:",
          Array.from(transports.entries())
        );
        return callback?.({ error: "send transport not found" });
      }
      try {
        const producer = await transport.produce({ kind, rtpParameters });
        if (!producers.has(socket.id)) {
          producers.set(socket.id, new Map());
        }
        producers.get(socket.id).set(producer.id, producer);

        console.log(`🎤 오디오 트랙 등록됨 - Producer ID: ${producer.id}`);
        callback({ id: producer.id });

        // 본인 제외 처리 + 다른 peer에게 이 producer 정보 전달
        // 두번 사용하는 이유는 새로운 유저가 들어올 때마다 새로 추가 해줘야 하기 때문
        for (const [peerId, peer] of peers.entries()) {
          if (peerId !== socket.id) {
            // 나 빼고 다른 사람에게 알려줌
            peer.socket.emit("newProducer", {
              producerId: producer.id,
              socketId: socket.id,
            });
          }
        }
        // 실시간 환경에서는 비동기 순서가 꼬이는 경우도 있어 그것을 방지하기 위해 joinroom 과 같은
        // 코드를 만들어 놓음
        for (const [peerId, producerMap] of producers.entries()) {
          if (peerId === socket.id) continue;
          // 나한테 다른 사람들의 기존 producer 알려줌
          for (const [existingProducerId] of producerMap.entries()) {
            socket.emit("newProducer", {
              producerId: existingProducerId,
              socketId: peerId,
            });
          }
        }

        producer.on("transportclose", () => {
          // producers.delete(socket.id);
          producers.get(socket.id)?.delete(producer.id);
          console.log(`❌ Producer 연결 종료됨: ${producer.id}`);
        });
      } catch (error) {
        console.error("❌ Producer 생성 실패:", error);
        callback({ error: error.message });
      }
    });
    // 수신용 transport 생성
    socket.on("createRecvTransport", async (callback) => {
      try {
        const recvTransport = await createWebRtcTransport(router);
        consumerTransports.set(socket.id, recvTransport);
        callback({
          id: recvTransport.id,
          iceParameters: recvTransport.iceParameters,
          iceCandidates: recvTransport.iceCandidates,
          dtlsParameters: recvTransport.dtlsParameters,
        });
      } catch (error) {
        console.error("❌ Transport 생성 실패", error);
        callback?.({ error: error.message });
      }
    });
    // 수신용 transport 연결
    socket.on(
      "connectRecvTransport",
      async ({ dtlsParameters, transportId }, callback) => {
        try {
          const transport = [...consumerTransports.values()].find(
            (t) => t.id === transportId
          );
          if (!transport)
            return callback?.({ error: "recv transport not found" });

          await transport.connect({ dtlsParameters });
          callback?.("ok");
        } catch (error) {
          console.error("❌ transport.connect 에러:", error.message);
          callback?.({ error: error.message });
        }
      }
    );
    // consumer 생성 요청
    socket.on(
      "consume",
      async ({ rtpCapabilities, producerSocketId, producerId }, callback) => {
        const consumerTransport = consumerTransports.get(socket.id);
        const producerMap = producers.get(producerSocketId);
        const producer = producerMap?.get(producerId);

        if (!producerMap) {
          console.warn(
            `[consume] ❌ producerMap 없음: socketId=${producerSocketId}`
          );
          return callback({ error: "❌ producerMap not found" });
        }
        if (!consumerTransport || !producer) {
          return callback({
            error: "❌ consumer transport or producer not found",
          });
        }
        if (!consumerTransport)
          return callback({ error: "❌ Transport를 찾을 수 없음" });

        let roomId = null;

        for (const [rid, socketMap] of voiceRoomParticipants.entries()) {
          if (socketMap.has(socket.id)) {
            roomId = rid;
            break;
          }
        }
        if (!roomId) return callback({ error: "❌ Room을 찾을 수 없음" });

        if (!roomId || !consumerTransport)
          return callback({ error: "❌ Room을 찾을 수 없음" });

        if (!router.canConsume({ producerId: producer.id, rtpCapabilities })) {
          console.warn("❌ consume 불가한 producer: ", producer.id);
          return callback({ error: "cannot consume" });
        }

        const consumer = await consumerTransport.consume({
          producerId: producer.id,
          rtpCapabilities,
          paused: false,
        });

        if (!consumers.has(socket.id)) consumers.set(socket.id, new Map());
        consumers.get(socket.id).set(consumer.id, consumer);
        // consumers.set(socket.id, consumer);

        callback({
          id: consumer.id,
          kind: consumer.kind,
          rtpParameters: consumer.rtpParameters,
          producerId: producer.id,
        });
      }
    );

    // 방 나가기
    socket.on("leaveRoom", (roomId) => {
      console.log(roomId + "번 방을 떠남");
      leaveVoiceRoom(io, socket);
    });

    // 연결 종료 처리
    socket.on("disconnect", () => {
      console.log("❌ 소켓 연결 종료됨");
      // 방/브로드캐스트 + 리소스 정리까지 내부에서 처리
      leaveVoiceRoom(io, socket);

      // 마지막으로 peer만 정리
      peers.delete(socket.id);

      console.log(`🚫 클라이언트 연결 해제됨: ${socket.id}`);
    });
  });
  process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
    // 서버 죽이지 않고 로깅만
    // 새로고침 시 서버가 죽는 현상 때문에 작성한 코드
  });
}

module.exports = { setupSignaling, voiceRoomParticipants };
