var spawn = require('child_process').spawn;
var Writable = require('stream').Writable;
var PassThrough = require('stream').PassThrough;
var fs = require('fs');
var tmpdir = require('os').tmpdir;
var join = require('path').join;
var inherits = require('util').inherits;
var kill = require('tree-kill');

module.exports = Electron;
inherits(Electron, Writable);

function Electron(path){
  if (!(this instanceof Electron)) return new Electron(path);
  Writable.call(this);

  this.source = '';
  this.ps = null;
  this.stdout = PassThrough();
  this.stderr = PassThrough();
  this.killed = false;
  this.path = path || 'electron';

  this.on('finish', this._onfinish.bind(this));
}

Electron.prototype._write = function(chunk, _, done){
  this.source += chunk.toString();
  done();
};

Electron.prototype._onfinish = function(){
  if (this.killed) return;

  var self = this;
  var rand = Math.random().toString(16).slice(2);
  var file = join(tmpdir(), 'electron-stream:' + rand);

  fs.writeFile(file, self.source, function(err){
    if (self.killed) return;
    if (err) return dup.emit('error', err);

    var ps = self.ps = spawn(self.path, [join(__dirname, 'script.js'), file]);
    ps.stdout.pipe(self.stdout);
    ps.stderr.pipe(self.stderr);
    ps.on('exit', self.emit.bind(self, 'exit'));
  });
};

Electron.prototype.kill = function(){
  if (this.ps) this.ps.kill();
  else this.emit('exit', 0);
  this.killed = true;
};

