(function() {

  window.piCamStream = {
    streamSocket: null,
    sessionStart: Date.now(),
    connected: false,

    init: function() {
      this.connected = this.connectStreamSocket();
      if (!this.connected) {
        alert('Could not connect to stream. Sorry :-(');
        return;
      }

      this.streamSocket.send('ready', { start: this.sessionStart });
    },

    connectStreamSocket: function() {
      if (!SocketServer) return false;
      this.streamSocket = new SocketServer({
        connectCallback: this.connectHandler,
        disconnectCallback: this.disconnectHandler,
        drawHandler: this.drawHandler
      });

      return !!this.streamSocket.connection;
    },

    connectCallback: function(socket) {
      // show opening frames
    },

    disconnectCallback: function(socket) {

    },

    drawHandler: function(method, data) {
      if (method === 'newFrame') {
        this.streamJPEGDataToCanvas(data);
      }
    },

    streamJPEGDataToCanvas: function(rawJPEG) {

    }
  };

})();

$(document).ready(function() {
  piCamStream.init();
});