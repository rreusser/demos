'use strict';

var EventEmitter = require('event-emitter');

module.exports = ResetTimer;

function ResetTimer (delay) {
  this.delay = delay;
  EventEmitter.call(this);
}

EventEmitter(ResetTimer.prototype);

ResetTimer.prototype.reset = function () {
  this.stop();
  this.start();
  return this;
};

ResetTimer.prototype.stop = function () {
  if (this.timeout) {
    clearTimeout(this.timeout);
    this.timeout = null;
  }
  return this;
};

ResetTimer.prototype.start = function () {
  this.timeout = setTimeout(function () {
    this.emit('timeout');
  }.bind(this), this.delay);
  return this;
};
