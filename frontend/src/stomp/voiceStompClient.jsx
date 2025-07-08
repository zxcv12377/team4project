import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

let voiceStompClient = null;
// 현재는 사용되지 않고 있음
export const connectStomp = (onConnectCallback) => {
  const token = localStorage.getItem("token");
  const socket = new SockJS(`http://localhost:8080/ws-voice?token=${token}`);
  voiceStompClient = new Client({
    webSocketFactory: () => socket,
    reconnectDelay: 5000,
    onConnect: () => {
      voiceStompClient.publish({
        destination: "/app/auth",
        body: JSON.stringify({ token: `Bearer ${token}` }),
      });
      console.log("🔗 STOMP Connected");

      if (onConnectCallback) onConnectCallback();
    },
    onStompError: (frame) => {
      console.error("❌ STOMP Error:", frame.headers["message"], frame.body);
    },
  });

  voiceStompClient.onWebSocketError = (error) => {
    console.error("❌ WebSocket Error:", error);
  };

  voiceStompClient.activate();
};

export const subscribe = (destination, callback) => {
  if (!voiceStompClient) return;
  return voiceStompClient.subscribe(destination, (msg) => {
    const data = JSON.parse(msg.body);
    callback(data);
  });
};

export const sendSpeakingStatus = (memberId, channelId, speaking) => {
  if (!voiceStompClient || !voiceStompClient.connected) return;

  const message = {
    memberId,
    channelId,
    speaking,
  };

  voiceStompClient.publish({
    destination: "/api/voice/speaking",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(message),
  });
};

export const sendSignaling = (type, roomId, payload) => {
  if (!voiceStompClient?.connected) return;

  voiceStompClient.publish({
    destination: `/api/voice/${type}/${roomId}`,
    body: JSON.stringify(payload),
  });
};

export const disconnectStomp = async () => {
  if (voiceStompClient) {
    await voiceStompClient.deactivate();
    voiceStompClient = null;
  }
};
