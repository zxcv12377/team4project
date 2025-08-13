// WebRTC + mediasoup 기반으로 음성채팅을 하기 때문에 사용하지 않는 코드

// import { useEffect, useRef } from "react";
// import { stompClient } from "../stomp/voiceStompClient";

// export default function useWebRTC(
//   roomId,
//   userId,
//   { isInitiator, remoteAudioRef, turnConfig } = {}
// ) {
//   const pcRef = (useRef < RTCPeerConnection) | (null > null);
//   const localStreamRef = (useRef < MediaStream) | (null > null);
//   const subsRef = useRef([]); // STOMP subscription objects
//   const pendingCandidates = useRef([]); // ICE buffer
//   const remoteDescSet = useRef(false);

//   useEffect(() => {
//     let canceled = false;

//     (async () => {
//       // 1) RTCPeerConnection 생성 (STUN + 선택적 TURN)
//       const iceServers = [
//         { urls: "stun:stun.l.google.com:19302" },
//         ...(turnConfig ? [turnConfig] : []),
//       ];
//       const pc = new RTCPeerConnection({ iceServers });
//       pcRef.current = pc;

//       // 2) 로컬 마이크 획득 후 트랙 추가 (순서 중요)
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       if (canceled) return;
//       localStreamRef.current = stream;
//       for (const track of stream.getAudioTracks()) {
//         pc.addTrack(track, stream);
//       }

//       // 3) 원격 트랙을 오디오 엘리먼트에 연결
//       pc.ontrack = (e) => {
//         const [remoteStream] = e.streams;
//         if (remoteAudioRef?.current) {
//           remoteAudioRef.current.srcObject = remoteStream;
//           remoteAudioRef.current.play?.().catch(() => {});
//         }
//       };

//       // 4) ICE 후보 생기면 브로드캐스트
//       pc.onicecandidate = (e) => {
//         if (e.candidate) {
//           stompClient.publish({
//             destination: `/app/voice/candidate/${roomId}`,
//             body: JSON.stringify({ candidate: e.candidate, sender: userId }),
//           });
//         }
//       };

//       // 5) STOMP 구독 설정
//       const subOffer = stompClient.subscribe(
//         `/topic/voice/offer/${roomId}`,
//         async ({ body }) => {
//           const desc = JSON.parse(body); // { type, sdp, sender }
//           if (desc.sender === userId) return;
//           if (desc.type !== "offer") return;

//           await pc.setRemoteDescription(desc);
//           remoteDescSet.current = true;

//           // 큐에 쌓인 ICE 후보 반영
//           for (const c of pendingCandidates.current) {
//             try {
//               await pc.addIceCandidate(c);
//             } catch (e) {
//               console.warn("ICE add fail", e);
//             }
//           }
//           pendingCandidates.current = [];

//           const answer = await pc.createAnswer();
//           await pc.setLocalDescription(answer);

//           stompClient.publish({
//             destination: `/app/voice/answer/${roomId}`,
//             body: JSON.stringify({
//               type: "answer",
//               sdp: answer.sdp,
//               sender: userId,
//             }),
//           });
//         }
//       );

//       const subAnswer = stompClient.subscribe(
//         `/topic/voice/answer/${roomId}`,
//         async ({ body }) => {
//           const desc = JSON.parse(body); // { type, sdp, sender }
//           if (desc.sender === userId) return;
//           if (desc.type !== "answer") return;

//           await pc.setRemoteDescription(desc);
//           remoteDescSet.current = true;

//           // 큐에 쌓인 ICE 후보 반영
//           for (const c of pendingCandidates.current) {
//             try {
//               await pc.addIceCandidate(c);
//             } catch (e) {
//               console.warn("ICE add fail", e);
//             }
//           }
//           pendingCandidates.current = [];
//         }
//       );

//       const subCand = stompClient.subscribe(
//         `/topic/voice/candidate/${roomId}`,
//         async ({ body }) => {
//           const data = JSON.parse(body); // { candidate, sender }
//           if (data.sender === userId) return;
//           const cand = data.candidate;
//           if (!remoteDescSet.current) {
//             pendingCandidates.current.push(cand);
//           } else {
//             try {
//               await pc.addIceCandidate(cand);
//             } catch (e) {
//               console.warn("ICE add fail", e);
//             }
//           }
//         }
//       );

//       subsRef.current = [subOffer, subAnswer, subCand];

//       // 6) 내가 initiator면 오퍼 생성/전송
//       if (isInitiator) {
//         const offer = await pc.createOffer({
//           offerToReceiveAudio: true,
//           iceRestart: false,
//         });
//         await pc.setLocalDescription(offer);
//         stompClient.publish({
//           destination: `/app/voice/offer/${roomId}`,
//           body: JSON.stringify({
//             type: "offer",
//             sdp: offer.sdp,
//             sender: userId,
//           }),
//         });
//       }
//     })();

//     return () => {
//       canceled = true;
//       // STOMP 구독 해제
//       for (const sub of subsRef.current) {
//         try {
//           sub?.unsubscribe?.();
//         } catch {
//           console.log();
//         }
//       }
//       subsRef.current = [];
//       // WebRTC 정리
//       try {
//         pcRef.current?.getSenders()?.forEach((s) => s.track?.stop?.());
//       } catch {
//         console.log();
//       }
//       try {
//         pcRef.current?.close?.();
//       } catch {
//         console.log();
//       }
//       pcRef.current = null;
//       localStreamRef.current = null;
//       pendingCandidates.current = [];
//       remoteDescSet.current = false;
//     };
//   }, [roomId, userId, isInitiator, remoteAudioRef, turnConfig]);
// }
