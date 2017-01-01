'use strict';

module.exports = function (hashLength) {
  function randomStr () {
    var text = '';
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (var i = 0; i < hashLength; i++) {
      text += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return text;
  }

  var allNames = {};

  function uniqAttr (name) {
    var pname;
    do {
      allNames[pname] = pname = name + (hashLength > 0 ? '_' + randomStr() : '');
    } while (!pname && (pname = allNames[pname]));
    return pname;
  }

  return uniqAttr;
};
