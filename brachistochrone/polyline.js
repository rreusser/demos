'use strict';

module.exports = Polyline;

var bisect = require('bisect');
var bounds = require('binary-search-bounds');
var l2Distance = require('./l2-distance');

function Polyline (points) {
  this.points = points;
  this.cumLength = [];
  this.cumDuration = [];
  this.length = 0;
  this.duration = 0;
}

Polyline.prototype.computeLength = function () {
  var n = this.points.length;

  this.cumLength[0] = 0;
  for (var i = 1; i < n; i++) {
    this.cumLength[i] = this.cumLength[i - 1] + l2Distance(this.points[i], this.points[i - 1]);
  }

  this.length = this.cumLength[n - 1];

  return this.length;
};

Polyline.prototype.computeDuration = function (brachistochrone) {
  var g = brachistochrone.g;
  var A = brachistochrone.A;
  var n = this.points.length;

  this.cumDuration[0] = 0;
  var v0 = 0;
  var p0 = this.points[0];
  for (var i = 1; i < n ; i++) {
    var p1 = this.points[i];
    var v1 = Math.sqrt(Math.max(0, 2 * g * (A - p1[1])));

    var vavg = 0.5 * (v0 + v1);
    var dy = p1[1] - p0[1];
    var dx = p1[0] - p0[0];
    var ds = Math.sqrt(dx * dx + dy * dy);
    this.cumDuration[i] = this.cumDuration[i - 1] + ds / vavg;

    // Avoid recalculating:
    p0 = p1;
    v0 = v1;
  }

  this.duration = this.cumDuration[this.cumDuration.length - 1];
};

Polyline.prototype.durationIndex = function (t) {
  return bounds.ge(this.cumDuration, t);
};

Polyline.prototype.positionAtDuration = function (t) {
  var idx = Math.min(this.points.length - 2, Math.max(this.durationIndex(t) - 1, 0));
  var interp = (t - this.cumDuration[idx]) / (this.cumDuration[idx + 1] - this.cumDuration[idx]);

  if (idx === this.points.length - 2) {
    return [-1000, -1000];
  } else {
    return [
      this.points[idx][0] * (1 - interp) + this.points[idx + 1][0] * interp,
      this.points[idx][1] * (1 - interp) + this.points[idx + 1][1] * interp
    ];
  }

};
