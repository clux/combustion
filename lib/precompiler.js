#!/usr/bin/env node
var fs = require('fs')
  , fsx = require('fsx')
  , confortable = require('confortable')
  , combustion = require('../')
  , settings = require('./settings')
  , path = require('path');


var argv = require('optimist')
  .usage('Usage: $0 -d [directory]')
  .demand(['d'])
  .argv;

// only allow helpers and utility if specified as strings in config
delete settings.helpers;
delete settings.utility;

var dir = path.join(process.cwd(), path.relative(process.cwd(), argv.d));
var config = confortable('.combustion', dir);
if (config) {
  var cfg = require(config);
  Object.keys(cfg).forEach(function (key) {
    settings[key] = cfg[key]; // extend settings
  });
}
var compiler = combustion(settings);

var output = [];
if (settings.helperName && settings.helpers) {
  output.push("var " + settings.helperName + " = require('" + settings.helpers + "');");
}
if (settings.utility) {
  output.push("var $ = require('" + settings.utility + "');");
}

// need the escapeCode verbatim from escape.js just without the module.exports line
var escapeCode = fs.readFileSync(path.join(__dirname, 'escape.js')).toString()
  .split('\n').slice(0, -3).join('\n') + "var __escape = escape;\n";

output.push(escapeCode);

fsx.readDirSync(dir).files.forEach(function (file) {
  if (path.extname(file) !== '.html') {
    return; // skip non-templates
  }
  var t = fs.readFileSync(file).toString();
  var id = path.relative(dir, file).split('.html')[0];
  output.push("exports['" + id + "'] = " + compiler(t).source + ";");
});

console.log(output.join('\n'));

