import { useEffect, useState } from "react";
import axios from "@/lib/axiosInstance";
// import { useWebSocket } from "../../hooks/useWebSocket";

export default function ChatRoom({ roomId, token, connect, connected, subscribe, send }) {
  const [messageMap, setMessageMap] = useState({});
  const [input, setInput] = useState("");
  const messages = messageMap[roomId] || [];

  // const {  } = useWebSocket(token, () => {
  //   send("/app/auth", { token: "Bearer " + token });
  // });

  useEffect(() => {
    if (connect && token) {
      console.log("✅ WebSocket 연결 후 /app/auth 인증 메시지 전송");
      send("/app/auth", { token: "Bearer " + token });
    }
  }, [connected, token]);

  // 메시지 로딩
  useEffect(() => {
    if (!roomId || messageMap[roomId]) return;

    axios
      .get(`/chat/${roomId}`)
      .then((res) => {
        setMessageMap((prev) => ({
          ...prev,
          [roomId]: res.data || [],
        }));
      })
      .catch(() => {
        setMessageMap((prev) => ({
          ...prev,
          [roomId]: [],
        }));
      });
  }, [roomId]);

  // 구독
  useEffect(() => {
    if (!roomId || !connected) return;
    console.log("🟢 Subscribing to", `/topic/chatroom.${roomId} + ${connected}`);
    const sub = subscribe(`/topic/chatroom.${roomId}`, (payload) => {
      let parsed;
      try {
        parsed = typeof payload === "string" ? JSON.parse(payload) : payload;
      } catch (err) {
        console.log("메세지 파싱 실패 {}", err);
        return;
      }
      console.log("✅ 수신된 메시지:", parsed);
      setMessageMap((prev) => ({
        ...prev,
        [roomId]: [...(prev[roomId] || []), parsed],
      }));
    });
    return () => {
      sub?.unsubscribe?.();
    };
  }, [roomId, connected]);

  function sendMessage() {
    if (!input.trim()) return;
    if (!connected) {
      console.warn("❌ WebSocket not connected. 메시지 전송 실패");
      return;
    }

    send(`/app/chat.send/${roomId}`, {
      message: input,
    });
    setInput("");
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-2 bg-white">
        {messages.map((msg, i) => (
          <div key={`${msg.message}-${i}`}>
            {msg?.sender && <span className="font-bold">{msg.sender}:</span>} {msg?.message}
          </div>
        ))}
      </div>
      <div className="flex gap-2 p-2 bg-zinc-900 border-t border-zinc-700">
        <input
          className="flex-1 bg-zinc-800 rounded p-2 text-white"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="메시지 입력"
        />
        <button className="bg-blue-600 text-white rounded px-4" onClick={sendMessage}>
          전송
        </button>
      </div>
    </div>
  );
}
