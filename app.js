// ===============================================
// =========== Dependencies
// ===============================================


var http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs"),
    ws = require("ws"),
    BinaryServer = require('binaryjs').BinaryServer,
    BinaryClient = require('binaryjs').BinaryClient,
    spawn = require('child_process').spawn,
    EventEmitter = require('events').EventEmitter;

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
// =========== Binary Server
// ===============================================


var binaryServer = BinaryServer({
  server: socketServer
});


// ===============================================
// =========== App
// ===============================================


var cameraServer = {
  _childProcess: null,
  _clients: [],
  broadcaster: new EventEmitter(),

  startCapture: function() {
    console.log('\n\n\nStarting video capture!');

    var self = this,
        counter = 0,
        stdoutHandler = function(data) {
          self.broadcaster.emit('frame', data);
          console.log('[ stdout ] DATA EVENT', ++counter);
        },
        endHandler = function() {
          self.broadcaster.emit('end');
        },
        childProcess = spawn('raspivid', ['-p', '200,0,400,300', '-t', '10000', '-o', '-' ]);

    this._childProcess = childProcess;
    childProcess.stdout.on('data', stdoutHandler);
    childProcess.stdout.on('end', endHandler);
  },

  stopCapture: function() {
    this._childProcess.kill();
    this._childProcess = null;
    this.broadcaster.removeAllListeners('frame');
  },

  addClient: function(socket) {
    var client = new BinaryClient(socket);
    this._clients.push(client);
    console.log('Client total is ' + this._clients.length);

    var clientStream = client.createStream('video');
    this.broadcaster.addListener('frame', function(data) {
      clientStream.write(data, 'video');
    });

    this.broadcaster.addListener('end', function(data) {
      clientStream.close();
    });


    client.on('close', this.removeClient.bind(this, client));

    this.pokeCamera();
  },

  removeClient: function(client) {
    var index = this._clients.indexOf(client);
    if (index === -1) {
      console.log('OH NO! Could not find client to disconnect them!');
      this._clients = [];
      this.stopCapture(); // to prevent infinite capture
      return false;
    }

    this._clients = this._clients.splice(index, 1, 0);
    console.log('Lost client, total is ' + this._clients.length);

    if (this._clients.length === 0) this.stopCapture();
    return true;
  },

  pokeCamera: function() {
    if (this._childProcess === null && this._clients.length > 0) {
      this.startCapture();
    }
  }
};

// ===============================================
// =========== Boot Logging
// ===============================================


console.log('\n\n\nSocket server listening on port ' + socketPort );
console.log('\nHTTP server listening on port ' + httpPort );
console.log('\n\n\n ctrl+c to stop');
