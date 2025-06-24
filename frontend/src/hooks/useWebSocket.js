import { useRef, useState, useCallback, useEffect } from "react";
import Stomp from "stompjs";
import refreshAxios from "@/lib/axiosInstance"; // refreshAxios 사용

export const useWebSocket = (token, onConnect) => {
  const stompRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [reconnectTrigger, setReconnectTrigger] = useState(0);
  const tokenRef = useRef(token);
  const reconnectAttempt = useRef(0);
  const reconnectTimer = useRef(null);

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
      let authToken = tokenArg || tokenRef.current;
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

      const socket = new WebSocket("ws://localhost:8080/ws-chat");
      const client = Stomp.over(socket);
      client.heartbeat.outgoing = 10000;
      client.heartbeat.incoming = 10000;
      client.debug = () => {};
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
        { Authorization: "Bearer " + authToken },
        () => {
          console.log("✅ WebSocket connected");
          client.send("/app/auth", {}, JSON.stringify({ token: "Bearer " + authToken }));
          setConnected(true);
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
