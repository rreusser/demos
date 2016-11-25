var extend = require('util-extend');
var d3 = require('d3');
var EventEmitter = require('event-emitter');

module.exports = Plotter;

function Plotter (options) {
  EventEmitter.call(this);

  this.options = extend({
    margin: {t: 0, r: 0, b: 0, l: 0},
    xrange: [-1, 1],
    yrange: [-2, 2],
    aspectRatio: undefined,
  }, options || {});

  this.margin = this.options.margin;
  this.xrange = this.options.xrange;
  this.yrange = this.options.yrange;
  this.aspectRatio = this.options.aspectRatio;

  this.initialize();
};

EventEmitter(Plotter.prototype);

Plotter.prototype.setXrange = function(range) {
  this.xrange = range.slice(0);

  if (this.aspectRatio !== undefined) {
    var xdif = 0.5 * (this.xrange[1] - this.xrange[0]);
    var ycen = 0.5 * (this.yrange[1] + this.yrange[0]);
    this.yrange = [ycen - xdif / this.aspectRatio, ycen + xdif / this.aspectRatio];
  }

  this.createScale();
};

Plotter.prototype.setYrange = function (range) {
  this.yrange = range.slice(0);

  if (this.aspectRatio !== undefined) {
    var xcen = 0.5 * (this.xrange[1] + this.xrange[0]);
    var ydif = 0.5 * (this.yrange[1] - this.yrange[0]);
    var factor = this.aspectRatio * this.width / this.height;
    this.xrange = [xcen - ydif * factor, xcen + ydif * factor];
  }

  this.createScale();
}

Plotter.prototype.initialize = function () {
  this.setBase();
  this.createSVG();
  this.createScale();
  this.resizeSVG();

  window.addEventListener('resize', function (e) {
    this.emit('resize', e);
  }.bind(this));

  window.addEventListener('blur', function (e) {
    this.emit('blur', e);
  }.bind(this));

  window.addEventListener('focus', function (e) {
    this.emit('focus', e);
  }.bind(this));

  return this;
};

Plotter.prototype.createScale = function () {
  this.xScale = d3.scaleLinear()
    .domain(this.xrange)
    .range([0, this.width]);

  this.yScale = d3.scaleLinear()
    .domain(this.yrange)
    .range([this.height, 0]);
};

Plotter.prototype.setBase = function () {
  if (!this.options.base) {
    this.baseEl = document.createElement('div');
    document.body.appendChild(this.baseEl);
  } else {
    if (typeof this.options.base === 'string') {
      this.baseEl = document.getElementById(this.options.base);
    } else {
      this.baseEl = this.options.base;
    }
  }

  this.base = d3.select(this.baseEl);

  return this;
};

Plotter.prototype.createSVG = function () {
  if (!this.svg) {
    this.base.append('svg');
    this.svg = this.base.select('svg');
  }

  return this;
};

Plotter.prototype.resizeSVG = function (w, h) {
  if (w === undefined) {
    w = this.baseWidth;
  }

  if (h === undefined) {
    h = this.baseHeight;
  }

  this.svg
    .attr('width', w)
    .attr('height', h);

  this.xScale.range([0, this.width]);
  this.yScale.range([this.height, 0]);

  return this;
};

Object.defineProperties(Plotter.prototype, {
  baseWidth: {
    get: function () {
      return this.baseEl.offsetWidth;
    }
  },
  baseHeight: {
    get: function () {
      return this.baseEl.offsetHeight;
    }
  },
  size: {
    get: function () {
      return {
        width: this.width,
        height: this.height
      };
    }
  },
  width: {
    get: function () {
      return this.baseWidth - this.margin.l - this.margin.r;
    }
  },
  height: {
    get: function () {
      return this.baseHeight - this.margin.t - this.margin.b;
    }
  }
});
