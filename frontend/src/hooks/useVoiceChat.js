// src/hooks/useVoiceChat.js
import * as mediasoupClient from "mediasoup-client";
import { useEffect, useRef, useState } from "react";
import { socket } from "../lib/socket";

export function useVoiceChat(roomId, member, opts = {}) {
  const { onSpeakingUsersChange, onParticipantsChange } = opts;
  const participantsCbRef = useRef(onParticipantsChange);
  const speakingCbRef = useRef(onSpeakingUsersChange);
  useEffect(() => {
    participantsCbRef.current = onParticipantsChange;
  }, [onParticipantsChange]);
  useEffect(() => {
    speakingCbRef.current = onSpeakingUsersChange;
  }, [onSpeakingUsersChange]);
  const [joined, setJoined] = useState(false);

  const speakingRef = useRef(false);
  const rafIdRef = useRef(null);
  const streamRef = useRef(null);
  const deviceRef = useRef(null);
  const sendTransportRef = useRef(null);
  const recvTransportRef = useRef(null); // 단일 recvTransport
  const audioElsRef = useRef({}); // producerId -> { audio, intervalId }
  const initRef = useRef(false); // ✅ 초기화 1회만
  const joinedRef = useRef(false); // ✅ 실제로 join된 상태 추적

  const TRANSPORT_TIMEOUT =
    Number(import.meta.env?.VITE_TRANSPORT_TIMEOUT) || 3000;

  useEffect(() => {
    if (!roomId || !member) return;
    if (initRef.current) return; // ✅ StrictMode 2회 마운트 차단
    initRef.current = true;
    let canceled = false;

    const onParticipants = (list) => {
      if (!canceled) participantsCbRef.current?.(list);
    };
    const onSpeaking = (list) => {
      if (!canceled) speakingCbRef.current?.(list);
    };
    socket.on("voiceRoomParticipants", onParticipants);
    socket.on("speaking-users", onSpeaking);

    // producer 종료 시 로컬 오디오/consumer 정리
    const onProducerClosed = ({ producerId }) => {
      const entry = audioElsRef.current[producerId];
      if (!entry) return;
      const { audio, intervalId } = entry;
      if (intervalId) clearInterval(intervalId);
      try {
        audio.srcObject && audio.srcObject.getTracks().forEach((t) => t.stop());
      } catch {
        console.log();
      }
      audio.remove?.();
      delete audioElsRef.current[producerId];
    };
    socket.on("producerClosed", onProducerClosed);

    // 새로운 producer가 생기면 consume
    const handleNewProducer = async ({ producerId, socketId }) => {
      if (canceled) return;
      const device = deviceRef.current;
      if (!device) return;

      // 단일 recvTransport 생성/재사용
      let recvTransport = recvTransportRef.current;
      if (!recvTransport) {
        await new Promise((resolve, reject) => {
          socket.emit("createRecvTransport", (paramsOrErr) => {
            if (paramsOrErr?.error) return reject(new Error(paramsOrErr.error));
            try {
              const t = device.createRecvTransport(paramsOrErr);
              recvTransportRef.current = t;

              t.on("connect", ({ dtlsParameters }, callback, errback) => {
                socket.emit(
                  "connectRecvTransport",
                  { dtlsParameters, transportId: t.id },
                  (res) => {
                    if (res === "ok") callback();
                    else
                      errback(
                        new Error(res?.error || "connectRecvTransport failed")
                      );
                  }
                );
              });

              t.on("connectionstatechange", (s) => {
                if (s === "failed" || s === "disconnected") {
                  console.warn("recvTransport state:", s);
                }
              });

              resolve();
            } catch (e) {
              reject(e);
            }
          });
        });
        recvTransport = recvTransportRef.current;
      }

      // consume 요청(콜백 기반)
      socket.emit(
        "consume",
        {
          rtpCapabilities: device.rtpCapabilities,
          producerSocketId: socketId,
          producerId,
        },
        async (data) => {
          if (data?.error) {
            console.error("consume error:", data.error);
            return;
          }
          const { id, kind, rtpParameters, producerId: pid } = data;
          if (!id) {
            console.error("consume response missing id:", data);
            return;
          }

          const consumer = await recvTransport.consume({
            id,
            producerId: pid,
            kind,
            rtpParameters,
          });

          const audio = new Audio();
          audio.autoplay = true;
          audio.muted = false;
          audio.srcObject = new MediaStream([consumer.track]);
          document.body.appendChild(audio);

          const intervalId = setInterval(() => {}, 5000);
          audioElsRef.current[pid] = { audio, intervalId };

          try {
            await audio.play();
          } catch {
            setTimeout(() => audio.play().catch(() => {}), 500);
          }
        }
      );
    };
    socket.on("newProducer", handleNewProducer);

    // 초기화(입장, device, sendTransport, produce)
    (async () => {
      try {
        // 1) 방 참가
        socket.emit(
          "joinRoom",
          {
            roomId,
            member: {
              memberId: member.memberId,
              name: member.name,
              profile: member.profile || "",
            },
          },
          () => {
            if (!canceled) setJoined(true);
            joinedRef.current = true;
          }
        );

        // 2) 마이크
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        if (canceled) return;
        streamRef.current = stream;
        const audioTrack = stream.getAudioTracks()[0];

        // 3) speaking 감지
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const audioContext = new AudioCtx();
        const analyser = audioContext.createAnalyser();
        const micSource = audioContext.createMediaStreamSource(stream);
        micSource.connect(analyser);
        analyser.fftSize = 256;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const checkSpeaking = () => {
          if (canceled) return;
          analyser.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          const isSpeaking = avg > 15;
          if (isSpeaking !== speakingRef.current) {
            speakingRef.current = isSpeaking;
            socket.emit("speaking", {
              roomId,
              memberId: member.memberId,
              speaking: isSpeaking,
            });
          }
          rafIdRef.current = requestAnimationFrame(checkSpeaking);
        };
        checkSpeaking();

        // 4) rtpCapabilities → device
        socket.emit("getRtpCapabilities", null, async (rtpCapabilities) => {
          const device = new mediasoupClient.Device();
          await device.load({ routerRtpCapabilities: rtpCapabilities });
          deviceRef.current = device;

          // 5) 송신 트랜스포트
          if (sendTransportRef.current) return;
          socket.emit("createTransport", async (paramsOrErr) => {
            if (paramsOrErr?.error) {
              console.error("createTransport error:", paramsOrErr.error);
              return;
            }
            const sendTransport = device.createSendTransport(paramsOrErr);
            sendTransportRef.current = sendTransport;

            sendTransport.on(
              "connect",
              ({ dtlsParameters }, callback, errback) => {
                socket.emit("connectTransport", { dtlsParameters }, (res) => {
                  if (res === "ok") callback();
                  else
                    errback(new Error(res?.error || "connectTransport failed"));
                });
              }
            );

            sendTransport.on("produce", ({ kind, rtpParameters }, callback) => {
              socket.emit(
                "produce",
                { kind, rtpParameters },
                ({ id, error }) => {
                  if (error) return console.error("produce error:", error);
                  callback({ id });
                }
              );
            });

            await sendTransport.produce({ track: audioTrack });
          });
        });
      } catch (err) {
        console.error("🚫 VoiceChat init error:", err);
      }
    })();

    return () => {
      canceled = true;
      setJoined(false);

      if (joinedRef.current) {
        socket.emit("leaveRoom", roomId);
        joinedRef.current = false;
      }

      socket.off("newProducer", handleNewProducer);
      socket.off("speaking-users", onSpeaking);
      socket.off("voiceRoomParticipants", onParticipants);
      socket.off("producerClosed", onProducerClosed);

      try {
        streamRef.current &&
          streamRef.current.getTracks().forEach((t) => t.stop());
      } catch {
        console.log();
      }
      streamRef.current = null;

      try {
        sendTransportRef.current && sendTransportRef.current.close();
      } catch {
        console.log();
      }
      sendTransportRef.current = null;

      try {
        recvTransportRef.current && recvTransportRef.current.close();
      } catch {
        console.log();
      }
      recvTransportRef.current = null;

      Object.values(audioElsRef.current).forEach((entry) => {
        if (!entry) return;
        const { audio, intervalId } = entry;
        if (intervalId) clearInterval(intervalId);
        try {
          audio.srcObject &&
            audio.srcObject.getTracks().forEach((t) => t.stop());
        } catch {
          console.log();
        }
        audio.remove?.();
      });
      audioElsRef.current = {};

      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      deviceRef.current = null;
      initRef.current = false;
    };
  }, [roomId, member]);

  return { joined };
}

// import * as mediasoupClient from "mediasoup-client";
// import { useEffect, useRef, useState } from "react";
// import { socket } from "../lib/socket";

// export function useVoiceChat(roomId, member, { onSpeakingUsersChange, onParticipantsChange } = {}) {
//   const [joined, setJoined] = useState(false);

//   const analyserRef = useRef(null);
//   const dataArrayRef = useRef(null);
//   const speakingRef = useRef(false);
//   const animationIdRef = useRef(null);
//   const streamRef = useRef(null);
//   const deviceRef = useRef(null);
//   const sendTransportRef = useRef(null);
//   const recvTransportsRef = useRef([]);
//   const audioElementsRef = useRef({});

//   const TRANSPORT_TIMEOUT = import.meta.env?.VITE_TRANSPORT_TIMEOUT ?? 3000; // fallback 시간

//   useEffect(() => {
//     if (!roomId || !member) return;

//     let cancelled = false;

//     // 입장 직전에 리스너 등록
//     socket.on("voiceRoomParticipants", (list) => {
//       if (cancelled) return;
//       // console.log("👥 voiceRoomParticipants recv:", list);
//       onParticipantsChange?.(list);
//     });

//     socket.on("speaking-users", (list) => {
//       if (cancelled) return;
//       onSpeakingUsersChange?.(list);
//     });

//     // 8. 다른 사람의 오디오 수신 준비
//     const handleNewProducer = async ({ producerId, socketId }) => {
//       console.log("새로운 producer 수신:", producerId, socketId);
//       const device = deviceRef.current;
//       if (!device || cancelled) return;
//       // 수신용 트랜스포트 요청
//       socket.emit("createRecvTransport", (params) => {
//         const recvTransport = device.createRecvTransport(params);

//         recvTransport.on("connect", ({ dtlsParameters }, callback, errback) => {
//           let settled = false; // 중복 호출 방지용

//           console.log("[A] 🟢 recvTransport connect 시작");
//           socket.emit("connectRecvTransport", {
//             dtlsParameters,
//             transportId: recvTransport.id,
//           });
//           // ack 응답 콜백(callback acknowledgment) 기다리고 처리
//           socket.once("connectRecvTransportDone", (status) => {
//             if (settled) return;
//             settled = true;

//             console.log("[A] ✅ connectRecvTransportDone:", status);
//             if (status === "ok") {
//               callback();
//             } else {
//               console.error("❌ connectRecviveTransport 실패");
//               errback();
//             }
//           });
//           // 응답 타임아웃 처리 (3초)
//           setTimeout(() => {
//             if (settled) return;
//             settled = true;
//             console.warn("connectRecvTransport 응답 없음 - fallback errback 실행");
//             errback(new Error("connectRecvTransport timeout"));
//           }, TRANSPORT_TIMEOUT);
//         });

//         // consume 요청
//         socket.emit(
//           "consume",
//           {
//             rtpCapabilities: device.rtpCapabilities,
//             producerSocketId: socketId,
//             producerId,
//           },
//           async (data) => {
//             console.log("[consume 응답]", data);
//             const { id, kind, rtpParameters, producerId } = data;
//             if (!id) {
//               console.error("consume 응답에 id 없음", data);
//               return;
//             }
//             const consumer = await recvTransport.consume({
//               id,
//               producerId,
//               kind,
//               rtpParameters,
//             });
//             console.log("[A] 🎧 consumer 생성 성공");

//             const audio = new Audio();
//             const stream = new MediaStream([consumer.track]);
//             audio.autoplay = true;
//             audio.srcObject = stream;
//             audio.volume = 1.0;
//             audio.muted = false; // 오디오 뮤트 자동 해제
//             document.body.appendChild(audio);
//             audioElementsRef.current[producerId] = {
//               audio,
//               intervalId: setInterval(() => {
//                 console.log(`[${producerId}] currentTime: ${audio.currentTime}, readyState: ${audio.readyState}`);
//               }, 1000),
//             };
//             audio
//               .play()
//               .then(() => {
//                 console.log("✅ 오디오 재생 시작됨");
//               })
//               .catch((err) => {
//                 console.warn("🔇 오디오 재생 실패 -> 재시도 ", err);
//                 setTimeout(() => {
//                   audio
//                     .play()
//                     .then(() => console.log("✅ 강제 재생 성공"))
//                     .catch((e) => console.log("🔇 오디오 강제 재생 실패", e));
//                 }, 500);
//               });

//             // 오디오 재생 보장용 디버깅 코드
//             setTimeout(() => {
//               const storedAudioObj = audioElementsRef.current[producerId];
//               const storedAudio = storedAudioObj?.audio;
//               if (storedAudio) {
//                 // 오디오가 실제로 재생 가능한 상태인지 검사
//                 // 모바일이나 엣지, iOS Safari는 자동 재생 정책 때문에 audio.play()가 초기에 실패할 수 있음
//                 // console.log("🧪 audio currentTime:", storedAudio.currentTime);
//                 // console.log("🧪 audio.readyState:", storedAudio.readyState);
//                 storedAudio.play().catch((e) => console.error("🔇 강제재생 실패:", e));
//               }
//             }, 1000);
//             recvTransportsRef.current.push(recvTransport);
//           }
//         );
//       });
//     };

//     socket.on("newProducer", handleNewProducer);

//     // socketRef.current = socket;
//     const start = async () => {
//       if (!member) return;
//       // 1. 채널 입장 / 서버에 socket 등록
//       console.log("→ joiningRoom with member:", member);
//       socket.emit(
//         "joinRoom",
//         {
//           roomId,
//           member: {
//             memberId: member.memberId,
//             name: member.name,
//             profile: member.profile || "",
//           },
//         },
//         () => {
//           setJoined(true);
//           proceedAfterJoin();
//         }
//       );

//       const proceedAfterJoin = async () => {
//         try {
//           // 2. 마이크 트랙 획득
//           const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//           console.log("🎙️ 마이크 트랙:", stream.getAudioTracks());
//           const audioTrack = stream.getAudioTracks()[0];
//           streamRef.current = stream;

//           // 3. speaking 감지 준비
//           const audioContext = new (window.AudioContext || window.webkitAudioContext)();
//           const analyser = audioContext.createAnalyser();
//           const micSource = audioContext.createMediaStreamSource(stream);
//           micSource.connect(analyser);
//           analyser.fftSize = 256;
//           const dataArray = new Uint8Array(analyser.frequencyBinCount);
//           analyserRef.current = analyser;
//           dataArrayRef.current = dataArray;

//           // 4. RTP Capabilities 요청 -> device 생성
//           socket.emit("getRtpCapabilities", null, async (rtpCapabilities) => {
//             const device = new mediasoupClient.Device();
//             await device.load({ routerRtpCapabilities: rtpCapabilities });
//             console.log("✅ rtpCapabilities 수신:", rtpCapabilities);
//             deviceRef.current = device;
//             // 5. 송신 Transport 생성
//             if (sendTransportRef.current) {
//               console.warn("🚧 이미 sendTransport 존재함. 중복 방지로 skip");
//               return;
//             }
//             socket.emit("createTransport", async (params) => {
//               const sendTransport = device.createSendTransport(params);
//               sendTransportRef.current = sendTransport;
//               // 6. 송신 Transport를 연결
//               sendTransport.on("connect", ({ dtlsParameters }, callback, errback) => {
//                 socket.emit("connectTransport", { dtlsParameters }, (response) => {
//                   if (response === "ok") {
//                     callback();
//                   } else {
//                     console.error("❌ connectTransport 실패");
//                     errback();
//                   }
//                 });
//               });
//               // 7. 내 오디오 전송을 위한 producer 생성
//               sendTransport.on("produce", ({ kind, rtpParameters }, callback) => {
//                 socket.emit("produce", { kind, rtpParameters }, ({ id }) => callback({ id }));
//                 console.log("🎤 오디오 트랙 등록 완료");
//               });
//               console.log("📡 sendTransport.produce 호출");
//               await sendTransport.produce({ track: audioTrack });
//             });
//           });
//           //#region 볼륨 시각화
//           // 🔊 볼륨 시각화
//           // const audioContext = new (window.AudioContext || window.webkitAudioContext)();
//           // const analyser = audioContext.createAnalyser();
//           // const micSource = audioContext.createMediaStreamSource(stream);
//           // micSource.connect(analyser);
//           // analyser.fftSize = 256;
//           // const dataArray = new Uint8Array(analyser.frequencyBinCount);

//           // const updateVolume = () => {
//           //   analyser.getByteFrequencyData(dataArray);
//           //   const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
//           //   setVolume(Math.round(avg));
//           //   requestAnimationFrame(updateVolume);
//           // };
//           // updateVolume();
//           // audioContextRef.current = audioContext;
//           //#endregion

//           // 8. 말하기 감지 및 emit
//           const checkSpeaking = () => {
//             if (cancelled) return;
//             analyser.getByteFrequencyData(dataArray);
//             const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
//             const isSpeaking = avg > 15; // 현재 최대 인원수

//             if (isSpeaking !== speakingRef.current) {
//               speakingRef.current = isSpeaking;
//               socket.emit("speaking", {
//                 roomId,
//                 memberId: member.memberId,
//                 speaking: isSpeaking,
//               });
//             }

//             animationIdRef.current = requestAnimationFrame(checkSpeaking);
//           };
//           checkSpeaking();
//         } catch (err) {
//           console.error("🚫 VoiceChat 오류 발생:", err);
//         }
//       };
//     };

//     start();

//     return () => {
//       console.log("🧹 클린업 실행됨");
//       if (sendTransportRef.current) {
//         sendTransportRef.current.close();
//         console.log("✅ sendTransport.closed:", sendTransportRef.current.closed);
//       }
//       cancelled = true;
//       setJoined(false);
//       socket.emit("leaveRoom", { roomId, memberId: member.memberId });
//       socket.off("newProducer", handleNewProducer);
//       socket.off("speaking-users");
//       socket.off("voiceRoomParticipants");

//       streamRef.current?.getTracks().forEach((t) => t.stop());
//       streamRef.current = null;
//       sendTransportRef.current?.close();
//       sendTransportRef.current = null;
//       recvTransportsRef.current.forEach((t) => t.close());
//       recvTransportsRef.current = [];
//       Object.values(audioElementsRef.current).forEach((entry) => {
//         if (!entry) return;

//         const audio = entry.audio || entry;
//         const intervalId = entry.intervalId;

//         if (intervalId) clearInterval(intervalId);
//         audio.srcObject?.getTracks().forEach((t) => t.stop());
//         audio.remove?.();
//       });
//       audioElementsRef.current = {};

//       if (animationIdRef.current) {
//         cancelAnimationFrame(animationIdRef.current);
//         animationIdRef.current = null;
//       }
//       deviceRef.current = null;
//     };
//   }, [roomId, member]);
//   // return { volume };
//   return { joined };
//   // return {
//   //   // 수동 사용시 이걸로 바꾸면 됨
//   //   startSpeaking: () => socket.emit("speaking", { roomId, memberId: member.memberId, speaking: true }),
//   //   stopSpeaking: () => socket.emit("speaking", { roomId, memberId: member.memberId, speaking: false }),
//   // };
// }

// // socket.emit("이벤트", (callback) => {}) 형식은 콜백을 서버로 전달하려는 용도
// // param을 서버에서 받아야 하므로 아래와 같은 구조여야 함
