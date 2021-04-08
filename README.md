
# electron-stream

  Write JavaScript to `electron`, get console output back!

  [![travis](https://travis-ci.org/juliangruber/electron-stream.svg?branch=master)](https://travis-ci.org/juliangruber/electron-stream)
  [![downloads](https://img.shields.io/npm/dm/electron-stream.svg)](https://www.npmjs.org/package/electron-stream)

## Example

  Boot a hidden electron instance, log to stdout and clean up:

```js
var electron = require('electron-stream');

var browser = electron();

browser.pipe(process.stdout);

browser.write('console.log(window.location.href);');
browser.write('window.close();');
browser.end();
```

  Alternatively, use an existing http server. Note you cannot write to electron-stream when outside http server is in use.

```js
var electron = require('electron-stream');
var http = require('http');

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
var browser = electron({ loc: 'http://localhost:8000' });
browser.pipe(process.stdout);
browser.end();

```

## Output streams

`electron-stream` lets you read all of the console output together, or split up into `stdout` and `stderr`:

```js
// console.log and console.error
browser.pipe(...);
browser.stdall.pipe(...);

// console.log only
browser.stdout.pipe(...);

// console.error only
browser.stderr.pipe(...);
```

## Installation

  To install as a library:

```bash
$ npm install electron-stream
```

  To install as a binary:

```bash
$ npm install -g electron-stream
$ echo "console.log('foo');window.close()" | electron-stream
```

## Travis

To use electron on travis, add this to your travis.yml:

```yml
addons:
  apt:
    packages:
      - xvfb
install:
  - export DISPLAY=':99.0'
  - Xvfb :99 -screen 0 1024x768x24 > /dev/null 2>&1 &
  - npm install
```

[Source](https://github.com/rhysd/Shiba/blob/055a11a0a2b4f727577fe61371a88d8db9277de5/.travis.yml).

## API

### electron([opts])

Create a writable stream around a newly spawned `electron` which forwards written data to `electron`. This module bundles [electron-prebuilt](https://npmjs.org/package/electron-prebuilt).

Options:

  - `show`: Show the electron window. Defaults to `false`.
  - `node`:  Enable node integration. Defaults to `false`.
  - `basedir`: Set this if you need to require node modules in `node` mode
  - `static`: Serve static files from this directory at `/`
  - `loc`: a full url like `http://localhost:8080/` for using an existing http server. When `loc` is supplied, options `node`, `basedir`, and `static` are all ignored.
  - `sandbox`: Run electron with sandbox. Disable to emit debug information when using Docker. Defaults to `true`.
  
### electron#stdout
### electron#stderr
### electron#stdall

Readable streams containing the console output. `console.log` will be forwarded to `.stdout`, `console.error` to `.stderr`. `.stdall` has them both.

### electron#kill()

Kill the child process.

### electron#on('exit', fn)

Emitted when the underlying `electron` exits. There can be multiple reasons for this:

- `electron#kill()` was called
- `window.close()` was sent as a script
- there was a fatal error

## License

  MIT
