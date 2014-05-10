/// Basic structure from Ian Gilman
/// Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
var socketUrl = "ws://< RASPBERRY PI IP ADDRESS >:9999";

window.SocketServer = function(cfg) {
  var SupportedSocket = window.WebSocket || window.MozWebSocket,
      noOp = function() { return false; },
      defaults = {
        connectCallback: noOp,
        disconnectCallback: noOp,
        drawHandler: noOp
      };

  this.callbacks = (cfg.connectCallback 
    && cfg.disconnectCallback 
    && cfg.drawHandler)
    ? cfg
    : defaults;

  this.connection = (SupportedSocket)
    ? new SupportedSocket(socketUrl)
    : null;
    
  if (socketServer) this.bindMessageHandlers();
};

SocketServer.prototype = {
  send: function(method, data) {
    if (this.connection && this.connection.readyState != 1) return;
    this.connection.send(JSON.stringify({ method: method, data: data }));
  },

  bindMessageHandlers: function(data) {
    this.connection.onopen = function() {
      this.callbacks.connectCallback(this);
    };
    
    this.connection.onmessage = function(event) { 
      var envelope = JSON.parse(event.data);
      this.callbacks.drawHandler(envelope.method, envelope.data);
    };
    
    this.connection.onclose = function(event) { 
      this.callbacks.disconnectCallback(this);
    };
  },
};
