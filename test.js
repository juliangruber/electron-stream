var electron = require('./');
var test = require('tape');
var concat = require('concat-stream');

test('stdout', function(t){
  var browser = electron();

  browser.stdout.on('data', function(l){
    t.ok(l.toString().indexOf('file') > -1);
    t.end();
  });

  browser.end('console.log(window.location.href);window.close()');
});

test('stderr', function(t){
  var browser = electron();

  browser.stderr.on('data', function(l){
    t.ok(l.toString().indexOf('file') > -1);
    t.end();
  });

  browser.end('console.error(window.location.href);window.close()');
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

