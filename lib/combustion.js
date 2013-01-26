var escape = require('./escape')
  , settings = require('./settings');

// When customizing `templateSettings`, if you don't want to define an
// interpolation, evaluation or escaping regex, we need one that is
// guaranteed not to match.
var noMatch = /.^/;

// Certain characters need to be escaped so that they can be put into a
// string literal.
var escapes = {
  '\\': '\\',
  "'": "'",
  '\r': 'r',
  '\n': 'n',
  '\t': 't',
  '\u2028': 'u2028',
  '\u2029': 'u2029'
};

var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;
var unescaper = /\\(\\|'|r|n|t|u2028|u2029)/g;

// Within an interpolation, evaluation, or escaping, remove HTML escaping
// that had been previously added.
var unescape = function (code) {
  return code.replace(unescaper, function (match, escape) {
    return escapes[escape];
  });
};

// JavaScript micro-templating, similar to John Resig's implementation.
// Handles arbitrary delimiters, preserves whitespace,
// and correctly escapes quotes within interpolated code.
module.exports = function makeCompiler(s) {
  // Settings merge done with helpers and delims so that it encourages
  // consistent style in tightly bound areas (like an MVC-style controller)
  s = s || {};
  Object.keys(settings).forEach(function (key) {
    s[key] = s[key] || settings[key];
  });

  return function compile(text) {
    // Compile the template source, taking care to escape characters that cannot
    // be included in a string literal and then unescape them in code blocks.
    var source = "var __p='" + text
      .replace(escaper, function (match) {
        return '\\' + escapes[match];
      })
      .replace(s.escape || noMatch, function (match, code) {
        return "'+\n__escape(" + unescape(code) + ")+\n'";
      })
      .replace(s.interpolate || noMatch, function (match, code) {
        return "'+\n(" + unescape(code) + ")+\n'";
      })
      .replace(s.evaluate || noMatch, function (match, code) {
        return "';\n" + unescape(code) + "\n;__p+='";
      }) + "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!s.variable) {
      source = 'with(obj||{}){\n' + source + '}\n';
    }
    source += "return __p;\n";

    var render = new Function(s.variable || 'obj', '$', '__escape', s.helperName, source);

    // Always return a compiled function
    var template = function (data) {
      return render.call(this, data, s.utility, escape, s.helpers);
    };

    // Provide a simplified source as a debug/build time helper.
    // Note this will not include the implicit dependencies:
    // $, helperObj, and the internal __escape function aliased herein.
    template.source = 'function(' + (s.variable || 'obj') + '){\n' + source + '}';

    return template;
  };
};
