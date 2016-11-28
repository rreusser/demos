'use strict';

module.exports = gpuArray;

var isndarray = require('isndarray');
var ndarray = require('ndarray');

function gpuArray (regl, data, shape) {
  var dtype = 'float';
  if (!(this instanceof gpuArray)) {
    return new gpuArray(regl, data, shape);
  }

  if (Array.isArray(data)) {
    data = new Float32Array(data);
  }

  if (isndarray(data) && !Array.isArray(shape)) {
    shape = data.shape;

    if (data.dtype === 'float32') {
      dtype = 'float';
      data = ndarray(new Float32Array(data.data), data.shape, data.stride, data.offset);
    } else if (data.dtype = 'uint8') {
      dtype = 'uint8';
      data = ndarray((data.data), data.shape, data.stride, data.offset);
    } else {
      throw new Error('data must be uint8 or float32');
    }
  }

  if (shape.length !== 3 || shape[2] !== 4) {
    throw new Error('gpuArray shape must be m x n x 4');
  }

  var n = shape.slice(0, 2).reduce((a, b) => a * b, 1);

  if (!data) {
    data = new Float32Array(n * 4);
  }

  var fullShape = shape.slice(0, 2).concat([4]);

  var tex = regl.texture({
    data: data,
    width: shape[0],
    height: shape[1],
  });

  var fbo = regl.framebuffer({
    color: tex,
    colorFormat: 'rgba',
    colorType: dtype
  });

  var origDestroy = fbo.destroy.bind(fbo);

  fbo.read = function () {
    var a;
    fbo.use(function () {
      a = regl.read();
    });
    return ndarray(a, fullShape);
  };

  fbo.destroy = function () {
    origDestroy();
    tex.destroy();
  };

  return fbo;
}
