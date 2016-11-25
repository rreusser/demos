'use strict';

module.exports = transfiniteInterpolation;

var fill = require('ndarray-fill');
var isndarray = require('isndarray');
var vectorFill = require('./vector-fill');

function lagrange (xi, x, j) {
  var i;
  var n = xi.length;
  var prod = 1;
  for (i = 0; i < n; i++) {
    if (i === j) continue;
    prod *= (x - xi[i]) / (xi[j] - xi[i]);
  }
  return prod;
}

function createTFI (bounds, t, vecDims) {
  var i, j, k, func;
  var dims = bounds.length;
  var picker = [];
  vecDims = vecDims || bounds.length;

  t = t || [];

  for (i = 0; i < dims; i++) {
    if (!t[i]) {
      t[i] = [];
    }

    for (j = 0; j < bounds[i].length; j++) {
      if (t[i][j] === undefined) {
        t[i][j] = j / (bounds[i].length - 1);
      }
    }

    func = (function (ii, fprev) {
      var f = bounds[ii];
      return function () {
        var v, v1, v2, j, k, l, alpha;
        var args = [];
        var allArgs = [];
        var xi = arguments[ii];
        var sum = [];
        for(var j = 0; j < dims; j++) {
          allArgs.push(arguments[j]);
          if (j === ii) continue;
          args.push(arguments[j]);
        }

        for (j = 0; j < vecDims; j++) {
          sum[j] = 0;
        }

        for (j = 0; j < f.length; j++) {
          v = f[j].apply(null, args);
          alpha = lagrange(t[ii], xi, j);

          for (k = 0; k < vecDims; k++) {
            sum[k] += alpha * v[k];
          }
        }

        if (fprev) {
          // Leading term:
          v = fprev.apply(null, allArgs);
          for(j = 0; j < vecDims; j++) {
            sum[j] += v[j];
          }

          // Prev term interpolant:
          for (j = 0; j < f.length; j++) {
            allArgs[ii] = t[ii][j];
            v = fprev.apply(null, allArgs);
            alpha = lagrange(t[ii], xi, j);

            for (k = 0; k < vecDims; k++) {
              sum[k] -= alpha * v[k];
            }
          }
        }

        return sum;
      };
    })(i, func);
  }

  return func;
}

function getIvars (ivars, shape) {
  var dim;
  var dims = ivars ? ivars.length : (shape.length - 1);
  var getIvar = [];
  for (dim = 0; dim < dims; dim++) {
    if (ivars && ivars[dim]) {
      if (isndarray(ivars[dim])) {
        getIvar[dim] = ivars[dim].get;
      } else if (Array.isArray(ivars[dim])) {
        getIvar[dim] = function (i) {
          return ivars[dim][i];
        };
      } else if (typeof ivars[dim] === 'function') {
        getIvar[dim] = ivars[dim];
      } else {
        throw new Error('Independent variable must be undefined, an ndarray, an Array, or a function.');
      }
    } else {
      getIvar[dim] = (function (n) {
        var scalar = 1 / (shape[n] - 1);
        return function (i) {return i * scalar;}
      }(dim));
    }
  }

  return getIvar;
}

function transfiniteInterpolation (A, bounds, t, ivars) {
  var dim = A.dimension - 1;
  var vecDims = A.shape[A.shape.length - 1];

  var func = createTFI(bounds, t, vecDims);
  var ivars = getIvars(ivars, A.shape);

  vectorFill(A, function () {
    for (var i = 0, args = []; i < ivars.length; i++) {
      args[i] = ivars[i](arguments[i])
    }

    return func.apply(null, args);
  });

  return A;
}

