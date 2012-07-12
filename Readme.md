# Combustion [![Build Status](https://secure.travis-ci.org/clux/combustion.png)](http://travis-ci.org/clux/combustion)
Combustion is a simple template engine abstaction built built upon code from underscore's template function. It's a micro-templating library, similar to [John Resig's implementation](http://ejohn.org/blog/javascript-micro-templating/), but it allows custom injection of helpers and the utility library of choice in a strict commonjs environment where globals are annihilated.

## Usage
Require the library, and make a compiler with a custom helper object, and optionally inject utility library to make available inside template code. If no utility library is given, the `$` variable inside a template function will shadow whatever global value it may have.

````javascript
var compiler = require('combustion')(settings, window.$);
var template = compiler("hello: <b><%= name %></b>");

template({name: 'clux'}); // "hello: <b>clux</b>"
````

The API is as follows:
### require('combustion') :: (settings [, utility]) -> compilerFn
### compilerFn :: (str [, variable]) -> templateFn
### templateFn :: (obj) -> htmlString

## Basic Usage
When one instantiates combustion with a settings object and a utility library we get a compiler function.This compiles JavaScript templates into functions that can be evaluated for rendering. Template functions can both interpolate variables, using <%= … %>, as well as execute arbitrary JavaScript code, with <% … %>. If you wish to interpolate a value, and have it be HTML-escaped, use <%- … %> When you evaluate a template function, pass in a data object that has properties corresponding to the template's free variables.

````javascript
var tStr = "<div id=\"winner\"><% if (name == 'clux') { %><b><%=name + '!'%></b><% } else { %><i><%-'lucky ' + name%></i><% } %></div>";
var template = compiler(tStr);

template({name:clux});
// "<div id="winner"><b>clux!</b></div>"
template({name:'<injector>'});
// "<div id="winner"><i>lucky &lt;injector&gt;</i></div>"
````

## Adding Methods
Combustion allows adding helpers into the scope of the template functions. This is done on a per compiler basis, to encourage the use of similar helpers in similar areas (typically per controller file if you are using mvc-style). An entire utility library can also be injected for own methods (like how `_.template` injects `_` into the template scope).

````javascript
var $ = require('interlude');
var helpers = {
  print : function () {
    return Array.prototype.join.call(arguments, '');
  }
, pluralize : function (str, num) {
    return num + ' ' + (num === 1 ? : '' : 's');
  }
};

var compiler = require('combustion')({helpers: helpers, helperName: 'h'}, $);
var template = compiler("<%= h.pluralize("winner", $.gcd(number, 6)) %>");
template({number: 4}); // "2 winners"
template({number: 5}); // "1 winner"
````

Here the functional utility library [interlude](https://github.com/clux/interlude) is made available inside the templates instead of underscore. Customize and use your own helper library if you want to.

## Delimiters
If ERB-style delimiters aren't your cup of tea, you can change the template settings to use different symbols to set off interpolated code. Define an interpolate regex to match expressions that should be interpolated verbatim, an escape regex to match expressions that should be inserted after being HTML escaped, and an evaluate regex to match expressions that should be evaluated without insertion into the resulting string. You may define or omit any combination of the three. For example, to perform Mustache.js style templating:

````javascript
var settings = {
  interpolate : /\{\{(.+?)\}\}/g
};
var compiler = require('combustion')(settings);
var template = compiler("Hello {{ name }}!");
template("November clux"); // "Hello November clux!"
````

## Variable Option
By default, template places the values from your data in the local scope via the with statement. However, you can specify a single variable name with the variable setting. This can significantly improve the speed at which a template is able to render.

````javascript
var template = compiler("<%= data.name %>!", "data");
template({name: "Hogan"}); // "Hogan!"
````

## Precompiling
Precompiling your templates can be a big help when debugging errors you can't reproduce. This is because precompiled templates can provide line numbers and a stack trace, something that is not possible when compiling templates on the client. The source property is available on the compiled template function for easy precompilation.

````javascript
compiler("hello <%=name%>!").source;
"function(obj){
with(obj||{}){
var __p='hello '+
(name)+
'!';
}
return __p;
}"
````

The idea is that you could pre-compile all templates in a pre-build step on the server, into a format that can be simply required from your browser commonjs environment. It's not immediately straightforward, because unescaping (i.e. `<%- "<inject>" %>`)assumes a 10 line dependency inside combustion, and if you want helpers available, then the build step needs to _promise_ the file you are compiling into, that these helpers will exist in the commonjs environment. I plan to eventually add this functionality to an external script, it's just not the first priority at the moment.


### Differences From Underscore
The main compilation function is essentially taken from underscore, but there are customizations.

- designed to work in non-global environment with localized helpers
- compile call is always curried to strongly encourage caching of Function constructor
- `print` function removed, use the standard <%=name%> to print a variable or make a helper for it

## Installation

````bash
$ npm install combustion
````

## Running tests
Install development dependencies

````bash
$ npm install
````

Run the tests

````bash
$ npm test
````

## License
MIT-Licensed. See LICENSE file for details.
