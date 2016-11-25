'use strict';

var EventEmitter = require('event-emitter');

module.exports = Animation;

function Animation () {
  this.frame = 0;

  EventEmitter.call(this);
}

EventEmitter(Animation.prototype);

Animation.prototype.start = function () {
  if (!this.raf) {
    var onRaf = function (t) {
      this.emit('frame', t, this.frame++)
      this.raf = requestAnimationFrame(onRaf);
    }.bind(this);

    this.raf = requestAnimationFrame(onRaf);
  }

  return this;
};

Animation.prototype.stop = function () {
  if (this.raf) {
    cancelAnimationFrame(this.raf);
    this.raf = null;
  }

  return this;
};

Object.defineProperties(Animation.prototype, {
  isRunning: {
    get: function () {
      return !!this.raf;
    }
  }
});
