#!/usr/bin/env node
var fs = require('fs')
  , fsx = require('fsx')
  , confortable = require('confortable')
  , optimist = require('optimist')
  , combustion = require('../')
  , settings = require('./settings')
  , path = require('path');

// need the escapeCode verbatim from escape.js just without the module.exports line
var escapeCode = fs
  .readFileSync(path.join(__dirname, 'escape.js'))
  .toString()
  .split('\n')
  .slice(0, -3)
  .join('\n')
  + "var __escape = escape;\n";


if (module === require.main) {
  var argv = require('optimist')
    .usage('Usage: $0 -d [directory]')
    .demand(['d'])
    .argv;

  var output = [];

  // only allow helpers and utility if specified as strings in config
  delete settings.helpers;
  delete settings.utility;

  var config = confortable('.combustion', path.join(process.cwd(), argv.d));
  if (config) {
    var cfg = require(config);
    Object.keys(cfg).forEach(function (key) {
      settings[key] = cfg[key]; // extend settings
    });
  }
  var compiler = combustion(settings);

  if (settings.helperName && settings.helpers) {
    output.push("var " + settings.helperName + " = require('" + settings.helpers + "');");
  }
  if (settings.utility) {
    output.puse("var $ = require('" + settings.utility + "');");
  }

  output.push(escapeCode);

  var templateDir = argv.d;
  fsx.readDirSync(templateDir).files.forEach(function (file) {
    if (path.extname(file) !== '.html') {
      return; // skip non-templates
    }
    var t = fs.readFileSync(file).toString();
    var id = path.relative(templateDir, file).split('.html')[0];
    output.push("exports['" + id + "'] = " + compiler(t, variable).source + ";");
  });

  console.log(output.join('\n'));
}

