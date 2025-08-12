const min = Number(process.env.RTC_MIN_PORT || 40000);
const max = Number(process.env.RTC_MAX_PORT || 49999);
const announcedIp = process.env.ANNOUNCED_IP || undefined;

async function createWebRtcTransport(router) {
  return await router.createWebRtcTransport({
    listenIps: [{ ip: "0.0.0.0", announcedIp}],
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
    initialAvailableOutgoingBitrate: 1_000_000,
  });
}

module.exports = { createWebRtcTransport };
