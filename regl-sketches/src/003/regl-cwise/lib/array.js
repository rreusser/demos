'use strict';

module.exports = gpuArray;

var isndarray = require('isndarray');
var ndarray = require('ndarray');

function gpuArray (regl, data, shape, opts) {
  opts = opts || {};

  var dtype = 'float';
  if (!(this instanceof gpuArray)) {
    return new gpuArray(regl, data, shape, opts);
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

  if (!data || typeof data === 'function') {
    var fn = data;
    data = new Float32Array(n * 4);
  }

  if (typeof fn === 'function') {
    var ni = shape[0];
    var nj = shape[1];
    for (var j = 0; j < nj; j++) {
      for (var i = 0; i < ni; i++) {
        var value = fn(i, j);
        var idx = 4 * (i + ni * j);
        data[idx] = value[0];
        data[idx + 1] = value[1];
        data[idx + 2] = value[2];
        data[idx + 3] = value[3];
      }
    }
  }

  var fullShape = shape.slice(0, 2).concat([4]);

  var tex = regl.texture({
    data: data,
    width: shape[0],
    height: shape[1],
    wrapS: opts.xboundary || 'clamp',
    wrapT: opts.yboundary || 'clamp',
    mag: opts.magfilter || 'nearest',
    min: opts.minfilter || 'nearest',
  });

  var fbo = regl.framebuffer({
    color: tex,
    colorFormat: 'rgba',
    colorType: dtype
  });

  var origDestroy = fbo.destroy.bind(fbo);

  fbo.read = function (opts) {
    var a;
    fbo.use(function () {
      a = regl.read(opts);
    });
    return ndarray(a, fullShape);
  };

  fbo.readraw = function (opts) {
    var a;
    fbo.use(function () {
      a = regl.read(opts);
    });
    return a;
  };

  fbo.destroy = function () {
    origDestroy();
    tex.destroy();
  };

  fbo.texture = tex;

  fbo.samplerCoords = function () {
    var xy = [];
    for (var i = 0; i < n; i++) {
      xy.push([
        (i % shape[0]) / Math.max(1, shape[0] - 1),
        Math.floor(i / shape[0]) / Math.max(1, shape[1] - 1)
      ]);
    }
    return regl.buffer(xy);
  };

  return fbo;
}
