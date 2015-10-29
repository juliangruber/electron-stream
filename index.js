var spawn = require('child_process').spawn;
var Duplex = require('stream').Duplex;
var PassThrough = require('stream').PassThrough;
var fs = require('fs');
var join = require('path').join;
var inherits = require('util').inherits;
var read = require('stream-read');
var prebuilt = require('electron-prebuilt');
var http = require('http');

var runner = join(__dirname, 'lib', 'runner.js');

module.exports = Electron;
inherits(Electron, Duplex);

function Electron(opts){
  if (!(this instanceof Electron)) return new Electron(opts);
  Duplex.call(this);

  this.opts = opts || {};
  this.source = '';
  this.ps = null;
  this.server = null;
  this.stdall = PassThrough();
  this.stdout = PassThrough();
  this.stdout.pipe(this.stdall);
  this.stderr = PassThrough();
  this.stderr.pipe(this.stdall);
  this.killed = false;

  this.on('finish', this._onfinish.bind(this));
}

Electron.prototype._write = function(chunk, _, done){
  this.source += chunk.toString();
  done();
};

Electron.prototype._read = function(){
  var self = this;
  read(this.stdall, function(err, data){
    if (err) return self.emit('error', err);
    self.push(data);
  });
};

Electron.prototype._onfinish = function(){
  var self = this;
  if (this.killed) return;

  this._listen(function(_, url){
    self._spawn(url);
  });
};

Electron.prototype._spawn = function(url){
  var self = this;
  var ps = self.ps = spawn(prebuilt, [runner], {
    stdio: [null, null, null, 'ipc']
  });

  ps.on('exit', self._exit.bind(self));

  ps.on('message', function(msg){
    switch (msg[0]) {
      case 'ready': ps.send(['init', self.opts]); break;
      case 'initialized': ps.send(['goto', url]); break;
      case 'stdout': self.stdout.write(msg[1]); break;
      case 'stderr': self.stderr.write(msg[1]); break;
    }
  });
};

Electron.prototype._listen = function(cb){
  var self = this;
  var server = http.createServer(function(req, res){
    res.end('<script>' + self.source + '</script>');
  });
  this.server = server;
  server.listen(function(){
    var port = server.address().port;
    cb(null, 'http://localhost:' + port + '/');
  });
};

Electron.prototype.kill = function(){
  if (this.ps) this.ps.kill();
  else this.emit('exit', 0);
  this.killed = true;
};

Electron.prototype._exit = function(code, sig){
  this.stdout.push(null);
  this.stderr.push(null);
  this.server.close();
  this.emit('exit', code, sig);
};
