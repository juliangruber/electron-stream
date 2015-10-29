var app = require('app');
var BrowserWindow = require('browser-window');
var ipc = require('ipc');
var join = require('path').join;
var resolve = require('path').resolve;
var parent = require('./ipc')(process);

var win;

app.on('ready', function(){
  win = new BrowserWindow({
    show: false,
    preload: join(__dirname + '/preload.js'),
    'node-integration': false
  });
  
  parent.on('goto', function(path){
    win.loadUrl(path);
    win.openDevTools();
  });

  parent.emit('ready');
});

ipc.on('stdout', function(_, data){
  parent.emit('stdout', data);
});

ipc.on('stderr', function(_, data){
  parent.emit('stderr', data);
});
