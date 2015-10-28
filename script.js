var app = require('app');
var BrowserWindow = require('browser-window');
var ipc = require('ipc');
var join = require('path').join;
var resolve = require('path').resolve;

var source = 'file://' + join(__dirname, 'script.html?source=' + resolve(process.argv[2]));

app.on('ready', function(){
  var mainWindow = new BrowserWindow({
    show: false
  });
  mainWindow.loadUrl(source);
  mainWindow.openDevTools();
});

ipc.on('stdout', function(_, data){
  console.log.apply(null, data);
});

ipc.on('stderr', function(_, data){
  console.error.apply(null, data);
});
