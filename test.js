var electron = require('./');
var test = require('tape');
var concat = require('concat-stream');
var fs = require('fs');
var http = require('http');

test('stdout', function(t){
  var browser = electron();

  browser.stdout.on('data', function(l){
    t.equal(l.toString(), 'log\n');
    t.end();
  });

  browser.end('console.log("log");window.close()');
});

test('stderr', function(t){
  var browser = electron();

  browser.stderr.on('data', function(l){
    t.equal(l.toString(), 'error\n');
    t.end();
  });

  browser.end('console.error("error");window.close()');
});

test('stdall', function(t){
  var browser = electron();

  browser.stdall.pipe(concat(function(data){
    t.ok(data.toString().indexOf('log') > -1);
    t.ok(data.toString().indexOf('error') > -1);
    t.end();
  }));

  browser.write('console.log("log");');
  browser.write('console.error("error");');
  browser.end('window.close();');
});


test('duplex', function(t){
  var browser = electron();

  browser.pipe(concat(function(data){
    t.ok(data.toString().indexOf('log') > -1);
    t.ok(data.toString().indexOf('error') > -1);
    t.end();
  }));

  browser.write('console.log("log");');
  browser.write('console.error("error");');
  browser.end('window.close();');
});

test('exit event', function(t){
  var browser = electron();

  browser.on('exit', function(code){
    t.equal(code, 0);
    t.end();
  });

  browser.end('window.close()');
});

test('early kill', function(t){
  var browser = electron();

  browser.on('exit', function(code){
    t.equal(code, 0);
    t.end();
  });

  browser.kill();
});

test('kill', function(t){
  var browser = electron();

  browser.on('exit', function(code){
    t.equal(code, 0);
    t.end();
  });

  browser.end('console.log("foo")');
  browser.kill();
});

test('uncaught error', function(t){
  var browser = electron();

  browser.stderr.pipe(concat(function(data){
    var out = data.toString();
    t.ok(out.indexOf('Error') > -1);
    t.ok(out.indexOf(':1') > -1);
    t.end();
  }));

  browser.end('throw new Error(\'bar\')');
});

test('http protocol', function(t){
  var browser = electron();
  browser.pipe(concat(function(data){
    t.equal(data.toString(), 'http:\n');
    t.end();
  }));
  browser.end('console.log(location.protocol);window.close();');
});

test('no node integration', function(t){
  var browser = electron();
  browser.pipe(concat(function(data){
    t.ok(data.toString().indexOf('ReferenceError') > -1);
    t.end();
  }));
  browser.end('console.log(!!process.version);window.close();');
});

test('node integration', function(t){
  var browser = electron({
    nodeIntegration: true
  });
  browser.pipe(concat(function(data){
    t.equal(data.toString(), 'true\n');
    t.end();
  }));
  browser.end('console.log(!!process.version);window.close();');
});

test('support opts.loc for existing http server', function(t){
  var server = http.createServer((req, res) => {
    if (/^\/bundle\.js/.test(req.url)) {
      res.setHeader('content-type', 'application/javascript');
      res.setHeader('cache-control', 'no-cache');
      res.end('console.log("hello");window.close();');
      return;
    }

    if (req.url == '/') {
      res.setHeader('Content-Type', 'text/html');
      res.end(`<!DOCTYPE html><meta charset="utf8"><body><script src="/bundle.js"></script></body>`);
      return;
    }
  });

  server.listen(8000);

  var browser = electron({
    loc: 'http://localhost:8000'
  });

  browser.pipe(concat(function(data){
    t.equal(data.toString(), 'hello\n');

    server.close(function() {
      t.end();
    });
  }));
  browser.end();
});

test('require node modules', function(t){
  var browser = electron({
    nodeIntegration: true,
    basedir: __dirname
  });
  browser.pipe(concat(function(data){
    t.equal(data.toString(), 'true\n');
    t.end();
  }));
  browser.end('console.log(!!require.resolve("tape"));window.close();');
});

test('circular structure in opts', function(t){
  var o = {}
  o.o = o

  var browser = electron(o);
  browser.pipe(concat(function(data){
    t.equal(data.toString(), 'true\n');
    t.end();
  }));
  browser.end('console.log(true);window.close();');
});

test('access document.body', function(t){
  var browser = electron();
  browser.pipe(concat(function(data){
    t.equal(data.toString(), 'true\n');
    t.end();
  }));
  browser.end('console.log(!!document.body);window.close();');
});

test('utf8', function(t){
  var browser = electron();
  browser.pipe(concat(function(data){
    t.equal(data.toString(), 'ಠ\n');
    t.end();
  }));
  browser.end('var ಠ = "ಠ";console.log(ಠ);window.close();');
});

test('closing scripts do not break', function(t){
  var browser = electron();
  browser.pipe(concat(function(data){
    t.equal(data.toString(), '</script>\n');
    t.end();
  }));
  browser.end('console.log("</script>");window.close();');
});

test('static', function(t){
  var browser = electron({ static: __dirname });
  browser.pipe(concat(function(data){
    t.equal(data.toString().trim(), fs.readFileSync(`${__dirname}/test.js`).toString().trim());
    t.end();
  }));
  browser.end('fetch("/test.js").then(res => res.text()).then(text => {console.log(text); window.close()});');
})

test('supports async functions', function(t){
  var browser = electron();
  browser.pipe(concat(function(data){
    t.equal(data.toString(), 'ok\n');
    t.end();
  }));
  browser.end('const f=async()=>\'ok\';f().then(t=>{console.log(t);window.close()});');
});

test('supports async generators', function(t){
  var browser = electron();
  browser.pipe(concat(function(data){
    t.equal(data.toString(), 'ok\n');
    t.end();
  }));
  browser.end('async function* f(){yield \'ok\'};f().next().then(o=>{console.log(o.value);window.close()});');
});
