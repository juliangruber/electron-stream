(function(){
  var ipc = require('ipc');
  var fmt = require('util').format;

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

  window.onerror = function(_, _, _, _, err){
    console.error(err.stack);
    window.close();
  }
})();
