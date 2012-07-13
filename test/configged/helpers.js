var op = require('operators');

module.exports = {
  exclaim : function (str) {
    return str + "!";
  }
, chop : function (str) {
    return str.slice(-1);
  }
, gt : op.gt(5)
}
