var ws = require("ws");
var port = 9999;
var socketServer = new ws.Server({port: port}); 

socketServer.on("connection", function(socket) {
  cameraServer.addClient(socket);
});

var cameraServer = {
  addClient: function(socket) {

  }
};
