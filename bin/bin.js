#!/usr/bin/env node

var electron = require('..');

var browser = electron({
  show: false
});

process.stdin.pipe(browser);
browser.stdout.pipe(process.stdout);
browser.stderr.pipe(process.stderr);

