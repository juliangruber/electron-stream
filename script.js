var app = require('app');
var BrowserWindow = require('browser-window');
var ipc = require('ipc');
var join = require('path').join;
var resolve = require('path').resolve;

var win;

app.on('ready', function(){
  win = new BrowserWindow({
    show: false,
    preload: join(__dirname + '/preload.js'),
    'node-integration': false
  });
  
  process.on('message', function(msg){
    win.loadUrl(msg[1]);
  });

  process.send(['ready']);
});

ipc.on('stdout', function(_, data){
  process.send(['stdout', data]);
});

ipc.on('stderr', function(_, data){
  process.send(['stderr', data]);
});
