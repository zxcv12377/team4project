// import { useEffect, useRef } from "react";
// import { sendSignaling, subscribe } from "@/stomp/stompClient";

// // ICE 서버 설정: 구글의 공개 STUN 서버를 사용
// // STUN에서 TURN 서버로 교체
// const ICE_CONFIG = {
//   iceServers: [
//     { urls: "stun:stun.l.google.com:19302" },
//     {
//       urls: ["turn:strongberry.p-e.kr/:3478?transport=udp", "turn:strongberry.p-e.kr/:3478?transport=tcp"],
//       username: "testuser",
//       credential: "testpass",
//     },
//   ],
// };

// export default function useMultiPeerConnection({ roomId, userId, onTrack }) {
//   const peersRef = useRef({}); // 유저 ID별 RTCPeerConnection 저장
//   const localStreamRef = useRef(null); // 내 오디오 스트림 저장

//   // 상대방의 오디오 트랙 수신 핸들러
//   const handleTrack = (event, remoteUserId) => {
//     onTrack?.(event.streams[0], remoteUserId);
//   };

//   // 새로운 피어 추가 + offer 생성 및 전송 (polite: 주도권 유저)
//   const addPeer = async (remoteUserId, polite = true) => {
//     if (peersRef.current[remoteUserId]) return; // 이미 연결됨

//     const peer = new RTCPeerConnection(ICE_CONFIG);
//     peersRef.current[remoteUserId] = peer;

//     // 내 오디오 스트림을 peer에 추가
//     localStreamRef.current.getTracks().forEach((track) => {
//       peer.addTrack(track, localStreamRef.current);
//     });

//     // 상대방 오디오 수신 시 콜백
//     peer.ontrack = (event) => handleTrack(event, remoteUserId);

//     // ICE 후보 수집 시 STOMP로 전송
//     peer.onicecandidate = (e) => {
//       if (e.candidate) {
//         console.log("🔍 ICE candidate 생성됨:", e.candidate); // ✅ 이 줄 추가
//         sendSignaling("candidate", roomId, {
//           sender: userId,
//           target: remoteUserId,
//           candidate: e.candidate,
//         });
//       } else {
//         console.log("✅ ICE Gathering 완료"); // ✅ 이것도 있으면 좋음
//       }
//     };

//     // polite 유저면 offer 생성
//     if (polite) {
//       const offer = await peer.createOffer();
//       await peer.setLocalDescription(offer);
//       sendSignaling("offer", roomId, {
//         sender: userId,
//         target: remoteUserId,
//         sdp: offer,
//       });
//     }
//   };

//   // offer 수신 → answer 생성
//   const handleOffer = async (data) => {
//     const { sender, sdp } = data;
//     const peer = peersRef.current[sender] || (await addPeer(sender, false));
//     await peer.setRemoteDescription(new RTCSessionDescription(sdp));
//     const answer = await peer.createAnswer();
//     await peer.setLocalDescription(answer);
//     sendSignaling("answer", roomId, {
//       sender: userId,
//       target: sender,
//       sdp: answer,
//     });
//   };

//   // answer 수신 → remoteDescription 설정
//   const handleAnswer = async (data) => {
//     const { sender, sdp } = data;
//     const peer = peersRef.current[sender];
//     if (!peer) return;
//     await peer.setRemoteDescription(new RTCSessionDescription(sdp));
//   };

//   // ICE 후보 수신 처리
//   const handleCandidate = async (data) => {
//     const { sender, candidate } = data;
//     const peer = peersRef.current[sender];
//     if (!peer) return;
//     await peer.addIceCandidate(new RTCIceCandidate(candidate));
//   };

//   // 음성 채팅 시작: 스트림 요청 및 signaling 구독
//   const start = async () => {
//     const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//     localStreamRef.current = stream;

//     // signaling 수신 처리 등록
//     subscribe(`/topic/voice/offer/${roomId}`, handleOffer);
//     subscribe(`/topic/voice/answer/${roomId}`, handleAnswer);
//     subscribe(`/topic/voice/candidate/${roomId}`, handleCandidate);

//     // 유저 참여 브로드캐스트 (선택)
//     sendSignaling("join", roomId, { sender: userId });
//   };

//   // 내 오디오 스트림 가져오기
//   const getLocalStream = () => localStreamRef.current;

//   return { start, getLocalStream };
// }
