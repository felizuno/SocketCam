var ws = require("ws");
var port = 9999;
var socketServer = new ws.Server({port: port});

socketServer.on("connection", function(socket) {
  cameraServer.addClient(socket);
});

var cameraServer = {
  _clients: [],

  addClient: function(socket) {
    _clients.push(new Client(socket));
    console.log('New client, total is ' + this._clients.length);
  },

  removeUser: function(client) {
    this._clients.splice(this._clients.indexOf(client), 1, 0);
    console.log('Lost client, total is ' + this._clients.length);
  }
};


var Client = function(socket) {
  this.socket = socket;
  this.socket.on('close', function() { cameraServer.removeUser(this); });
};

console.log('Socket server listening on port ' + port );
