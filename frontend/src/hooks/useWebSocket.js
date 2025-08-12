import { useRef, useState, useCallback, useEffect } from "react";
import Stomp from "stompjs";
import refreshAxios from "@/lib/axiosInstance"; // refreshAxios 사용

export const useWebSocket = (token, onConnect) => {
  console.log("[WS] VITE_WEB_SOCKET_URL=", import.meta.env.VITE_WEB_SOCKET_URL);
  console.log("[WS] init token? ", !!token, token?.slice?.(0, 20));
  const stompRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [reconnectTrigger, setReconnectTrigger] = useState(0);
  const tokenRef = useRef(token);
  const reconnectAttempt = useRef(0);
  const reconnectTimer = useRef(null);

  const webSocketURL = import.meta.env.VITE_WEB_SOCKET_URL;

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  const hardDisconnect = () => {
    if (stompRef.current) {
      try {
        if (stompRef.current.connected) {
          stompRef.current.disconnect(() => {
            console.log("🔌 STOMP disconnected");
          });
        } else if (stompRef.current.ws?.readyState !== WebSocket.CLOSED) {
          console.log("❌ Forcibly closing socket");
          stompRef.current.ws.close();
        }
      } catch (e) {
        console.warn("⚠️ Disconnect error", e);
      }
    }
    stompRef.current = null;
    setConnected(false);
  };

  const attemptRefreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem("refresh_token");
      const res = await refreshAxios.post("/auth/refresh", { refreshToken });
      const newToken = res.data.token;

      if (newToken) {
        localStorage.setItem("token", newToken);
        tokenRef.current = newToken;
        return newToken;
      }
    } catch (err) {
      console.error("❌ Token refresh failed", err);
      localStorage.clear();
      window.location.href = "/login";
    }
    return null;
  };

  const connect = useCallback(
    async (tokenArg, callback) => {
      console.log("[WS] connect() called");
       if (stompRef.current?.connected) {
      console.log("⚠️ 이미 STOMP 연결되어 있음. connect() 중복 호출 무시");
      return;
      }
      
      let authToken = tokenArg || tokenRef.current;
      console.log("[WS] resolved token? ", !!authToken, authToken?.slice?.(0, 20));
      if (!authToken) return;

      // ✅ 기존 stomp 인스턴스 제거 (중복 방지)
      if (stompRef.current) {
        try {
          stompRef.current.disconnect();
        } catch (e) {
          console.warn("⚠️ Disconnect error during cleanup", e);
        }
        stompRef.current = null;
      }

      const socket = new WebSocket(`${webSocketURL}/ws-chat`);
      socket.onopen = () => console.log("[WS] native WebSocket OPEN to", `${webSocketURL}/ws-chat`);
   socket.onerror = (e) => console.log("[WS] native WebSocket onerror", e);
   socket.onclose = (e) => console.log("[WS] native WebSocket onclose", e);
      const client = Stomp.over(socket);

      client.heartbeat.outgoing = 10000;
      client.heartbeat.incoming = 10000;
      client.debug = (msg) => console.log("[STOMP]", msg);
      stompRef.current = client;

      client.onWebSocketError = (e) => {
        console.error("❌ WebSocket Error", e);
        hardDisconnect();
        setReconnectTrigger((prev) => prev + 1);
      };

      client.onWebSocketClose = () => {
        console.warn("🔌 WebSocket Closed");
        hardDisconnect();
        setReconnectTrigger((prev) => prev + 1);
      };

      client.connect(
        { Authorization: `Bearer ${authToken}` },
        () => {
          console.log("✅ STOMP CONNECTED");
          setConnected(true);
          client.send("/app/auth", {}, JSON.stringify({ token: authToken }));
          reconnectAttempt.current = 0;
          reconnectTimer.current = null;
          onConnect?.();
          callback?.();
        },
        async (err) => {
          const msg = err?.headers?.message || "";
          console.warn("❌ STOMP connect error", msg);

          if (msg.includes("Invalid JWT token")) {
            const newToken = await attemptRefreshToken();
            if (newToken) {
              console.log("🔄 Retrying connection with new token");
              connect(newToken);
              return;
            }
          }

          hardDisconnect();
          setReconnectTrigger((prev) => prev + 1);
        }
      );
    },
    [onConnect]
  );

  useEffect(() => {
    if (!tokenRef.current || reconnectTimer.current) return;

    const delay = Math.min(5000 * 2 ** reconnectAttempt.current, 30000);
    console.warn(`🔁 Reconnecting in ${delay / 1000}s`);

    reconnectTimer.current = setTimeout(() => {
      reconnectTimer.current = null;
      reconnectAttempt.current += 1;
      connect(tokenRef.current);
    }, delay);

    return () => {
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
    };
  }, [reconnectTrigger, connect]);

  const disconnect = useCallback(() => {
    hardDisconnect();
    reconnectAttempt.current = 0;
  }, []);

  const subscribe = useCallback(
  (topic, callback, options = {}) => {
    if (!stompRef.current || !stompRef.current.connected) {
      console.warn(`⛔ Cannot subscribe to ${topic} – not connected`);
      return { unsubscribe: () => {} };
    }

    const sub = stompRef.current.subscribe(topic, (msg) => {
      const payload = JSON.parse(msg.body);

      // ✅ DM 채팅방 메시지 도착 시 visible 상태 복구용 갱신
      callback(payload);

      // ✅ 옵션에 따라 DM 목록 자동 리프레시
      if (options.dmMode && typeof options.refreshDmRooms === "function") {
        console.log("🔁 DM 목록 갱신 시도 (메시지 수신)");
        options.refreshDmRooms();
      }
    });

    return {
      unsubscribe: () => {
        try {
          if (stompRef.current?.connected) {
            sub.unsubscribe();
          }
        } catch (e) {
          console.warn("❗ unsubscribe failed", e);
        }
      },
    };
  },
  [connected]
);

  const send = useCallback((destination, body) => {
    const socketReady = stompRef.current?.ws?.readyState === WebSocket.OPEN;
    console.log("📤 메시지 전송 시도", { connected, socketReady });

    if (stompRef.current && connected && socketReady) {
      stompRef.current.send(destination, {}, JSON.stringify(body));
      console.log("📤 메시지 전송 완료", destination);
    } else {
      console.warn("❌ 메시지 전송 실패 – WebSocket 미연결 상태");
    }
  }, [connected]);

  return {
    connected,
    subscribe,
    send,
    connect,
    disconnect,
  };
};
