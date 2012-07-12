#!/usr/bin/env node
var fs = require('fs')
  , fsx = require('fsx')
  , optimist = require('optimist')
  , compiler = require('../')({})
  , path = require('path');

// need the escapeCode verbatim from escape.js just without the module.exports line
var escapeCode = fs
  .readFileSync(path.join(__dirname, 'escape.js'))
  .toString()
  .split('\n')
  .slice(0, -3)
  .join('\n');


if (module === require.main) {
  var argv = require('optimist')
    .usage('Usage: $0 -d [directory] -h [helper file] -u [utility library]')
    .demand(['d'])
    .argv;

  var output = [escapeCode]

  if (argv.h) {
    output.unshift("var __helpers = require('" + argv.h + "');");
  }

  if (argv.u) {
    output.unshift("var $ = require('" + argv.u + "');");
  }

  var templateDir = argv.d;
  fsx.readDirSync(templateDir).files.forEach(function (file) {
    if (path.extname(file) !== '.html') {
      return; // skip non-templates
    }
    var t = fs.readFileSync(file).toString();
    var id = path.relative(templateDir, file).split('.html')[0];
    output.push("exports['" + id + "'] = " + compiler(t).source + ";");
  });

  console.log(output.join('\n'));
}

