// lib/mediasoup.js 예시
const mediasoup = require("mediasoup");

async function createMediasoupWorkerAndRouter() {
  const min = Number(process.env.RTC_MIN_PORT || 40000);
  const max = Number(process.env.RTC_MAX_PORT || 49999);

  const worker = await mediasoup.createWorker({
    rtcMinPort: min,
    rtcMaxPort: max,
  });

  worker.on("died", () => {
    console.error("mediasoup worker died, exiting in 2s...");
    setTimeout(() => process.exit(1), 2000);
  });

  const router = await worker.createRouter({
    mediaCodecs: [
      {
        kind: "audio",
        mimeType: "audio/opus",
        clockRate: 48000,
        channels: 2,
      },
    ],
  });

  return { worker, router };
}

module.exports = { createMediasoupWorkerAndRouter };
