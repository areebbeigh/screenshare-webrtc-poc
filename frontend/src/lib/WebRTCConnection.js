import Peer from "simple-peer";

// Singleton to manage peer connections for a session
export default class WebRTCConnectionManager {
  constructor() {
    if (!WebRTCConnectionManager._instance) {
      WebRTCConnectionManager._instance = this;
      this.remotePeers = {};
    }
    return WebRTCConnectionManager._instance;
  }

  createRemotePeer(id, isIntitiator, onSignal) {
    const peer = new Peer({ initiator: isIntitiator });
    this.remotePeers[id] = peer;
    peer.on("signal", onSignal);

    function removePeer() {
      console.log("Removing peer " + id);
      delete this.remotePeers[id];
    }
    peer.on("close", removePeer);
    peer.on("error", (err) => {
      console.error(err);
      removePeer();
    });
    return peer;
  }

  getPeer(id) {
    return this.remotePeers[id];
  }

  resetPeers() {
    console.log("Reseting peers");
    Object.values(this.remotePeers).forEach((p) => p.destroy());
    this.remotePeers = {};
  }
}
