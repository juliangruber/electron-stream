var app = require('electron').app;
var BrowserWindow = require('browser-window');
var ipc = require('electron').ipcMain;
var join = require('path').join;
var resolve = require('path').resolve;

var win;
var preload = join(__dirname, 'preload.js');

app.on('ready', function(){
  process.on('message', function(msg){
    switch (msg[0]) {
      case 'init':
        var opts = msg[1];
        win = new BrowserWindow({
          show: opts.show || false,
          webPreference: {
            preload: preload
          },
          nodeIntegration: opts['node-integration'] || false
        });
        process.send(['initialized']);
        break;
      case 'goto':
        win.loadURL(msg[1]);
        break;
    }
  });

  process.send(['ready']);
});

ipc.on('stdout', function(_, data){
  process.send(['stdout', data]);
});

ipc.on('stderr', function(_, data){
  process.send(['stderr', data]);
});
