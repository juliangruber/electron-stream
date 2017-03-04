#!/usr/bin/env node

var electron = require('..');
var minimist = require('minimist');

var argv = minimist(process.argv.slice(2), {
  boolean: 'node-integration',
  alias: {
    nodeIntegration: 'node-integration'
  }
});
var browser = electron(argv);

process.stdin.pipe(browser);
browser.stdout.pipe(process.stdout);
browser.stderr.pipe(process.stderr);

