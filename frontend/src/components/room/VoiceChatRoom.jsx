import { useEffect, useRef } from "react";
import useStompWebRTC from "../hooks/useStompWebRTC";

export default function VoiceRoom({ roomId, user }) {
  const audioRef = useRef(null);
  const { remoteStream } = useStompWebRTC({
    roomId,
    userId: String(user.id ?? user.mno),
    baseUrl: "", // 같은 도메인이면 빈 문자열
    turn: {
      host: "strongberry.p-e.kr",
      port: 3478,
      tls: 5349, // TLS 사용 시
      username: "<TURN-USER>",
      credential: "<TURN-PASS>",
    },
  });

  useEffect(() => {
    if (audioRef.current && remoteStream) {
      audioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">Room: {roomId}</h2>
      <audio ref={audioRef} autoPlay playsInline />
    </div>
  );
}
