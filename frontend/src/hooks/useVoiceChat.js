import * as mediasoupClient from "mediasoup-client";
import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { socket } from "../lib/socket";

export function useVoiceChat(roomId, member, onSpeakingUsersChange) {
  // const [volume, setVolume] = useState(0);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const speakingRef = useRef(false);
  const animationIdRef = useRef(null);
  const streamRef = useRef(null);
  const socketRef = useRef(null);
  const deviceRef = useRef(null);
  const sendTransportRef = useRef(null);
  const recvTransportsRef = useRef([]);
  const audioElementsRef = useRef({});
  // const audioContextRef = useRef(null);

  useEffect(() => {
    if (!roomId || !member) return;

    socketRef.current = socket;

    const start = async () => {
      if (!member) return;

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

          // 4. RTP Capabilities 요청 → device 생성
          socket.emit("getRtpCapabilities", null, async (rtpCapabilities) => {
            const device = new mediasoupClient.Device();
            await device.load({ routerRtpCapabilities: rtpCapabilities });
            console.log("✅ rtpCapabilities 수신:", rtpCapabilities);
            deviceRef.current = device;
            // 5. 송신 Transport 생성
            if (sendTransportRef.current) return;
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

      // 1. 채널 입장 서버에 socket 등록
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
          setTimeout(() => {
            proceedAfterJoin();
          }, 100);
        }
      );
    };
    // 8. 소비자 수신 처리
    const handleNewProducer = async ({ producerId, socketId }) => {
      console.log("새로운 producer 수신:", producerId, socketId);
      const device = deviceRef.current;
      if (!device) return;
      // 수신용 트랜스포트 요청
      socket.emit("createRecvTransport", (params) => {
        const recvTransport = device.createRecvTransport(params);

        recvTransport.on("connect", ({ dtlsParameters }, callback, errback) => {
          socket.emit("connectRecvTransport", {
            dtlsParameters,
            transportId: recvTransport.id,
          });
          // ack 응답 기다리고 처리
          socket.once("connectRecvTransportDone", (status) => {
            if (status === "ok") {
              callback();
            } else {
              console.error("❌ connectRecviveTransport 실패");
              errback();
            }
          });
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
            const stream = new MediaStream([consumer.track]);
            const audio = new Audio();
            audio.srcObject = stream;
            audio.autoplay = true;
            audio.volume = 1.0;
            // console.log("audio volume", audio.volume);
            // console.log("🔊 consumer 생성됨", consumer);
            // console.log("🔈 stream 생성됨", stream);
            // console.log("🔎 audio element state → muted:", audio.muted, "volume:", audio.volume);
            audio
              .play()
              .then(() => {
                console.log("✅ 오디오 재생 시작됨");
              })
              .catch((err) => {
                console.error("🔇 오디오 재생 실패", err);
              });

            // audioElementsRef.current[producerId] = audio;

            // 오디오 재생 보장용 디버깅 코드
            setTimeout(() => {
              const audio = audioElementsRef.current[producerId];
              if (audio) {
                // 오디오가 실제로 재생 가능한 상태인지 검사
                // 모바일이나 엣지, iOS Safari는 자동 재생 정책 때문에 audio.play()가 초기에 실패할 수 있음
                console.log("🧪 audio currentTime:", audio.currentTime);
                console.log("🧪 audio.readyState:", audio.readyState);
                audio.play().catch((e) => console.error("🔇 강제재생 실패:", e));
              }
            }, 1000);
            recvTransportsRef.current.push(recvTransport);
          }
        );
      });
    };
    socket.on("newProducer", handleNewProducer);

    start();

    return () => {
      socket.emit("leaveRoom", roomId);
      socket.off("newProducer", handleNewProducer);
      socket.off("speaking-users");

      streamRef.current?.getTracks().forEach((t) => t.stop());
      sendTransportRef.current?.close();
      recvTransportsRef.current.forEach((t) => t.close());
      Object.values(audioElementsRef.current).forEach((a) => {
        a.srcObject?.getTracks().forEach((t) => t.stop());
        a.remove();
      });

      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
    };
  }, [roomId, member]);
  // return { volume };
  return {};
  // return {
  //   // 수동 사용시 이걸로 바꾸면 됨
  //   startSpeaking: () => socket.emit("speaking", { roomId, memberId: member.memberId, speaking: true }),
  //   stopSpeaking: () => socket.emit("speaking", { roomId, memberId: member.memberId, speaking: false }),
  // };
}

// socket.emit("이벤트", (callback) => {}) 형식은 콜백을 서버로 전달하려는 용도
// param을 서버에서 받아야 하므로 아래와 같은 구조여야 함
