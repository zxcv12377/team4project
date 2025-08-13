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

  const TRANSPORT_TIMEOUT = Number(import.meta.env?.VITE_TRANSPORT_TIMEOUT) || 3000;

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
                socket.emit("connectRecvTransport", { dtlsParameters, transportId: t.id }, (res) => {
                  if (res === "ok") callback();
                  else errback(new Error(res?.error || "connectRecvTransport failed"));
                });
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

            sendTransport.on("connect", ({ dtlsParameters }, callback, errback) => {
              socket.emit("connectTransport", { dtlsParameters }, (res) => {
                if (res === "ok") callback();
                else errback(new Error(res?.error || "connectTransport failed"));
              });
            });

            sendTransport.on("produce", ({ kind, rtpParameters }, callback) => {
              socket.emit("produce", { kind, rtpParameters }, ({ id, error }) => {
                if (error) return console.error("produce error:", error);
                callback({ id });
              });
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
        streamRef.current && streamRef.current.getTracks().forEach((t) => t.stop());
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
          audio.srcObject && audio.srcObject.getTracks().forEach((t) => t.stop());
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
