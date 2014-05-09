/// Basic structure from Ian Gilman
/// Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
var socketUrl = "ws://< RASPBERRY PI IP ADDRESS >:9999";

window.SocketServer = function(cfg) {
  var noOp = function() { return false; },
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

  this.connection = null;
};

SocketServer.prototype = {
  send: function(method, data, next) {
    if (method == "connect") {
      var SupportedSocket = window.WebSocket || window.MozWebSocket;
      if (SupportedSocket) {
        this.connection = new SupportedSocket(socketUrl);
        this.bindMessageHandlers();
      }
      
      data.code = (SupportedSocket) ? "success" : "failure";
      next(data);
    } else if (method == "message") {
      if (this.connection && this.connection.readyState != 1) return;
      this.connection.send(JSON.stringify({ method: method, data: data }));
    }
  },

  bindMessageHandlers: function(data, next) {
    this.connection.onopen = function() {
      this.connectCallback(this);
    };
    
    this.connection.onmessage = function(event) { 
      var envelope = JSON.parse(event.data);
      this.drawHandler(envelope.method, envelope.data);
    };
    
    this.connection.onclose = function(event) { 
      data.code = "failure";
      next(data);
    };
  },
};
