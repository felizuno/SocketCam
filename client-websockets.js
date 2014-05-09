/// More or less unchanged, credit to Ian Gilman
/// Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php

window.SocketServer = function(callback) {
  this.callback = callback;
  this.connection = null;
};

SocketServer.prototype = {
  send: function(method, data, next) {
    var self = this;
    if (method == "connect") {
      var SupportedSocket = window.WebSocket || window.MozWebSocket;
      if (SupportedSocket) {
        var url = "ws://< RASPBERRY PI IP ADDRESS >:9999";
        this.connection = new SupportedSocket(url);
        this.bindMessageHandlers();
      }
      
      data.code = (SupportedSocket) ? "success" : "failure";
      next(data);
    } else if (method == "message") {
      if (this.connection.readyState != 1) return;
      this.connection.send(JSON.stringify({ method: method, data: data }));
    }
  },

  bindMessageHandlers: function(data, next) {
    this.connection.onopen = function() { 
      // self.connection.send(JSON.stringify({
      //   method: "memberEnter", 
      //   data: data
      // }));
    };
    
    this.connection.onmessage = function(event) { 
      var envelope = JSON.parse(event.data);
      self.callback(envelope.method, envelope.data);
    };
    
    this.connection.onclose = function(event) { 
      data.code = "failure";
      next(data);
    };
  },
};
