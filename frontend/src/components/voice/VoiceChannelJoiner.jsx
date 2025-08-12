// src/hooks/useMediasoupVoice.js
import * as mediasoupClient from "mediasoup-client";
import { useEffect, useRef, useState } from "react";
import { getSocket } from "../../lib/socketSingleton";

export default function useMediasoupVoice(roomId, me, { baseURL } = {}) {
  const [joined, setJoined] = useState(false);
  const [participants, setParticipants] = useState([]); // [{memberId, name, profile, speaking}]
  const [userCount, setUserCount] = useState(0);

  const socketRef = useRef(null);
  const deviceRef = useRef(null);
  const sendTransportRef = useRef(null);
  const recvTransportRef = useRef(null);
  const producerAudiosRef = useRef({}); // producerId -> { audio, intervalId }
  const localStreamRef = useRef(null);

  // speaking 합치기
  const mergeSpeaking = (list, speakingList) => {
    const speakingSet = new Set(
      (speakingList || []).filter(Boolean).map((x) => x.memberId)
    );
    return (list || []).map((p) => ({
      ...p,
      speaking: speakingSet.has(p.memberId),
    }));
  };

  useEffect(() => {
    if (!roomId || !me) return;
    let canceled = false;

    const socket = getSocket(
      import.meta.env.MODE === "production"
        ? undefined
        : baseURL || import.meta.env.VITE_SOCKET_URL || "http://localhost:3001",
      { path: "/socket.io", transports: ["websocket"], withCredentials: true }
    );
    socketRef.current = socket;

    // ask helper (ack 기반)
    const ask = (event, data) =>
      new Promise((resolve, reject) => {
        socket.emit(event, data ?? null, (res) => {
          if (res && res.error) return reject(new Error(res.error));
          resolve(res);
        });
      });

    // 참가자/카운트/스피킹 수신
    let lastParticipants = [];
    let lastSpeaking = [];
    const onParticipants = (list) => {
      lastParticipants = list || [];
      setParticipants(mergeSpeaking(lastParticipants, lastSpeaking));
    };
    const onCount = (n) => setUserCount(n || 0);
    const onSpeaking = (speakingList) => {
      lastSpeaking = speakingList || [];
      setParticipants(mergeSpeaking(lastParticipants, lastSpeaking));
    };
    socket.on("voiceRoomParticipants", onParticipants);
    socket.on("userCount", onCount);
    socket.on("speaking-users", onSpeaking);

    // 새 producer → consume
    const getRecvTransport = async (device) => {
      if (recvTransportRef.current) return recvTransportRef.current;
      const info = await ask("createRecvTransport");
      const rt = device.createRecvTransport(info);
      recvTransportRef.current = rt;

      rt.on("connect", ({ dtlsParameters }, cb, errCb) => {
        socket.emit(
          "connectRecvTransport",
          { dtlsParameters, transportId: rt.id },
          (res) => {
            if (res === "ok") cb();
            else errCb(new Error(res?.error || "connectRecvTransport failed"));
          }
        );
      });
      rt.on("connectionstatechange", (s) => {
        if (s === "failed" || s === "disconnected")
          console.warn("recvTransport:", s);
      });
      return rt;
    };

    const onNewProducer = async ({ producerId, socketId }) => {
      if (canceled || !deviceRef.current) return;
      try {
        const rt = await getRecvTransport(deviceRef.current);
        const data = await new Promise((res, rej) => {
          socket.emit(
            "consume",
            {
              rtpCapabilities: deviceRef.current.rtpCapabilities,
              producerSocketId: socketId,
              producerId,
            },
            (reply) => (reply?.error ? rej(new Error(reply.error)) : res(reply))
          );
        });
        const consumer = await rt.consume({
          id: data.id,
          producerId: data.producerId,
          kind: data.kind,
          rtpParameters: data.rtpParameters,
        });

        const audio = new Audio();
        audio.autoplay = true;
        audio.playsInline = true;
        audio.srcObject = new MediaStream([consumer.track]);
        document.body.appendChild(audio);
        producerAudiosRef.current[data.producerId] = { audio };

        try {
          await audio.play();
        } catch {
          setTimeout(() => audio.play().catch(() => {}), 300);
        }
      } catch (e) {
        console.error("consume failed:", e);
      }
    };
    socket.on("newProducer", onNewProducer);

    // 서버가 알려주는 producer 종료 → 오디오 정리
    const onProducerClosed = ({ producerId }) => {
      const entry = producerAudiosRef.current[producerId];
      if (!entry) return;
      try {
        entry.audio.srcObject?.getTracks().forEach((t) => t.stop());
      } catch {
        console.log();
      }
      entry.audio.remove?.();
      delete producerAudiosRef.current[producerId];
    };
    socket.on("producerClosed", onProducerClosed);

    // init: join → device → send transport → produce
    (async () => {
      try {
        await ask("joinRoom", {
          roomId,
          member: {
            memberId: me.memberId,
            name: me.name,
            profile: me.profile || "",
          },
        });
        if (!canceled) setJoined(true);

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        if (canceled) return;
        localStreamRef.current = stream;
        const track = stream.getAudioTracks()[0];

        // speaking 감지(간단 평균)
        const ACtx = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new ACtx();
        const analyser = audioCtx.createAnalyser();
        const src = audioCtx.createMediaStreamSource(stream);
        src.connect(analyser);
        analyser.fftSize = 256;
        const buf = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          if (canceled) return;
          analyser.getByteFrequencyData(buf);
          const avg = buf.reduce((a, b) => a + b, 0) / buf.length;
          const speaking = avg > 15;
          socket.emit("speaking", { roomId, memberId: me.memberId, speaking });
          requestAnimationFrame(tick);
        };
        tick();

        const caps = await ask("getRtpCapabilities");
        const device = new mediasoupClient.Device();
        await device.load({ routerRtpCapabilities: caps });
        deviceRef.current = device;

        const sendInfo = await ask("createTransport");
        const st = device.createSendTransport(sendInfo);
        sendTransportRef.current = st;
        st.on("connect", ({ dtlsParameters }, cb, errCb) => {
          socket.emit("connectTransport", { dtlsParameters }, (res) =>
            res === "ok" ? cb() : errCb(new Error("connectTransport failed"))
          );
        });
        st.on("produce", ({ kind, rtpParameters }, cb) => {
          socket.emit("produce", { kind, rtpParameters }, ({ id, error }) => {
            if (error) return console.error("produce error:", error);
            cb({ id });
          });
        });
        await st.produce({ track });
      } catch (e) {
        console.error("voice init failed:", e);
      }
    })();

    return () => {
      canceled = true;
      setJoined(false);

      socket.emit("leaveRoom", roomId);
      socket.off("voiceRoomParticipants", onParticipants);
      socket.off("userCount", onCount);
      socket.off("speaking-users", onSpeaking);
      socket.off("newProducer", onNewProducer);
      socket.off("producerClosed", onProducerClosed);

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
      try {
        localStreamRef.current &&
          localStreamRef.current.getTracks().forEach((t) => t.stop());
      } catch {
        console.log();
      }
      localStreamRef.current = null;

      Object.values(producerAudiosRef.current).forEach((v) => {
        try {
          v.audio.srcObject &&
            v.audio.srcObject.getTracks().forEach((t) => t.stop());
        } catch {
          console.log();
        }
        v.audio.remove?.();
      });
      producerAudiosRef.current = {};
      socket.disconnect();
    };
  }, [roomId, me, baseURL]);

  return { joined, participants, userCount };
}
