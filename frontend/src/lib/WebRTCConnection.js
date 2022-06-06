// I would have to react-scripts eject to solve this properly. Too lazy.
// https://github.com/feross/simple-peer/issues/183
const Peer = window.SimplePeer;

// Singleton to manage peer connections for a session
export default class WebRTCConnectionManager {
  constructor() {
    if (!WebRTCConnectionManager._instance) {
      WebRTCConnectionManager._instance = this;
      this.remotePeers = {};
      this.newPeerCallbacks = [];
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

    this.newPeerCallbacks.forEach((cb) => cb(peer));
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

  listPeers() {
    return Object.values(this.remotePeers);
  }

  onNewPeer(callback) {
    this.newPeerCallbacks.push(callback);
    this.listPeers().forEach(callback);
  }
}
