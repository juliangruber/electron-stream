var {app, BrowserWindow, ipcMain: ipc} = require('electron');
var {join, resolve} = require('path');

var win;
var preload = join(__dirname, 'preload.js');

app.on('ready', function(){
  process.on('message', function(msg){
    switch (msg[0]) {
      case 'init':
        var opts = msg[1];
        win = new BrowserWindow({
          show: opts.show || false,
          webPreferences: {
            preload: preload,
            nodeIntegration: opts.nodeIntegration || false
          }
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
