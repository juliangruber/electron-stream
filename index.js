var spawn = require('child_process').spawn;
var Duplex = require('stream').Duplex;
var PassThrough = require('stream').PassThrough;
var fs = require('fs');
var join = require('path').join;
var inherits = require('util').inherits;
var read = require('stream-read');
var electron = require('electron');
var debug = require('debug')('electron-stream');
var stringify = require('json-stringify-safe');

var runner = join(__dirname, 'lib', 'runner.js');

module.exports = Electron;
inherits(Electron, Duplex);

function Electron(opts){
  if (!(this instanceof Electron)) return new Electron(opts);
  Duplex.call(this);

  this.opts = opts || {};
  this.opts.nodeIntegration = this.opts.nodeIntegration || this.opts.node;
  this.source = new PassThrough();
  this.basedir = this.opts.basedir || process.cwd();
  this.sourceFile = join(this.basedir, '.source.' + Date.now() + '.html');
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
  this.source.push(chunk);
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
  this.source.push(null);

  this._createSourceUrl(function(url){
    self._spawn(url);
  });
};

Electron.prototype._spawn = function(url){
  debug('spawn %s', url);

  var self = this;
  var ps = self.ps = spawn(electron, [runner], {
    stdio: [null, null, null, 'ipc']
  });

  ps.on('exit', self._exit.bind(self));

  ps.on('message', function(msg){
    switch (msg[0]) {
      case 'ready': ps.send(['init', stringify(self.opts)]); break;
      case 'initialized': ps.send(['goto', url]); break;
      case 'stdout': self.stdout.write(msg[1]); break;
      case 'stderr': self.stderr.write(msg[1]); break;
    }
  });
};

Electron.prototype._createSourceUrl = function(cb){
  var self = this;
  var ws = fs.createWriteStream(this.sourceFile);
  ws.write('<script>');
  this.source
    .on('end', function () {
      ws.on('finish', function(){
        cb('file://' + self.sourceFile);
      });
      ws.end('</script>');
    })
    .pipe(ws, { end: false });
};

Electron.prototype.kill = function(){
  if (this.ps) this.ps.kill();
  else this.emit('exit', 0);
  this.killed = true;
};

Electron.prototype._exit = function(code, sig){
  var self = this;
  fs.unlink(this.sourceFile, function (err) {
    if (err) return self.emit('error', err);
    self.stdout.push(null);
    self.stderr.push(null);
    debug('exit %s %s', code, sig);
    self.emit('exit', code, sig);
  })
};
