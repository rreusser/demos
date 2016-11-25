'use strict';

var extend = window.extend = require('util-extend');

extend(window, {
  Plotly: require('plotly.js'),
  linspace: require('ndarray-linspace'),
  fft: require('ndarray-fft'),
  pool: require('ndarray-scratch'),
  fill: require('ndarray-fill'),
  ndarray: require('ndarray'),
  cwise: require('cwise'),
  ops: require('ndarray-ops'),
  euler: require('ode-euler'),
  rk2: require('ode-midpoint'),
  rk4: require('ode-rk4'),
  control: require('control-panel'),
  qs: require('query-string'),
  concatRows: require('ndarray-concat-rows'),
  concatCols: require('ndarray-concat-cols'),
});
