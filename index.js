var spawn = require('child_process').spawn;
var Duplex = require('stream').Duplex;
var PassThrough = require('stream').PassThrough;
var fs = require('fs');
var tmpdir = require('os').tmpdir;
var join = require('path').join;
var inherits = require('util').inherits;
var read = require('stream-read');
var ipc = require('./ipc');
var prebuilt = require('electron-prebuilt');
var fmt = require('util').format;
var http = require('http');

module.exports = Electron;
inherits(Electron, Duplex);

function Electron(){
  if (!(this instanceof Electron)) return new Electron();
  Duplex.call(this);

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
  if (this.killed) return;
  this._spawn();
};

Electron.prototype._spawn = function(){
  var self = this;

  var server = self.server = http.createServer(function(req, res){
    res.end('<script>' + self.source + '</script>');
  });
  server.listen(function(){
    var port = server.address().port;

    var ps = self.ps = spawn(
      prebuilt,
      [join(__dirname, 'script.js')],
      { stdio: [null, null, null, 'ipc'] }
    );

    ps.on('exit', self._exit.bind(self));

    var child = ipc(ps);

    child.on('ready', function(){
      child.emit('goto', 'http://localhost:' + port + '/');
    });

    child.on('stdout', self.stdout.write.bind(self.stdout));
    child.on('stderr', self.stderr.write.bind(self.stderr));
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
