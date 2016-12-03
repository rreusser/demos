'use strict';

var parseMap = require('./parsers/map');
var compileMap = require('./compilers/map');
var gpuArray = require('./lib/array');

module.exports = function (regl) {
  return {
    map: function (args) {
      return compileMap(regl, parseMap(args));
    },
    array: function (data, shape, opts) {
      return gpuArray(regl, data, shape, opts);
    }
  };
};
