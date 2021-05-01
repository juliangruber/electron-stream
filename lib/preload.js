(function(){
  var {ipcRenderer: ipc} = require('electron');
  var {format: fmt} = require('util');

  var log = console.log;
  console.log = function(){
    var data = fmt.apply(null, arguments) + '\n';
    ipc.send('stdout', data);
    log.apply(console, arguments);
  };

  var error = console.error;
  console.error = function(){
    var data = fmt.apply(null, arguments) + '\n';
    ipc.send('stderr', data);
    error.apply(console, arguments);
  };

  window.onerror = function(msg, file, line, column, err){
    // Much of the complexity of this function is derived from the possible
    // historic uses of .onerror in scripts/code.
    // We can not assume that any of the arguments are given.
    // The type for msg is :any, but likely: string | ErrorEvent | Event
    var type = 'Unhandled error:';
    if (msg instanceof ErrorEvent) {
      // ErrorEvent that should (experimental?) hold the error in the the
      // .error property, which is likely more informative than the information
      // on the error event.
      // see: https://developer.mozilla.org/en-US/docs/Web/API/ErrorEvent
      type = 'Unhandled ErrorEvent:';
      err = err || msg.error || msg.message;
      file = file || msg.filename;
      line = line || msg.lineno;
      column = column || msg.colno;
    }
    var args;
    if (err) {
      args = [type, err.stack || err.message || err];
    } else if (msg instanceof Event) {
      // Unhandled type="error" events (which are not ErrorEvent's) are also
      // processed by the window.onerror hook. These error events get usually
      // rendered as: `Event { isTrusted: [Getter] }` which doesn't help all
      // that much, which is why we add `"${msg}"` stringifies the event which
      // will look like `Event { isTrusted: [Getter] } "[object Event]"`.
      // To make use of it, a developer may extend the `.toString()` method of
      // the custom event and give some hints as to *what* error occured, ex.:
      // `Event { isTrusted: [Getter] } "[CloseEvent code=502]".
      args = ['Unhandled "error"-event:', msg, '"' + msg + '"'];
    } else {
      args = ['Unhandled error:', msg];
    }
    args.push('\n at');
    var location;
    if (file) {
      location = file;
      if (typeof line === 'number') {
        location += ':' + line;
        if (typeof column === 'number') {
          location += ':' + column;
        }
      }
    } else if (msg instanceof Event) {
      location = msg.target;
    } else {
      location = '<unknown location>';
    }
    args.push(location);
    console.error.apply(console, args);
    window.close();
  }
})();
