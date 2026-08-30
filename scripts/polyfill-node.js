const util = require('util');

if (!Array.prototype.toReversed) {
  Array.prototype.toReversed = function () {
    return this.slice().reverse();
  };
}

if (!util.styleText) {
  util.styleText = function (format, text) {
    return text;
  };
}
