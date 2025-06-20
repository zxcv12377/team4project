import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useUserContext } from "./../../context/UserContext";
import useMultiPeerConnection from "../../hooks/useMultiPeerConnection";
import useVoiceChannelSpeaking from "@/hooks/useVoiceChannelSpeaking";
import { useEffect } from "react";

let stompClient = null;

export default function VoiceChatRoom({ room }) {
  const { user } = useUserContext();
  const { startConnection, stopConnection } = useMultiPeerConnection();
  const { speakingUsers, connectSpeakingSocket, disconnectSpeakingSocket } = useVoiceChannelSpeaking();

  useEffect(() => {
    // WebRTC + STOMP signaling 연결 시작
    startConnection(room.roomKey, user.mno);
    connectSpeakingSocket(room.roomKey, user.mno);

    return () => {
      stopConnection();
      disconnectSpeakingSocket();
    };
  }, [room.roomKey, user.mno]);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">{room.name}</h2>
      <div className="space-y-2">
        {Object.entries(speakingUsers).map(([memberId, isSpeaking]) => (
          <div key={memberId} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: isSpeaking ? "green" : "gray" }} />
            <span>{memberId}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
