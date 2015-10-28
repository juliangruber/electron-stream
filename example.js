var electron = require('./');

var browser = electron();

browser.pipe(process.stdout);
setTimeout(browser.kill.bind(browser), 2000);

browser.end('console.log("hey"); window.close()');
