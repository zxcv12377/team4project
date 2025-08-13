async function createWebRtcTransport(router) {
  const announcedIp = process.env.ANNOUNCED_IP || undefined;

  return await router.createWebRtcTransport({
    listenIps: [{ ip: "0.0.0.0", announcedIp }],
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
    initialAvailableOutgoingBitrate: 1_000_000,
  });
}

module.exports = { createWebRtcTransport };
