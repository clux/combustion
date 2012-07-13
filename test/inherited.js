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

  var tstr = "<div><p>It's its, not it's</p></div>"
  t.equal(c(tstr)(), tstr, "no interpolation is the identity");

  var quotes = c("<% if(foo == 'bar'){ %>Statement quotes and 'quotes'.<% } %>");
  t.equal(quotes({foo: "bar"}), "Statement quotes and 'quotes'.", "quotes everywhere");

  var withNewlinesAndTabs = c('This\n\t\tis: <%= x %>.\n\tok.\nend.');
  t.equal(withNewlinesAndTabs({x: 'that'}), 'This\n\t\tis: that.\n\tok.\nend.');

  var template = c("<i><%- value %></i>");
  t.equal(template({value: "<script>"}), '<i>&lt;script&gt;</i>');

  t.end();
});

test("mustache", function (t) {
  var mustache = e({
    interpolate : /\{\{(.+?)\}\}/g
  });

  var basic = mustache("Hello {{planet}}!");
  t.equal(basic({planet : "World"}), "Hello World!", "can mimic mustache.js");

  t.end();
});
test("mustache like", function (t) {
  var mustache = e({
    evaluate    : /\{\{([\s\S]+?)\}\}/g,
    interpolate : /\{\{=([\s\S]+?)\}\}/g
  });

  var custom = mustache("<ul>{{ for (key in people) { }}<li>{{= people[key] }}</li>{{ } }}</ul>");
  result = custom({people : {moe : "Moe", larry : "Larry", curly : "Curly"}});
  t.equal(result, "<ul><li>Moe</li><li>Larry</li><li>Curly</li></ul>", 'can run arbitrary javascript in templates');

  var quote = mustache("It's its, not it's");
  t.equal(quote({}), "It's its, not it's", "quote mustache");

  var quotesTwice = mustache("{{ if(foo == 'bar'){ }}Hi 'hi'.{{ } }}");
  t.equal(quotesTwice({foo: "bar"}), "Hi 'hi'.", "quotes twice mustache");
  t.end();
});

test("php style", function (t) {
  var phpStyle = e({
    evaluate    : /<\?([\s\S]+?)\?>/g,
    interpolate : /<\?=([\s\S]+?)\?>/g
  });

  var custom = phpStyle("<ul><? for (key in people) { ?><li><?= people[key] ?></li><? } ?></ul>");
  result = custom({people : {moe : "Moe", larry : "Larry", curly : "Curly"}});
  t.equal(result, "<ul><li>Moe</li><li>Larry</li><li>Curly</li></ul>", 'can run arbitrary javascript in templates');

  var quote = phpStyle("It's its, not it's");
  t.equal(quote({}), "It's its, not it's");

  var quotesTwice = phpStyle("<? if(foo == 'bar'){ ?>Hi 'hi'.<? } ?>");
  t.equal(quotesTwice({foo: "bar"}), "Hi 'hi'.", "quotes twice php");
  t.end();
})

test('handling \\u2028 & \\u2029', function (t) {
  var tmpl = c('<p>\u2028<%= "\\u2028\\u2029" %>\u2029</p>');
  t.equal(tmpl(), '<p>\u2028\u2028\u2029\u2029</p>');
  t.end();
});

test('undefined template variables', function (t) {
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
