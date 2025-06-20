import { useEffect, useRef } from "react";
import { stompClient } from "../stomp/voiceStompClient";

export default function useWebRTC(roomId, userId) {
  const localStream = useRef(null);
  const peerRef = useRef(null);

  useEffect(() => {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });

    peerRef.current = pc;

    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      localStream.current = stream;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    });

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        stompClient.publish({
          destination: `/app/voice/candidate/${roomId}`,
          body: JSON.stringify({ candidate: e.candidate, sender: userId }),
        });
      }
    };

    stompClient.subscribe(`/topic/voice/offer/${roomId}`, ({ body }) => {
      const data = JSON.parse(body);
      if (data.sender === userId) return;

      pc.setRemoteDescription(new RTCSessionDescription(data));
      pc.createAnswer().then((answer) => {
        pc.setLocalDescription(answer);
        stompClient.publish({
          destination: `/app/voice/answer/${roomId}`,
          body: JSON.stringify({ ...answer, sender: userId }),
        });
      });
    });

    stompClient.subscribe(`/topic/voice/answer/${roomId}`, ({ body }) => {
      const data = JSON.parse(body);
      if (data.sender === userId) return;
      pc.setRemoteDescription(new RTCSessionDescription(data));
    });

    stompClient.subscribe(`/topic/voice/candidate/${roomId}`, ({ body }) => {
      const data = JSON.parse(body);
      if (data.sender === userId) return;
      pc.addIceCandidate(new RTCIceCandidate(data.candidate));
    });

    stompClient.publish({
      destination: `/app/voice/offer/${roomId}`,
      body: JSON.stringify({ type: "offer", sdp: pc.localDescription?.sdp, sender: userId }),
    });

    return () => {
      stompClient.unsubscribe(`/topic/voice/**`);
      pc.close();
    };
  }, [roomId, userId]);
}
