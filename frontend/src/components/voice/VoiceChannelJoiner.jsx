import * as mediasoupClient from "mediasoup-client";
import { io } from "socket.io-client";

const VoiceChannelJoiner = async ({ channelId }) => {
  const socketURL = import.meta.env.VITE_SOCKET_URL;
  const socket = io(`${socketURL}3001`);

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
