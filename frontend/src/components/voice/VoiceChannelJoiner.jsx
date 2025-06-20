import * as mediasoupClient from "mediasoup-client";
import { io } from "socket.io-client";

const VoiceChannelJoiner = async ({ channelId }) => {
  const socket = io("http://localhost:3001");

  try {
    // 1. 채널 입장
    socket.emit("joinRoom", channelId);

    // 2. 마이크 스트림 획득
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioTrack = stream.getAudioTracks()[0];

    socket.emit("getRtpCapabilities", null, async (rtpCapabilities) => {
      const device = new mediasoupClient.Device();
      await device.load({ routerRtpCapabilities: rtpCapabilities });

      // 4. 서버에 WebRTC transport 생성 요청
      socket.emit("createTransport", async (params) => {
        const sendTransport = device.createSendTransport(params);

        sendTransport.on("connect", ({ dtlsParameters }, callback) => {
          socket.emit("connectTransport", { dtlsParameters });
          callback();
        });

        sendTransport.on("produce", ({ kind, rtpParameters }, callback) => {
          socket.emit("produce", { kind, rtpParameters }, ({ id }) => callback({ id }));
        });

        await sendTransport.produce({ track: audioTrack });

        console.log("음성 채팅 연결 완료");
        return { socket, stream, device };
      });
    });
  } catch (err) {
    console.log("음성 채팅 오류", err);
    throw err;
  }
};
export default VoiceChannelJoiner;

// import * as StompJs from "@stomp/stompjs";
// import { useEffect, useRef, useState } from "react";

// function VoiceChannelJoiner({ channelId, userId }) {
//   const audioContextRef = useRef(null);
//   const analyserRef = useRef(null);
//   const stompClientRef = useRef(null);

//   // 🔌 STOMP 연결
//   useEffect(() => {
//     const client = new StompJs.Client({
//       brokerURL: "ws://localhost:8080/ws", // Spring Boot STOMP WebSocket endpoint
//       reconnectDelay: 5000,
//       onConnect: () => {
//         console.log("✅ STOMP 연결됨");

//         client.subscribe(`/topic/room/${channelId}`, (message) => {
//           const body = JSON.parse(message.body);
//           console.log("채팅 메시지 수신:", body);
//         });

//         client.publish({
//           destination: `/app/room/${channelId}/enter`,
//           body: JSON.stringify({ userId }),
//         });
//       },
//     });

//     client.activate();
//     stompClientRef.current = client;

//     return () => {
//       client.deactivate();
//     };
//   }, [channelId, userId]);

//   // 🎙️ 마이크 연결
//   useEffect(() => {
//     const initMic = async () => {
//       try {
//         const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//         const audioContext = new (window.AudioContext || window.webkitAudioContext)();
//         const source = audioContext.createMediaStreamSource(stream);
//         const analyser = audioContext.createAnalyser();

//         source.connect(analyser);
//         analyser.fftSize = 256;
//         const dataArray = new Uint8Array(analyser.frequencyBinCount);

//         audioContextRef.current = audioContext;
//         analyserRef.current = analyser;
//       } catch (err) {
//         console.error("마이크 접근 실패:", err);
//       }
//     };

//     initMic();

//     return () => {
//       if (audioContextRef.current) {
//         audioContextRef.current.close();
//       }
//     };
//   }, []);
// }

// export default VoiceChannelJoiner;
