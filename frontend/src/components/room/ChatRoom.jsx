import { useEffect, useRef, useState } from "react";
import axiosInstance from '@/lib/axiosInstance';

export default function ChatRoom({ roomId, currentUser, subscribe, send ,connected }) {
  const [messageMap, setMessageMap] = useState({});
  const [input, setInput] = useState("");
  const messages = messageMap[roomId] || [];
  const [authenticated, setAuthenticated] = useState(false);
  const scrollRef = useRef(null);
  const subRef = useRef(null); // ✅ 구독 추적

  // 1. 연결 + 인증
  useEffect(() => {
  if (connected && currentUser?.token) {
    console.log("✅ ChatRoom 인증 메시지 전송");
    send("/app/auth", { token: "Bearer " + currentUser.token });
    setAuthenticated(true);
  }
  }, [connected, currentUser?.token]);
  
  useEffect(() => {
  console.log("💡 useEffect 조건 체크", { roomId, connected, subscribe });
}, [roomId, connected, subscribe]);

// ✅ 3. 실시간 구독
useEffect(() => {
  if (!roomId || !connected || !subscribe) return;

  console.log("🟢 실시간 채팅 구독 시작:", `/topic/chatroom.${roomId}`);
  subRef.current = subscribe(`/topic/chatroom.${roomId}`, payload => {
    console.log("📥 메시지 수신:", payload);
    setMessageMap(prev => ({
      ...prev,
      [roomId]: [...(prev[roomId] || []), payload]
    }));
  });

  return () => {
    subRef.current?.unsubscribe?.();
    console.log("🔴 채팅 구독 해제됨:", `/topic/chatroom.${roomId}`);
  };
}, [roomId, connected]);
  
  // 2. 메시지 가져오기
  useEffect(() => {
    if (!roomId) return;
    if (messageMap[roomId]) return;

    axiosInstance.get(`/chat/${roomId}`)
      .then(res => {
        setMessageMap(prev => ({
          ...prev,
          [roomId]: res.data || []
        }));
      })
      .catch(() => {
        setMessageMap(prev => ({
          ...prev,
          [roomId]: []
        }));
      });
  }, [roomId]);


  // 4. 스크롤 자동 이동
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // 메시지 전송
  function sendMessage() {
    if (!input.trim()) return;
    send(`/app/chat.send/${roomId}`, {
      message: input,
    });
    setInput("");
  }

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      {/* 채팅 메시지 목록 */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 bg-[#313338] text-white min-h-0"
        style={{ height: 0 }}
      >
        {messages.map((msg, i) => (
          <div key={i} className="mb-2">
            {msg.sender && <span className="font-bold text-blue-400">{msg.sender}:</span>}{" "}
            <span className="text-gray-200">{msg.message}</span>
          </div>
        ))}
      </div>

      {/* 입력창 */}
      <div className="flex-shrink-0 flex gap-2 p-4 bg-[#2b2d31] border-t border-[#1e1f22]">
        <input
          className="flex-1 bg-[#383a40] rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="메시지 입력..."
        />
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-2 font-medium transition-colors"
          onClick={sendMessage}
        >
          전송
        </button>
      </div>
    </div>
  );
}
