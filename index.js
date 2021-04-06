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
var http = require('http');
var tempy = require('tempy');
var ecstatic = require('ecstatic');

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
  this.sandbox = this.opts.sandbox !== false;
 
  // nodeIntegration requires the sourcefile to be in the cwd, but otherwise it should be a temp file.
  this.sourceFile = this.opts.nodeIntegration
    ? join(this.basedir, '.source.' + Date.now() + '.' + Math.random() + '.html')
    : tempy.file({extension: 'html'});

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
  var cb = this._spawn.bind(this)
  if (this.killed) return;
  this.source.push(null);

  // Use existing http(s) server with {loc: 'http://url'},
  // this skips creating inner http server in _createSourceUrl.
  // Use name "loc" because it's the property browser-run uses.
  if (this.opts.loc) {
    return cb(this.opts.loc);
  }

  if (this.opts.nodeIntegration) {
    return this._createNodeUrl(cb)
  }

  this._createSourceUrl(cb);
};

Electron.prototype._spawn = function(url){
  debug('spawn %s', url);

  const self = this;
  const args = [runner];
  if (!this.sandbox) args.push('--no-sandbox');

  const ps = self.ps = spawn(electron, args, {
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

  // these event callbacks below will display the output and/or error 
  // streams from an optional background process like Xvfb when running
  // headless in a container, otherwise electron can fail silently
  const stderr = [];
  ps.stderr.on('data', function(data) {
    stderr.push(data)
  });

  ps.on('close', function(code) {
    if (stderr.length) {
      self.emit('error', new Error(stderr.join('').trim()))
    }
  })
};

Electron.prototype._createNodeUrl = function(cb){
  var self = this;
  var ws = fs.createWriteStream(this.sourceFile);
  ws.write('<!DOCTYPE html><meta charset="utf8"><body><script>');
  ws.on('finish', function(){
    if (self.opts.nodeIntegration) return cb('file://' + self.sourceFile);
  })
  this.source
    .on('end', () => ws.end('</script></body>'))
    .pipe(ws, { end: false })
};

Electron.prototype._createSourceUrl = function(cb){
  var self = this;
  var ws = fs.createWriteStream(this.sourceFile);
  self.source.pipe(ws);
  ws.on('finish', function() {
    if (self.opts.nodeIntegration) return cb('file://' + self.sourceFile);
    self._startServer()
    self.server.listen(function(){
      cb('http://localhost:' + this.address().port);
    });
  });
};

Electron.prototype._startServer = function(){
  var self = this;
  function serveHTML(res){
    res.setHeader('Content-Type', 'text/html');
    res.end(`<!DOCTYPE html><meta charset="utf8"><body><script src="/bundle.js"></script></body>`);
  }
  self.server = http.createServer(function(req, res){
    if (req.url == '/bundle.js') {
      res.setHeader('Content-Type', 'application/js');
      fs.createReadStream(self.sourceFile).pipe(res);
      return;
    }
    if (self.opts.static) {
      ecstatic({
        root: self.opts.static,
        handleError: false,
        showDir: false
      })(req, res, function(err){
        serveHTML(res);
      })
      return;
    }
    serveHTML(res);
  });
}

Electron.prototype._cleanup = function(){
  if (this.server) this.server.close();
  fs.unlink(this.sourceFile, function (){});
}

Electron.prototype.kill = function(){
  this._cleanup();
  if (this.ps) this.ps.kill();
  else this.emit('exit', 0);
  this.killed = true;
};

Electron.prototype._exit = function(code, sig){
  var self = this;
  this._cleanup();
  self.stdout.push(null);
  self.stderr.push(null);
  debug('exit %s %s', code, sig);
  self.emit('exit', code, sig);
};
