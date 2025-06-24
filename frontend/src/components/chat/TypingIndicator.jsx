import { useEffect } from "react";
import { useRealtime } from "../../context/RealtimeContext";
import { useWebSocket } from "../../hooks/useWebSocket";

export default function TypingIndicator({ roomId }) {
  const { state, dispatch } = useRealtime();
  const { subscribe } = useWebSocket();

  useEffect(() => {
    // 타이핑 상태 구독
    const subscription = subscribe(`/topic/chat.${roomId}.typing`, (message) => {
      dispatch({
        type: "TYPING_STATUS",
        payload: {
          username: message.sender,
          isTyping: message.isTyping,
        },
      });
    });

    return () => subscription?.unsubscribe();
  }, [subscribe, roomId]);

  const typingUsers = Array.from(state.typingUsers.entries())
    .filter(([_, isTyping]) => isTyping)
    .map(([username]) => username);

  if (typingUsers.length === 0) return null;

  return (
    <div className="text-sm text-gray-500 italic">
      {typingUsers.length === 1 ? `${typingUsers[0]}님이 입력 중...` : `${typingUsers.length}명이 입력 중...`}
    </div>
  );
}
