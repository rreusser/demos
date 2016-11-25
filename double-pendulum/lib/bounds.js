'use strict';

var extend = require('util-extend');

module.exports = Bounds;

window.scaleLinear = scaleLinear;

function scaleLinear () {
  var dmin = 0;
  var dmax = 1;
  var rmin = 0;
  var rmax = 1;
  var m = 0;
  var b = 0;

  function compute () {
    b = rmin - (rmax - rmin) * dmin / (dmax - dmin);
    m = (rmax - rmin) / (dmax - dmin);
  }

  function scale (value) {
    return m * value + b;
  };

  scale.domain = function (values) {
    dmin = values[0];
    dmax = values[1];
    compute();
    return scale;
  };

  scale.range = function (values) {
    rmin = values[0];
    rmax = values[1];
    compute();
    return scale;
  };

  return scale;
}

function Bounds (options) {
  options = extend({
    xmin: -1,
    xmax: 1,
    ymin: -1,
    ymax: 1,
    width: window.innerWidth,
    height: window.innerHeight
  }, options || {});

  this.xmin = options.xmin;
  this.xmax = options.xmax;
  this.ymin = options.ymin;
  this.ymax = options.ymax;

  this.x = scaleLinear();
  this.y = scaleLinear();

  this.computeRange();
  this.store();

  this.resize = function (w, h) {
    if (w > h) {
      this.xrng = this.yrng0 * w / h;
      this.xmin = this.xcen0 - this.xrng;
      this.xmax = this.xcen0 + this.xrng;
      this.ymin = this.ycen0 - this.yrng0;
      this.ymax = this.ycen0 + this.yrng0;
    } else {
      this.yrng = this.xrng0 * h / w;
      this.xmin = this.xcen0 - this.xrng0;
      this.xmax = this.xcen0 + this.xrng0;
      this.ymin = this.ycen0 - this.yrng;
      this.ymax = this.ycen0 + this.yrng;
    }
    this.x.range([0, w]).domain([this.xmin, this.xmax]);
    this.y.range([h, 0]).domain([this.ymin, this.ymax]);
  }.bind(this);
};

Bounds.prototype.computeRange = function () {
  this.xcen = 0.5 * (this.xmin + this.xmax);
  this.ycen = 0.5 * (this.ymin + this.ymax);
  this.xrng = 0.5 * (this.xmin - this.xmax);
  this.yrng = 0.5 * (this.ymin - this.ymax);

  return this;
};

Bounds.prototype.store = function () {
  this.xmin0 = this.xmin;
  this.xmax0 = this.xmax;
  this.ymin0 = this.ymin;
  this.ymax0 = this.ymax;
  this.xcen0 = 0.5 * (this.xmin0 + this.xmax0);
  this.ycen0 = 0.5 * (this.ymin0 + this.ymax0);
  this.xrng0 = 0.5 * (this.xmin0 - this.xmax0);
  this.yrng0 = 0.5 * (this.ymin0 - this.ymax0);

  return this;
};
