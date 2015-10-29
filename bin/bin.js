#!/usr/bin/env node

var electron = require('..');

var browser = electron();

process.stdin.pipe(browser);
browser.stdout.pipe(process.stdout);
browser.stderr.pipe(process.stderr);

