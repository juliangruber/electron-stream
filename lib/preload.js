var {ipcRenderer: ipc} = require('electron');

const format = (...args) => {
  return args.join(' ');
}

const { log, error } = console
console.log = function(...args){
  var data = format(...args) + '\n';
  ipc.send('stdout', data);
  log(...args);
}
console.error = function(...args){
  var data = format(...args) + '\n';
  ipc.send('stderr', data);
  error(...args);
}

window.onerror = function(msg, file, line, column, err){
  if (err && msg.indexOf(err.stack) > -1) {
    err.stack = err.stack + '\n  at ' + file + ':' + line + ':' + column
  }
  console.error(err.stack);
  window.close();
}
