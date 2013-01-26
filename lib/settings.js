// defaults
module.exports = {
  // ERB-style delimiters + empty helper with unobtrusive var
  evaluate    : /<%([\s\S]+?)%>/g,
  interpolate : /<%=([\s\S]+?)%>/g,
  escape      : /<%-([\s\S]+?)%>/g,
  // hempty helper object
  helpers     : {},
  // with unobtrusive name
  helperName  : '__helpers',

  // no utility library
  utility     : {},

  // no variable => use with statement
  variable    : undefined
};
