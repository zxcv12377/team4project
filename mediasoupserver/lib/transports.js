const listenIps = [{ ip: "127.0.0.1", announcedIp: null }];

async function createWebRtcTransport(router) {
  return await router.createWebRtcTransport({
    listenIps,
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
  });
}

module.exports = { createWebRtcTransport };
