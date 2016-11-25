'use strict';

var fit = require('canvas-fit');

module.exports = Plot;

function Plot (id, onresize) {
  this.canvas = document.getElementById(id);
  var fitCanvas = fit(this.canvas, window, window.devicePixelRatio);
  this.ctx = this.canvas.getContext('2d');

  var onResize = function () {
    fitCanvas();
    this.ctx = this.canvas.getContext('2d');
    onresize && onresize(this.canvas.width, this.canvas.height);
  }.bind(this);

  window.addEventListener('resize', onResize, false);
  onResize();
}
