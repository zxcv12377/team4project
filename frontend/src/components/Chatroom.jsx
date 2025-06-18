// src/components/chatroom.jsx
import React, { useState, useEffect, useRef, useContext } from "react";
import { UserContext } from "@/layouts/Layout"; // layouts/Layout에서 UserContext 임포트

function ChatRoom({ roomId, token }) {
  // currentUser는 context에서 직접 가져오도록 변경
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messageAreaRef = useRef(null); // Ref for scrolling
  const { name: currentUserName } = useContext(UserContext); // UserContext에서 사용자 이름 가져오기

  // Simulate loading messages for a given room
  useEffect(() => {
    const dummyMessages = [
      { id: 1, user: { name: "UserA" }, text: "안녕하세요! 이 채널은 채팅방입니다.", timestamp: "오후 3:00" },
      { id: 2, user: { name: "UserB" }, text: "환영합니다! 궁금한 점이 있으면 물어보세요.", timestamp: "오후 3:05" },
      { id: 3, user: { name: "UserA" }, text: `현재 roomId는 ${roomId}입니다.`, timestamp: "오후 3:10" },
    ];
    setMessages(dummyMessages);
  }, [roomId]);

  useEffect(() => {
    if (messageAreaRef.current) {
      messageAreaRef.current.scrollTop = messageAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const now = new Date();
      const timeString = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const newMsg = {
        id: messages.length + 1,
        user: { name: currentUserName || "익명" }, // context에서 가져온 이름 사용
        text: newMessage,
        timestamp: timeString,
      };
      setMessages((prev) => [...prev, newMsg]);
      setNewMessage("");
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#313338] rounded-r-lg">
      <div className="channel-header bg-[#36393f] p-4 border-b border-[#2f3136]">
        <h2 className="text-white text-xl font-semibold">{`# ${roomId === null ? "채널 선택 안됨" : `채팅방 ${roomId}`}`}</h2>
      </div>
      <div
        ref={messageAreaRef}
        className="message-area flex-1 p-6 overflow-y-auto flex flex-col gap-4 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-800"
      >
        {messages.map((msg) => (
          <div key={msg.id} className="message bg-[#2f3136] p-4 rounded-lg shadow-sm">
            <div className="flex items-baseline mb-1">
              <span className="username text-blue-400 font-bold mr-2">{msg.user.name}</span>
              <span className="timestamp text-zinc-400 text-xs">{msg.timestamp}</span>
            </div>
            <p className="text-zinc-200 text-base leading-relaxed">{msg.text}</p>
          </div>
        ))}
      </div>
      <div className="message-input-container p-4 bg-[#36393f] border-t border-[#2f3136] flex gap-3 items-center">
        <input
          type="text"
          id="message-input"
          className="flex-1 p-3 rounded-lg bg-[#40444b] text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder={`Message #${roomId || "channel"}`}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") handleSendMessage();
          }}
          disabled={roomId === null} // Disable if no room selected
        />
        <button
          id="send-button"
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 py-3 font-semibold shadow-md transition-all duration-200 active:scale-98"
          onClick={handleSendMessage}
          disabled={roomId === null || !newMessage.trim()} // Disable if no room or empty message
        >
          전송
        </button>
      </div>
    </div>
  );
}

export default ChatRoom;
