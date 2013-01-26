# Combustion [![Build Status](https://secure.travis-ci.org/clux/combustion.png)](http://travis-ci.org/clux/combustion)
Combustion is a simple template engine abstaction built built upon code from underscore's template function. It's a micro-templating library, similar to [John Resig's implementation](http://ejohn.org/blog/javascript-micro-templating/), but it allows custom injection of helpers and the utility library of choice in a strict commonjs environment where globals are annihilated. It's dependency-free and tiny when it's main entry point is required, but for node it includes helpers for server-side compilation.

## Usage
Require the library, and make a compiler with a custom helper object, and optionally inject utility library to make available inside template code. If no utility library is given, the `$` variable inside a template function will now refer to an empty object and shadow whatever global value it may or may not have.

```js
var compiler = require('combustion')();
var template = compiler("hello: <b><%= name %></b>");

template({name: 'clux'}); // "hello: <b>clux</b>"
```

The API is as follows:
### require('combustion') :: ([settings]) -> compilerFn
### compilerFn :: (str) -> templateFn
### templateFn :: (obj) -> htmlString

## Basic Usage
When one instantiates combustion with a settings object and a utility library we get a compiler function.This compiles JavaScript templates into functions that can be evaluated for rendering. Template functions can both interpolate variables, using <%= … %>, as well as execute arbitrary JavaScript code, with <% … %>. If you wish to interpolate a value, and have it be HTML-escaped, use <%- … %> When you evaluate a template function, pass in a data object that has properties corresponding to the template's free variables.

```js
var tStr = "<div id=\"winner\"><% if (name == 'clux') { %> \
    <b><%=name + '!'%></b> \
  <% } else { %> \
    <i><%-'lucky ' + name%></i> \
  <% } %> \
</div>";
var template = compiler(tStr);

template({name:clux});
// '<div id="winner"><b>clux!</b></div>'
template({name:'<injector>'});
// '<div id="winner"><i>lucky &lt;injector&gt;</i></div>'
```

Note the multiline comment breaks are only needed if you wrote the templates inside javascript - which would be silly.

## Customization (Client)
### Adding Methods
Combustion allows adding helpers into the scope of the template functions. This is done on a per compiler basis, to encourage the use of similar helpers in similar areas (typically per controller file if you are using mvc-style). An entire utility library can also be injected for own methods (like how `_.template` injects `_` into the template scope).

```js
var helpers = {
  print : function () {
    return Array.prototype.join.call(arguments, '');
  },
  pluralize : function (str, num) {
    return num + ' ' + (num === 1 ? : '' : 's');
  }
};
var settings = {
  utility     : require('interlude'),
  helpers     : helpers,
  helperName  : 'h'
}

var compiler = require('combustion')(settings);
var template = compiler("<%= h.pluralize('winner', $.gcd(number, 6)) %>");
template({number: 4}); // "2 winners"
template({number: 5}); // "1 winner"
```

Here the functional utility library [interlude](https://github.com/clux/interlude) is made available inside the templates instead of underscore. Customize and use your own helper library if you want to.

### Delimiters
If ERB-style delimiters aren't your cup of tea, you can change the template settings to use different symbols to set off interpolated code. Define an interpolate regex to match expressions that should be interpolated verbatim, an escape regex to match expressions that should be inserted after being HTML escaped, and an evaluate regex to match expressions that should be evaluated without insertion into the resulting string. You may define or omit any combination of the three. For example, to perform Mustache.js style templating:

```js
var settings = {
  interpolate : /\{\{(.+?)\}\}/g
};
var compiler = require('combustion')(settings);
var template = compiler("Hello {{ name }}!");
template("November clux"); // "Hello November clux!"
```

### Variable Option
By default, template places the values from your data in the local scope via the `with` statement. However, you can specify a single variable name with the variable setting. This can significantly improve the speed at which a template is able to render.

```js
var compiler = require('combustion')({variable : 'data'})
var template = compiler("<%= data.name %>!");
template({name: "Hogan"}); // "Hogan!"
```

## Precompiling
Precompiling your templates can be a big help when debugging errors you can't reproduce. This is because precompiled templates can provide line numbers and a stack trace, something that is not possible when compiling templates on the client. The source property is available on the compiled template function for easy precompilation.

```js
compiler("hello <%=name%>!").source;
"function(obj){
with(obj||{}){
var __p='hello '+
(name)+
'!';
}
return __p;
}"
```

This allows basic pre-compilation, but it's not simply concatenating these sources as unescaping (i.e. `<%- "<inject>" %>`)assumes a 10 line dependency inside combustion, and if you want helpers available, then the build step needs to _promise_ the file you are compiling into, that these helpers will exist in the commonjs environment.

To obtain this functionality combustion should be installed globally to make the `combust` executable available from anywhere. We use the executable to parse a template directory recursively:

```bash
$ combust -d ./templateDir > templates.js
```

Then require it from your commonjs environment:

```js
var templates = require('./templates');
templates['user/profile']; // template function compiled from templateDir/user/profile.html
```

### Customization
Place a `.combustion` file inside the template directory (or in each if you require different settings per folder) and customize all the options. The file should look like [lib/settings.js](https://github.com/clux/combustion/blob/master/lib/settings.js) - but changing objects for file names (see below). If you want a more global config file, put it one or more levels above the templates directories.

Thus, say you have two `.combustion` files, one in `templateDir/user` and one in `templateDir/entry`. Perhaps because a developer has done one with different delimiters, or one require a different helper object say, then:

```bash
$ combust -d ./templateDir/user  > userTmpls.js
$ combust -d ./templateDir/entry > entryTmpls.js
```

then from your cjs environment:

```js
var userTmpls = require('./userTmpls');
userTmpls['profile']; // template function compiled from templateDir/user/profile.html
```

Since each file now contains the templates from this folder this namespaces the templates by file rather than adding slashes in between directories when templates were found recursively.

#### Config File
A combustion config file looks almost exactly like the default settings object passed to `combustion` on the client, with one distinct difference:

- dependencies are _injected_ on the client, and _referenced_ in a config.

Thus, a sensible default `.combustion` file can look like this:

```
/**
 * @file templateDir/.combustion
 */

module.exports = {
  evaluate    : /<%([\s\S]+?)%>/g,
  interpolate : /<%=([\s\S]+?)%>/g,
  escape      : /<%-([\s\S]+?)%>/g,
  helpers     : './helpers',
  helperName  : 'h',
  utility     : 'interlude',
  variable    : null
};
```

Note that if helpers or utility takes the form of a relative path, note that the path must be relative to where you place the output of `combust`, otherwise your build tool will complain.

## Installation
Install it locally if you want client side compilation, otherwise globally (with the -g flag) for precompilation

```bash
$ npm install -g combustion
```

## Running tests
Install development dependencies

```bash
$ npm install
```

Run the tests

```bash
$ npm test
```

## License
MIT-Licensed. See LICENSE file for details.
