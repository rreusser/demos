'use strict';

module.exports = l2Distance;

function l2Distance (a, b) {
  var diff;
  var n = a.length;
  var sum = 0;
  for (var i = n - 1; i >= 0; i--) {
    diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

