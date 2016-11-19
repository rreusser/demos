const isndarray = require('isndarray');

module.exports = function (regl) {
  function gpuArray (shape, fill) {
    let n = shape[0] * shape[1];
    let data = new Float32Array(n * 4);

    if (isndarray(shape)) {
      shape = shape.shape;
      fill = shape.get.bind(shape);
    }

    for (let j = 0; j < shape[1]; j++) {
      for (let i = 0; i < shape[0]; i++) {
        let idx = i + shape[0] * j;
        let value = fill(i, j);
        if (typeof value === 'number') {
          value = [value, value, value, value];
        }
        for (let k = 0; k < 4; k++) {
          data[4 * idx + k] = value[k] || 0;
        }
      }
    }
    return regl.texture({
      data: data,
      width: shape[0],
      height: shape[1]
    });
  }

  function gpuFbo(texture) {
    return regl.framebuffer({
      color: texture,
      colorFormat: 'rgba',
      colorType: 'float'
    });
  }

  function gpuArrayLookup(shape) {
    var width = shape[0];
    var height = shape[1];
    var n = width * height;
    let xy = [];
    for (let i = 0; i < n; i++) {
      xy.push([
        (i % width) / Math.max(1, width - 1),
        Math.floor(i / width) / Math.max(1, height - 1)
      ]);
    }
    return regl.buffer(xy);
  }

  function gpuOp (opts) {
    opts = opts || {};
    if (!opts.vert) {
      opts.vert = `
        precision mediump float;
        attribute vec2 points;
        varying vec2 uv;
        void main () {
          uv = 0.5 * (points + 1.0);
          gl_Position = vec4(points, 0, 1);
        }
      `;
    }
    if (!opts.attributes) {
      opts.attributes = {};
    }
    if (!opts.attributes.points) {
      opts.attributes.points = [[-4, -4], [0, 4], [4, -4]];
    }
    if (!opts.depth) {
      opts.depth = {};
    }
    if (opts.depth.enable === undefined) {
      opts.depth.enable = false;
    }
    if (opts.count === undefined) {
      opts.count = 3;
    }
    if (!opts.framebuffer) {
      opts.framebuffer = regl.prop('output');
    }
    if (!opts.uniforms) {
      opts.uniforms = {};
    }
    if (!opts.uniforms.du) {
      opts.uniforms.du = function (context) {
        return [1.0 / context.framebufferWidth, 0];
      }
    }
    if (!opts.uniforms.dv) {
      opts.uniforms.dv = function (context) {
        return [0, 1.0 / context.framebufferHeight];
      }
    }
    return regl(opts);
  }

  return {
    array: gpuArray,
    arrayLookup: gpuArrayLookup,
    op: gpuOp,
    fbo: gpuFbo
  };
};
