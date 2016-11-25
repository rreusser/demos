'use strict';

module.exports = vectorFill;

var fill = cwise({
  args: [{blockIndices: -1}, 'scalar', 'index', 'shape'],
  body: function (A, func, idx, shape) {
    var i;
    var args = [];
    var n = shape[shape.length - 1];
    for (i = 0; i < n; i++) {
      if (idx[i] === undefined) break;
      args[i] = idx[i];
    }

    var f = func.apply(null, args);
    for (i = 0; i < f.length; i++) {
      A[i] = f[i];
    }
  }
});

function vectorFill(A, func) {
  fill(A, func);
  return A;
}

