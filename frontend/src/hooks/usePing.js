import { useEffect } from "react";
import { useSocket } from "@/context/WebSocketContext";

export function usePing() {
  const { send, connected } = useSocket();

  useEffect(() => {
    if (!connected) return;

    const interval = setInterval(() => {
      send("/app/ping", { timestamp: Date.now() });
      console.log("📡 Sent ping");
    }, 20_000); // 20초마다 ping

    return () => {
      clearInterval(interval);
      console.log("🛑 Ping interval cleared");
    };
  }, [connected, send]);
}
