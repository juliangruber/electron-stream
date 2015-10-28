
# electron-stream

  Write JavaScript to `electron`, get console output back!

## Example

```js
var electron = require('electron-stream');

var browser = electron();

browser.stdout.pipe(process.stdout);
browser.stderr.pipe(process.stderr);

browser.write('console.log(window.location.href)');
browser.write('window.close();');
browser.end();
```

## Installation

```bash
$ npm install electron-stream
```

## API

### electron([path])

Create a writable stream around a newly spawned `electron` which forwards written data to `electron`.

Specify `path` to provide a custom executable path, useful for example with [electron-prebuilt](https://npmjs.org/package/electron-prebuilt):

```js
var prebuilt = require('electron-preubilt');
var electron = require('electron-stream');

var browser = electron(prebuilt);
```

### electron#stdout
### electron#stderr

Readable streams containing the console output. `console.log` will be forwarded to `.stdout`, `console.error` to `.stderr`

### electron#kill()

Kill the child process.

### electron#on('exit', fn)

Emitted when the underlying `electron` exits. There can be multiple reasons for this:

- `electron#kill()` was called
- `window.close()` was sent as a script
- there was a fatal error

## License

  MIT

