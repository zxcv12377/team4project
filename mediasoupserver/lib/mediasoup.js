const mediasoup = require("mediasoup");

async function createMediasoupWorkerAndRouter() {
  const worker = await mediasoup.createWorker();
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
