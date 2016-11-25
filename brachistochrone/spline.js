'use strict';

var bspline = require('b-spline');
var minimize = require('minimize-golden-section-1d');
var l2Distance = require('./l2-distance');
var ndarray = require('ndarray');
var pool = require('ndarray-scratch');
var fill = require('ndarray-fill');
var solve = require('ndarray-lup-solve');
var lup = require('ndarray-lup-factorization');
var powell = require('minimize-powell');
var bisect = require('bisect');

module.exports = Spline;

function Spline (order, points, knot, weight) {
  this.order = order;

  if (Array.isArray(points)) {
    this.points = points;
    this.n = this.points.length;;
  } else {
    this.points = [];
    this.n = points;
  }

  this.knot = knot;
  this.weight = weight;

  if (!this.knot) {
    this.applyUniformKnotVector();
  }

  if (!this.weight) {
    this.applyUniformWeights();
  }
}

Spline.prototype.tabulate = function (n) {
  var tabulation = [];
  for (var i = 0; i < n; i++) {
    var t = i / (n - 1);
    tabulation[i] = this.at(t)
  };
  return tabulation;
};

Spline.prototype.fromFunction = function (f) {
  var t;
  for (var i = 0; i < this.n; i++) {
    this.points[i] = f(i / (this.n - 1));
  }
};

Spline.prototype.applyUniformKnotVector = function applyUniformKnotVector () {
  var len = this.n + this.order;
  this.knot = [];
  for (var i = 0; i < this.order; i++) {
    this.knot[i] = 0;
    this.knot[len - i - 1] = 1;
  }
  for (var i = 0; i < this.n - this.order; i++) {
    this.knot[this.order + i] = (i + 1) / (this.n + 1 - this.order);
  }
};

Spline.prototype.applyUniformWeights = function applyUniformWeights () {
  this.weight = [];
  for (var i = 0; i < this.n; i++) {
    this.weight[i] = 1.0;
  }
};

Spline.prototype.at = function at (t) {
  return bspline(t, this.order, this.points, this.knot, this.weight);
};

Spline.prototype.tMin = function () {
  return this.knot ? this.knot[0] : 0;
};

Spline.prototype.tMax = function () {
  return this.knot ? this.knot[this.knot.length - 1] : this.knot.length - 1;
};

Spline.prototype.argMinDistanceToPoint = function (pt) {
  return minimize(function (x) {
    return l2Distance(p, this.at);
  }.bind(this), {
    lowerBound: this.tMin(),
    upperBound: this.tMax()
  });
};

Spline.prototype.minDistanceToPoint = function (pt) {
  return this.at(this.argMinDistanceToPoint(pt));
};

Spline.prototype.minDistanceToFunction = function (f, t) {
  var splinePt = this.at(t);
  var funcPt = [t, f(t)];
  return l2Distance(splinePt, funcPt);
};

Spline.prototype.invertBasisFunction = function () {
  var n = this.n;
  if (!this.M) {
    this.M = pool.zeros([n, n]);
  }

  if (!this.P) {
    this.P = [];
  }

  var input = [];

  for (var i = 0; i < n; i++) {
    for (var j = 0; j < n; j++) {
      input[j] = [i === j ? 1 : 0];
    }
    fill(this.M.pick(null, i), function (j) {
      var t = j / (n - 1);
      console.log('bspline!');
      console.log('this.order, this.knot, this.weight, input:', this.order, this.knot, this.weight, input);
      return bspline(j / (n - 1), this.order, input, this.knot, this.weight);
      console.log('bsplined!');
    }.bind(this));
  }

  lup(this.M, this.M, this.P);
};

Spline.prototype.fromAnchorPoints = function (anchorPoints) {
  if (!this.M) {
    this.invertBasisFunction();
  }

  var xC = [];
  var yC = [];
  for (var i = 0; i < this.n; i++) {
    xC[i] = anchorPoints[i][0];
    yC[i] = anchorPoints[i][1];
  }


  solve(this.M, this.M, this.P, ndarray(xC));
  solve(this.M, this.M, this.P, ndarray(yC));

  for (var i = 0; i < this.n; i++) {
    this.points[i] = [];
    this.points[i][0] = xC[i]
    this.points[i][1] = yC[i]
  }
};


Spline.prototype.fitToFunction = function (f, t0, t1) {

  var startTime = Date.now();

  var i;
  var n = this.n;
  var y = [];

  var samples = 20;

  // Compute the endpoints:
  var f0 = f(t0);
  var f1 = f(t1);


  // Infer the dimensionality:
  // TODO: Verify everything matches
  var dim = f0.length;

  // Construct a solution vector:
  for (i = 0; i < n - 2; i++) {
    y[i] = t0 + (t1 - t0) * (i + 1) / (n - 1);
  }

  // Initialize anchor storage:
  var anchors = [];
  anchors[0] = f0;
  anchors[n - 1] = f1;

  var func = function (y0) {
    // Tabulate solution vector t values into an array:
    for (var i = 1; i < n - 1; i++) {
      anchors[i] = f(y0[i - 1]);
    }

    // Convert those points into spline control points:
    console.log('from anchors');
    this.fromAnchorPoints(anchors);
    console.log('from anchord');

    var err = 0;

    for (var i = 0; i < samples; i++) {
      var s = (i + 1) / (samples + 1);

      // Compute the spline point for this s value:
      var splineEval = this.at(s);

      var fEval = f(splineEval[0])

      // Compute the difference:
      var diff = fEval[1] - splineEval[1];

      // Add squared difference:
      err += diff * diff;
    }

    return err;
  }.bind(this);

  var soln =  powell(func, y, {
    tolerance: 1e-4,
    tolerance1d: 1e-8,
    maxIter: 20,
    computeConstraints: function (p, ui) {
      var upper = Infinity;
      var lower = -Infinity;

      var n = p.length;
      for (var j = 0; j < n; j++) {
        var prev = j > 0 ? p[j - 1] : -Infinity;
        var next = j < n - 1 ? p[j + 1] : Infinity;
        if (ui[j] !== 0) {
          var lo = (t0 - p[j]) / ui[j];
          var hi = (t1 - p[j]) / ui[j];

          if (Math.abs(lo) < Math.abs(lower)) {
            lower = lo;
          }
          if (Math.abs(prev - p[j]) < Math.abs(lower)) {
            lower = prev - p[j];
          }

          if (Math.abs(hi) < Math.abs(upper)) {
            upper = hi;
          }
          if (Math.abs(next - p[j]) < Math.abs(upper)) {
            upper = next - p[j];
          }
        }
      }

      return {
        lowerBound: - Math.abs(lower),
        upperBound: Math.abs(upper),
      };
    }
  });


  var anchors = [];
  for (var i = 1; i < n - 1; i++) {
    anchors[i] = f(soln[i - 1]);
  }
  anchors[0] = f0;
  anchors[n - 1] = f1;

  this.fromAnchorPoints(anchors);

  var endTime = Date.now();

  console.info('Spline curve fit completed in ' + (endTime - startTime) + 'ms')

  return anchors;
}
