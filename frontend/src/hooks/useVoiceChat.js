import * as mediasoupClient from "mediasoup-client";
import { useEffect, useRef, useState } from "react";
import { socket } from "../lib/socket";

export function useVoiceChat(roomId, member, onSpeakingUsersChange) {
  const [joined, setJoined] = useState(false);

  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const speakingRef = useRef(false);
  const animationIdRef = useRef(null);
  const streamRef = useRef(null);
  const deviceRef = useRef(null);
  const sendTransportRef = useRef(null);
  const recvTransportsRef = useRef([]);
  const audioElementsRef = useRef({});

  const TRANSPORT_TIMEOUT = import.meta.env?.VITE_TRANSPORT_TIMEOUT ?? 3000; // fallback 시간

  useEffect(() => {
    if (!roomId || !member) return;

    let cancelled = false;
    // 8. 다른 사람의 오디오 수신 준비
    const handleNewProducer = async ({ producerId, socketId }) => {
      console.log("새로운 producer 수신:", producerId, socketId);
      const device = deviceRef.current;
      if (!device || cancelled) return;
      // 수신용 트랜스포트 요청
      socket.emit("createRecvTransport", (params) => {
        const recvTransport = device.createRecvTransport(params);

        recvTransport.on("connect", ({ dtlsParameters }, callback, errback) => {
          let settled = false; // 중복 호출 방지용

          console.log("[A] 🟢 recvTransport connect 시작");
          socket.emit("connectRecvTransport", {
            dtlsParameters,
            transportId: recvTransport.id,
          });
          // ack 응답 콜백(callback acknowledgment) 기다리고 처리
          socket.once("connectRecvTransportDone", (status) => {
            if (settled) return;
            settled = true;

            console.log("[A] ✅ connectRecvTransportDone:", status);
            if (status === "ok") {
              callback();
            } else {
              console.error("❌ connectRecviveTransport 실패");
              errback();
            }
          });
          // 응답 타임아웃 처리 (3초)
          setTimeout(() => {
            if (settled) return;
            settled = true;
            console.warn("connectRecvTransport 응답 없음 - fallback errback 실행");
            errback(new Error("connectRecvTransport timeout"));
          }, TRANSPORT_TIMEOUT);
        });

        // consume 요청
        socket.emit(
          "consume",
          {
            rtpCapabilities: device.rtpCapabilities,
            producerSocketId: socketId,
            producerId,
          },
          async (data) => {
            console.log("[consume 응답]", data);
            const { id, kind, rtpParameters, producerId } = data;
            if (!id) {
              console.error("consume 응답에 id 없음", data);
              return;
            }
            const consumer = await recvTransport.consume({
              id,
              producerId,
              kind,
              rtpParameters,
            });
            console.log("[A] 🎧 consumer 생성 성공");

            const audio = new Audio();
            const stream = new MediaStream([consumer.track]);
            audio.autoplay = true;
            audio.srcObject = stream;
            audio.volume = 1.0;
            audio.muted = false; // 오디오 뮤트 자동 해제
            document.body.appendChild(audio);
            audioElementsRef.current[producerId] = {
              audio,
              intervalId: setInterval(() => {
                console.log(`[${producerId}] currentTime: ${audio.currentTime}, readyState: ${audio.readyState}`);
              }, 1000),
            };
            audio
              .play()
              .then(() => {
                console.log("✅ 오디오 재생 시작됨");
              })
              .catch((err) => {
                console.warn("🔇 오디오 재생 실패 -> 재시도 ", err);
                setTimeout(() => {
                  audio
                    .play()
                    .then(() => console.log("✅ 강제 재생 성공"))
                    .catch((e) => console.log("🔇 오디오 강제 재생 실패", e));
                }, 500);
              });

            // 오디오 재생 보장용 디버깅 코드
            setTimeout(() => {
              const storedAudioObj = audioElementsRef.current[producerId];
              const storedAudio = storedAudioObj?.audio;
              if (storedAudio) {
                // 오디오가 실제로 재생 가능한 상태인지 검사
                // 모바일이나 엣지, iOS Safari는 자동 재생 정책 때문에 audio.play()가 초기에 실패할 수 있음
                // console.log("🧪 audio currentTime:", storedAudio.currentTime);
                // console.log("🧪 audio.readyState:", storedAudio.readyState);
                storedAudio.play().catch((e) => console.error("🔇 강제재생 실패:", e));
              }
            }, 1000);
            recvTransportsRef.current.push(recvTransport);
          }
        );
      });
    };

    socket.on("newProducer", handleNewProducer);

    // socketRef.current = socket;
    const start = async () => {
      if (!member) return;
      // 1. 채널 입장 / 서버에 socket 등록
      socket.emit(
        "joinRoom",
        {
          roomId,
          member: {
            memberId: member.mno,
            name: member.name,
            profile: member.profile || "",
          },
        },
        () => {
          setJoined(true);
          proceedAfterJoin();
        }
      );

      const proceedAfterJoin = async () => {
        try {
          // 2. 마이크 트랙 획득
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          console.log("🎙️ 마이크 트랙:", stream.getAudioTracks());
          const audioTrack = stream.getAudioTracks()[0];
          streamRef.current = stream;

          // 3. speaking 감지 준비
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const analyser = audioContext.createAnalyser();
          const micSource = audioContext.createMediaStreamSource(stream);
          micSource.connect(analyser);
          analyser.fftSize = 256;
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          analyserRef.current = analyser;
          dataArrayRef.current = dataArray;

          // 4. RTP Capabilities 요청 -> device 생성
          socket.emit("getRtpCapabilities", null, async (rtpCapabilities) => {
            const device = new mediasoupClient.Device();
            await device.load({ routerRtpCapabilities: rtpCapabilities });
            console.log("✅ rtpCapabilities 수신:", rtpCapabilities);
            deviceRef.current = device;
            // 5. 송신 Transport 생성
            if (sendTransportRef.current) {
              console.warn("🚧 이미 sendTransport 존재함. 중복 방지로 skip");
              return;
            }
            socket.emit("createTransport", async (params) => {
              const sendTransport = device.createSendTransport(params);
              sendTransportRef.current = sendTransport;
              // 6. 송신 Transport를 연결
              sendTransport.on("connect", ({ dtlsParameters }, callback, errback) => {
                socket.emit("connectTransport", { dtlsParameters }, (response) => {
                  if (response === "ok") {
                    callback();
                  } else {
                    console.error("❌ connectTransport 실패");
                    errback();
                  }
                });
              });
              // 7. 내 오디오 전송을 위한 producer 생성
              sendTransport.on("produce", ({ kind, rtpParameters }, callback) => {
                socket.emit("produce", { kind, rtpParameters }, ({ id }) => callback({ id }));
                console.log("🎤 오디오 트랙 등록 완료");
              });
              console.log("📡 sendTransport.produce 호출");
              await sendTransport.produce({ track: audioTrack });
            });
          });
          //#region 볼륨 시각화
          // 🔊 볼륨 시각화
          // const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          // const analyser = audioContext.createAnalyser();
          // const micSource = audioContext.createMediaStreamSource(stream);
          // micSource.connect(analyser);
          // analyser.fftSize = 256;
          // const dataArray = new Uint8Array(analyser.frequencyBinCount);

          // const updateVolume = () => {
          //   analyser.getByteFrequencyData(dataArray);
          //   const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
          //   setVolume(Math.round(avg));
          //   requestAnimationFrame(updateVolume);
          // };
          // updateVolume();
          // audioContextRef.current = audioContext;
          //#endregion

          // 8. 말하기 감지 및 emit
          const checkSpeaking = () => {
            if (cancelled) return;
            analyser.getByteFrequencyData(dataArray);
            const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
            const isSpeaking = avg > 15; // 현재 최대 인원수

            if (isSpeaking !== speakingRef.current) {
              speakingRef.current = isSpeaking;
              socket.emit("speaking", {
                roomId,
                memberId: member.memberId,
                speaking: isSpeaking,
              });
            }

            animationIdRef.current = requestAnimationFrame(checkSpeaking);
          };
          checkSpeaking();

          // 9. 다른 사용자 speaking 수신
          socket.on("speaking-users", (list) => {
            onSpeakingUsersChange?.(list);
          });
        } catch (err) {
          console.error("🚫 VoiceChat 오류 발생:", err);
        }
      };
    };

    start();

    return () => {
      console.log("🧹 클린업 실행됨");
      if (sendTransportRef.current) {
        sendTransportRef.current.close();
        console.log("✅ sendTransport.closed:", sendTransportRef.current.closed);
      }
      cancelled = true;
      setJoined(false);
      socket.emit("leaveRoom", roomId);
      socket.off("newProducer", handleNewProducer);
      socket.off("speaking-users");

      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      sendTransportRef.current?.close();
      sendTransportRef.current = null;
      recvTransportsRef.current.forEach((t) => t.close());
      recvTransportsRef.current = [];
      Object.values(audioElementsRef.current).forEach((entry) => {
        if (!entry) return;

        const audio = entry.audio || entry;
        const intervalId = entry.intervalId;

        if (intervalId) clearInterval(intervalId);
        audio.srcObject?.getTracks().forEach((t) => t.stop());
        audio.remove?.();
      });
      audioElementsRef.current = {};

      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
      deviceRef.current = null;
    };
  }, [roomId, member]);
  // return { volume };
  return { joined };
  // return {
  //   // 수동 사용시 이걸로 바꾸면 됨
  //   startSpeaking: () => socket.emit("speaking", { roomId, memberId: member.memberId, speaking: true }),
  //   stopSpeaking: () => socket.emit("speaking", { roomId, memberId: member.memberId, speaking: false }),
  // };
}

// socket.emit("이벤트", (callback) => {}) 형식은 콜백을 서버로 전달하려는 용도
// param을 서버에서 받아야 하므로 아래와 같은 구조여야 함
