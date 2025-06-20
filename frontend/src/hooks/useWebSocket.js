// ✅ src/hooks/useWebSocket.js
import { useRef, useState, useCallback, useEffect } from "react";
import Stomp from "stompjs";

export const useWebSocket = (token, onConnect) => {
  const stompRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const connectedOnce = useRef(false);
  const tokenRef = useRef(token);

  useEffect(() => {
    tokenRef.current = token; // ✅ 항상 최신 토큰 유지
  }, [token]);

  const connect = useCallback(
    (tokenArg, callback) => {
      const authToken = tokenArg || token;
      if (!authToken) return;

      if (stompRef.current && stompRef.current.connected) {
        console.log("⚠️ WebSocket already connected");
        return;
      }

      if (connectedOnce.current) {
        console.log("⚠️ connect() already called once – skipping");
        return;
      }

      connectedOnce.current = true;

      const socket = new WebSocket("ws://localhost:8080/ws-chat");
      const client = Stomp.over(socket);
      client.debug = () => {};

      client.connect(
        { Authorization: "Bearer " + authToken },
        () => {
          stompRef.current = client;
          setConnected(true);
          console.log("✅ WebSocket connected");
          onConnect?.();
          callback?.();
        },
        (err) => {
          console.error("❌ 백그라운드 사용으로 연결 끊김", err);
          setConnected(false);
          connectedOnce.current = false;
        }
      );
    },
    [onConnect]
  );

  useEffect(() => {
    if (!connected && tokenRef.current) {
      const timeout = setTimeout(() => {
        console.warn("WebSocket 재연결 시도");
        connect(tokenRef.current);
      }, 3000); // 3초마다 재연결 시도

      return () => clearTimeout(timeout);
    }
  }, [connected, connect]);

  const disconnect = useCallback(() => {
    if (stompRef.current && stompRef.current.connected) {
      stompRef.current.disconnect(() => {
        console.log("🔌 WebSocket 연결 종료 됨");
        setConnected(false);
        stompRef.current = null;
        connectedOnce.current = false;
      });
    }
  }, []);

  const subscribe = useCallback(
    (topic, callback) => {
      if (!stompRef.current || !connected) {
        console.warn(`⛔ Cannot subscribe to ${topic} – not connected`);
        return { unsubscribe: () => {} };
      }

      const sub = stompRef.current.subscribe(topic, (msg) => {
        callback(JSON.parse(msg.body));
      });

      return {
        unsubscribe: () => {
          try {
            sub.unsubscribe();
          } catch (e) {
            console.warn("❗ unsubscribe failed", e);
          }
        },
      };
    },
    [connected]
  );

  const send = useCallback(
    (destination, body) => {
      if (stompRef.current && connected) {
        stompRef.current.send(destination, {}, JSON.stringify(body));
      } else {
        console.warn("❌ Cannot send message – not connected");
      }
    },
    [connected]
  );

  return {
    connected,
    subscribe,
    send,
    connect,
    disconnect,
  };
};
