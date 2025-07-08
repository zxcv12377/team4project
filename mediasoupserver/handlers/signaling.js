const { addUserToRoom, removeUserFromRoom, findUserRoom, getRoomUsers } = require("../lib/rooms");
const { createWebRtcTransport } = require("../lib/transports");

// 상태 저장용 맵들
const voiceRooms = new Map(); // roomId -> Set<socketId>
const voiceRoomParticipants = new Map(); // roomId -> Map<socketId, memberInfo>
const peers = new Map(); // socketId -> { socket }
const transports = new Map(); // socketId -> sendTransport
const producers = new Map(); // socketId -> Map<producerId, producer>
const consumers = new Map(); // socketId -> consumer
const consumerTransports = new Map(); // socketId -> recvTransport
const speakingState = new Map(); // roomId -> Map<memberId, { memberId, speaking }>

// 사용자가 방을 나갈 시 호출 (인원 카운트시에도 필요)
function leaveVoiceRoom(io, socket) {
  for (const [roomId, userMap] of voiceRoomParticipants.entries()) {
    if (userMap.has(socket.id)) {
      userMap.delete(socket.id);
      if (userMap.size === 0) {
        voiceRoomParticipants.delete(roomId);
      }

      // ✅ voiceRooms도 정리해줘야 userCount가 정확함
      const socketSet = voiceRooms.get(roomId);
      if (socketSet) {
        socketSet.delete(socket.id);
        if (socketSet.size === 0) {
          voiceRooms.delete(roomId);
        }
      }
      // ✅ producer 제거
      if (producers.has(socket.id)) {
        for (const producer of producers.get(socket.id).values()) {
          producer.close();
        }
        producers.delete(socket.id);
      }
      // ✅ 유저 수 갱신 (voiceRooms 기준)
      const size = socketSet?.size || 0;
      io.to(roomId).emit("userCount", size);

      console.log(`❌ ${socket.id} left voice room: ${roomId} (size: ${size})`);
    }
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

      // 유저 수 갱신 브로드캐스트
      const size = voiceRooms.get(roomId).size;
      io.to(roomId).emit("userCount", size);

      console.log(`🎧 ${socket.id} joined voice room: ${roomId} (size: ${size})`);
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
        console.error("❌ Transport 생성 실패", err);
      }
    });

    // 송신용 트랜스 포트 연결 요청
    socket.on("connectTransport", async ({ dtlsParameters }, callback) => {
      const transport = transports.get(socket.id);
      if (transport) await transport.connect({ dtlsParameters });
      if (typeof callback === "function") {
        callback("ok");
      } else {
        console.warn("⚠️ connectTransport: callback is not a function");
      }
    });
    // 오디오 트랙 produce 요청
    socket.on("produce", async ({ kind, rtpParameters }, callback) => {
      console.log("🎤 서버에 produce 요청 도착");
      const transport = transports.get(socket.id);
      if (!transport) {
        console.warn(`[produce] ❌ 전송용 transport 없음: ${socket.id}`);
        console.log("현재 transports 맵 상태:", Array.from(transports.entries()));
        return;
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
          console.log("★★★★★★★ 새 유저 도착 시 한번 더 실행");
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
        console.error("❌ Producer 생성 실패:", err);
        callback({ error: err.message });
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
        console.error("❌ Transport 생성 실패", err);
      }
    });
    // 수신용 transport 연결
    socket.on("connectRecvTransport", async ({ dtlsParameters, transportId }) => {
      // const transport = transports.find((t) => t.id === transportId);
      const transport = [...consumerTransports.values()].find((t) => t.id === transportId);
      try {
        if (transport) {
          await transport.connect({ dtlsParameters });
          socket.emit("connectRecvTransportDone", "ok"); // ✅ 클라이언트에게 완료 신호
        } else {
          socket.emit("connectRecvTransportDone", "fail");
        }
      } catch (err) {
        console.error("❌ transport.connect 에러:", err.message);
        callback({ error: err.message });
        return;
      }
    });
    // consumer 생성 요청
    socket.on("consume", async ({ rtpCapabilities, producerSocketId, producerId }, callback) => {
      const consumerTransport = consumerTransports.get(socket.id);
      const producerMap = producers.get(producerSocketId);
      const producer = producerMap?.get(producerId);

      if (!producerMap) {
        console.warn(`[consume] ❌ producerMap 없음: socketId=${producerSocketId}`);
        return callback({ error: "❌ producerMap not found" });
      }
      if (!consumerTransport || !producer) {
        return callback({ error: "❌ consumer transport or producer not found" });
      }
      if (!consumerTransport) return callback({ error: "❌ Transport를 찾을 수 없음" });

      let roomId = null;

      for (const [rid, socketMap] of voiceRoomParticipants.entries()) {
        if (socketMap.has(socket.id)) {
          roomId = rid;
          break;
        }
      }
      if (!roomId) return callback({ error: "❌ Room을 찾을 수 없음" });

      if (!roomId || !consumerTransport) return callback({ error: "❌ Room을 찾을 수 없음" });

      if (!router.canConsume({ producerId: producer.id, rtpCapabilities })) {
        console.warn("❌ consume 불가한 producer: ", producer.id);
        return callback({ error: "cannot consume" });
      }

      const consumer = await consumerTransport.consume({ producerId: producer.id, rtpCapabilities, paused: false });

      consumers.set(socket.id, consumer);

      callback({
        id: consumer.id,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
        producerId: producer.id,
      });
    });

    // 방 나가기
    socket.on("leaveRoom", (roomId) => {
      console.log(roomId + "번 방을 떠남");
      leaveVoiceRoom(io, socket);
    });

    process.on("uncaughtException", (err) => {
      console.error("Uncaught Exception:", err);
      // 서버 죽이지 않고 로깅만
      // 새로고침 시 서버가 죽는 현상 때문에 작성한 코드
    });

    // 연결 종료 처리
    socket.on("disconnect", () => {
      console.log("❌ 소켓 연결 종료됨");
      leaveVoiceRoom(io, socket);
      const consumer = consumers.get(socket.id);
      const producerMap = producers.get(socket.id);
      const transport = transports.get(socket.id);
      // const producer = producers.get(socket.id);
      if (producerMap) {
        for (const producer of producerMap.values()) {
          producer.close();
        }
        producers.delete(socket.id);
      }

      // if (producer) producer.close();
      if (transport) {
        transport.close();
        console.warn("transport 닫음 : ", socket.id);
      }
      if (consumer) consumer.close();

      peers.delete(socket.id);
      transports.delete(socket.id);
      consumerTransports.delete(socket.id);
      // producers.delete(socket.id);
      consumers.delete(socket.id);
      console.log(`🚫 클라이언트 연결 해제됨: ${socket.id}`);
    });
  });
}

module.exports = { setupSignaling, voiceRoomParticipants };
