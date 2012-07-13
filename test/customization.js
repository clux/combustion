var test = require('tap').test
  , path = require('path')
  , fs = require('fs')
  , $ = require('autonomy')  // custom utility module
  , op = require('operators') // custom helper module..
  , cp = require('child_process')
  , e = require('../');

test("client dependencies", function (t) {
  var comp = e({
    utility    : $
  , helpers    : op
  , helperName : 'h'
  });
  var tmplU = comp("Hi <%=$.id(name)%>!");
  t.equal(tmplU({name : 'clux'}), "Hi clux!", "utility library injected under $");

  var tmplH = comp("<%=h.eq(5)(val) ? 'y' : 'n'%> !");
  t.equal(tmplH({val: 5}), 'y !', "helpers work 1");
  t.equal(tmplH({val: 3}), 'n !', "helpers work 2");

  var tmplBoth = comp("<%- $.constant('<inject>')(val) %> + <%= h.plus(1)(val) %>");
  t.equal(tmplBoth({val: 1}), "&lt;inject&gt; + 2", 'both helpers and $ works simultaneously');


  var compV = e({
    variable : 'data'
  });
  var tmplV = compV("Hi <%=data.name%>!");
  t.equal(tmplV({name: 'clux'}), "Hi clux!", "setting variable option");

  t.end();
});

test("precompilation", function (t) {
  var binLocation = path.join(__dirname, '..', 'lib', 'precompiler.js');
  t.plan(6 * 2 + 2);

  // first iteration:
  // scan `with` template dir basic way (i.e. it should not react to sibling cfg)
  // second iteration:
  // scan configged template dir (which should handle the namespacing therein)
  ['with', 'configged'].forEach(function (folderName) {
    var args = ['-d', path.join(__dirname, folderName)];
    cp.execFile(binLocation, args, {}, function (error, stdout, stderr) {
      t.ok(!error && !stderr, "compilation worked");
      var filePath = path.join(__dirname, folderName + "Tmpl.js");
      fs.writeFileSync(filePath, stdout);
      var reqd = require(filePath);
      t.ok(reqd, "managed to require the module");
      t.ok(reqd['user/profile'], "user/profile exists");
      t.ok(reqd['entry/view'], "entry/view exists");

      var res1 = reqd['entry/view']({title : 'boo', body : 'long text'});
      var exp1 = "<div>\n  <header>boo</header>\n  <p>long text\n</div>\n";
      t.equal(res1, exp1, "entry/view use");


      var res2 = reqd['user/profile']({name: 'clux', skills: ['lolling']});
      var exp2 = "<div>\n  <header>clux</header>\n  \n  <ul>\n    \n      <li>lolling</li>\n    \n  </ul>\n  \n</div>\n";
      t.equal(res2, exp2, "user/profile use");

      if (folderName === 'configged') {
        // check the last helper/utility library specific template
        t.ok(reqd.special, "special template exists");
        var res3 = reqd.special({name : 'clux'});
        var exp3 = "<i>x!</i>\n<b>true</b>\n";
        t.equal(exp3, res3, "special template use");
      }
      fs.unlinkSync(filePath);
    });
  });
});
