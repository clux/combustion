var test = require('tap').test
  , e = require('../')
  , c = e({});

test("template", function (t) {
  var result;

  var basic = c("hello <%= name %>!");
  t.equal(basic({name : "clux"}), "hello clux!", "basic interpolation");

  var sansSemicolon = c("A <% this %> B");
  t.equal(sansSemicolon(), "A  B");

  var backslash = c("<%= thing %> is \\ridanculous");
  t.equal(backslash({thing: 'This'}), "This is \\ridanculous");

  var escaped = c('<%= a ? "checked=\\"checked\\"" : "" %>');
  t.equal(escaped({a: true}), 'checked="checked"', 'can handle slash escapes in interpolations');

  var fancy = c("<ul><% for (key in people) { %><li><%= people[key] %></li><% } %></ul>");
  result = fancy({people : {moe : "Moe", larry : "Larry", curly : "Curly"}});
  t.equal(result, "<ul><li>Moe</li><li>Larry</li><li>Curly</li></ul>", 'javascript in templates');


  var escapedCharsInJS = c('<ul><% numbers.split("\\n").forEach(function(item) { %><li><%= item %></li><% }) %></ul>');
  result = escapedCharsInJS({numbers: "one\ntwo\nthree\nfour"});
  t.equal(result, "<ul><li>one</li><li>two</li><li>three</li><li>four</li></ul>", 'Can use escaped characters (e.g. \\n) in Javascript');


  var nsCol = c("<div class=\"thumbnail\"><%=thumbnail%></div>");
  t.equal(nsCol({thumbnail: "a.js"}), '<div class="thumbnail">a.js</div>', "namespace colision");
/*
  var noInterpolateTemplate = _.template("<div><p>Just some text. Hey, I know this is silly but it aids consistency.</p></div>");
  result = noInterpolateTemplate();
  equal(result, "<div><p>Just some text. Hey, I know this is silly but it aids consistency.</p></div>");

  var quoteTemplate = _.template("It's its, not it's");
  equal(quoteTemplate({}), "It's its, not it's");

  var quoteInStatementAndBody = _.template("<%\
    if(foo == 'bar'){ \
  %>Statement quotes and 'quotes'.<% } %>");
  equal(quoteInStatementAndBody({foo: "bar"}), "Statement quotes and 'quotes'.");

  var withNewlinesAndTabs = _.template('This\n\t\tis: <%= x %>.\n\tok.\nend.');
  equal(withNewlinesAndTabs({x: 'that'}), 'This\n\t\tis: that.\n\tok.\nend.');

  var template = _.template("<i><%- value %></i>");
  var result = template({value: "<script>"});
  equal(result, '<i>&lt;script&gt;</i>');

  var stooge = {
    name: "Moe",
    template: _.template("I'm <%= this.name %>")
  };
  equal(stooge.template(), "I'm Moe");

  if (!$.browser.msie) {
    var fromHTML = _.template($('#template').html());
    equal(fromHTML({data : 12345}).replace(/\s/g, ''), '<li>24690</li>');
  }

  _.templateSettings = {
    evaluate    : /\{\{([\s\S]+?)\}\}/g,
    interpolate : /\{\{=([\s\S]+?)\}\}/g
  };

  var custom = _.template("<ul>{{ for (key in people) { }}<li>{{= people[key] }}</li>{{ } }}</ul>");
  result = custom({people : {moe : "Moe", larry : "Larry", curly : "Curly"}});
  equal(result, "<ul><li>Moe</li><li>Larry</li><li>Curly</li></ul>", 'can run arbitrary javascript in templates');

  var customQuote = _.template("It's its, not it's");
  equal(customQuote({}), "It's its, not it's");

  var quoteInStatementAndBody = _.template("{{ if(foo == 'bar'){ }}Statement quotes and 'quotes'.{{ } }}");
  equal(quoteInStatementAndBody({foo: "bar"}), "Statement quotes and 'quotes'.");

  _.templateSettings = {
    evaluate    : /<\?([\s\S]+?)\?>/g,
    interpolate : /<\?=([\s\S]+?)\?>/g
  };

  var customWithSpecialChars = _.template("<ul><? for (key in people) { ?><li><?= people[key] ?></li><? } ?></ul>");
  result = customWithSpecialChars({people : {moe : "Moe", larry : "Larry", curly : "Curly"}});
  equal(result, "<ul><li>Moe</li><li>Larry</li><li>Curly</li></ul>", 'can run arbitrary javascript in templates');

  var customWithSpecialCharsQuote = _.template("It's its, not it's");
  equal(customWithSpecialCharsQuote({}), "It's its, not it's");

  var quoteInStatementAndBody = _.template("<? if(foo == 'bar'){ ?>Statement quotes and 'quotes'.<? } ?>");
  equal(quoteInStatementAndBody({foo: "bar"}), "Statement quotes and 'quotes'.");

  _.templateSettings = {
    interpolate : /\{\{(.+?)\}\}/g
  };

  var mustache = _.template("Hello {{planet}}!");
  equal(mustache({planet : "World"}), "Hello World!", "can mimic mustache.js");

  var templateWithNull = _.template("a null undefined {{planet}}");
  equal(templateWithNull({planet : "world"}), "a null undefined world", "can handle missing escape and evaluate settings");*/

  t.end();
});

test('handling \\u2028 & \\u2029', function (t) {
  var tmpl = c('<p>\u2028<%= "\\u2028\\u2029" %>\u2029</p>');
  t.equal(tmpl(), '<p>\u2028\u2028\u2029\u2029</p>');
  t.end();
});

test('undefined template variables.', function (t) {
  var template = c('<%=x%>');
  t.equal(template({x: null}), 'null');
  t.equal(template({x: undefined}), 'undefined');

  var templateEscaped = c('<%-x%>');
  t.equal(templateEscaped({x: null}), 'null');
  t.equal(templateEscaped({x: undefined}), 'undefined');

  var templateWithProperty = c('<%=x.foo%>');
  t.equal(templateWithProperty({x: {} }), 'undefined');

  var templateWithPropertyEscaped = c('<%-x.foo%>');
  t.equal(templateWithPropertyEscaped({x: {} }), 'undefined');
  t.end();
});

test('interpolate evaluates code only once', function (t) {
  var count = 0;
  var template = c('<%= f() %>');
  template({f: function(){ count++; }});
  t.equal(count, 1, "f() executes only once");

  var countEscaped = 0;
  var templateEscaped = c('<%- f() %>');
  templateEscaped({f: function(){ countEscaped++; }});
  t.equal(countEscaped, 1, "f() executes only once escaped");

  var countTwo = 0;
  var templateLong = c('<% var d = f() %> <%=d%> <%=d%>');
  templateLong({f: function(){ countTwo++; }});
  t.equal(countTwo, 1, "f() executes only once when cached inside a template");

  t.end()
});
