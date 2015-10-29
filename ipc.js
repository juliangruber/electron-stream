var EventEmitter = require('events').EventEmitter;

module.exports = function(proc){
  var ee = new EventEmitter;
  var emit = ee.emit;
  proc.on('message', function(data){
    emit.apply(ee, [].slice.call(data));
  });
  ee.emit = function(){
    proc.send([].slice.call(arguments));
  };
  return ee;
}
