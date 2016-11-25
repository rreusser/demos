'use strict';

var extend = require('util-extend');

module.exports = Timer;

function Timer (options) {
  this.options = extend({
    followFocus: window
  }, options || {});

  this.tStart = null;
  this.tStop = null;
  this.tOffset = 0;
  this.wasRunning = false;

  if (this.options.followFocus) {
    this.attachFocus();
  }
}

Timer.prototype.attachFocus = function () {
  this.options.followFocus.addEventListener('blur', function () {
    this.wasRunning = this.isRunning;
    this.stop();
  }.bind(this));

  this.options.followFocus.addEventListener('focus', function () {
    if (this.wasRunning) {
      this.start();
    }
    this.wasRunning = false;
  }.bind(this));
};

Timer.prototype.start = function () {
  if (!this.tStart) {
    this.tStart = Date.now();
    if (this.tStop) {
    }
    this.tStop = null;
  }
};

Timer.prototype.stop = function () {
  if (this.tStart && !this.tStop) {
    this.tStop = Date.now();
    this.tOffset += this.tStop - this.tStart;
    this.tStart = null;
  }
};

Object.defineProperties(Timer.prototype, {
  t: {
    get: function () {
      var t = this.tOffset;
      if (this.tStart) {
        t += (Date.now() - this.tStart);
      }
      return t / 1000;
    }
  },
  isRunning: {
    get: function () {
      return !!this.tStart;
    }
  },
  isStopped: {
    get: function () {
      return !this.tStart;
    }
  }
});
