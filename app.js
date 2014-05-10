// ===============================================
// =========== Dependencies
// ===============================================


var http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs"),
    ws = require("ws"),
    spawn = require('child_process').spawn;


// ===============================================
// =========== HTTP Server
// ===============================================
// From: https://gist.github.com/rpflorence/701407
// ===============================================


var httpPort = process.argv[2] || 8888;
http.createServer(function(request, response) {

  var uri = url.parse(request.url).pathname,
      filename = path.join(process.cwd(), uri);
  
  path.exists(filename, function(exists) {
    if(!exists) {
      response.writeHead(404, {"Content-Type": "text/plain"});
      response.write("404 Not Found\n");
      response.end();
      return;
    }

    if (fs.statSync(filename).isDirectory()) filename += '/index.html';

    fs.readFile(filename, "binary", function(err, file) {
      if(err) {        
        response.writeHead(500, {"Content-Type": "text/plain"});
        response.write(err + "\n");
        response.end();
        return;
      }

      response.writeHead(200);
      response.write(file, "binary");
      response.end();
    });
  });
}).listen(parseInt(httpPort, 10));


// ===============================================
// =========== Socket Server
// ===============================================


var socketPort = 9999,
    socketServer = new ws.Server({port: socketPort});

socketServer.on("connection", function(socket) {
  cameraServer.addClient(socket);
});


// ===============================================
// =========== App
// ===============================================


var cameraServer = {
  _clients: [],

  startCapture: function() {
    var counter = 0,
        stdoutHandler = function(err, stdout, stderr) {
          if (err) console.log ('you set it up wrong', err);
          console.log('[ stdout ] DATA EVENT', counter++);
        },
        endHandler = function(data) {
          console.log('[ STDOUT END ]');
        },
        childProcess = spawn('raspivid -t 1000 -o - ');

    childProcess.stdout.on('data', stdoutHandler);
    childProcess.stdout.on('end', endHandler);
  },

  stopCapture: function() {

  },

  addClient: function(socket) {
    _clients.push(new Client(socket));
    console.log('New client, total is ' + this._clients.length);
  },

  removeClient: function(client) {
    this._clients.splice(this._clients.indexOf(client), 1, 0);
    console.log('Lost client, total is ' + this._clients.length);
  },

  broadcast: function(data) {
    this._clients.forEach(function(client) { client.sendStream(data); });
  }
};

var Client = function(socket) {
  this.socket = socket;
  this.openendOn = Date.now();
  this.socket.on('close', function() { cameraServer.removeUser(this); });
};

Client.prototype = {
  sendStream: function(data) {
    this.socket.send(JSON.stringify({ method: 'newFrame', data: data }));
  }
};


// ===============================================
// =========== Boot Logging
// ===============================================


console.log('\n\n\nSocket server listening on port ' + socketPort );
console.log('\nHTTP server listening on port ' + httpPort );
console.log('\n\n\n ctrl+c to stop');

console.log('\n\n\nStarting video capture!');
cameraServer.startCapture();
