'use strict';

var extend = require('util-extend');
var show = require('ndarray-show');
var ndarray = require('ndarray');

module.exports = function (regl, opts) {
  opts = extend({
    map: false,
    reduce: `
      vec4 reduce(vec4 prefix, vec4 sum) {
        return prefix + sum;
      }
    `,
    verbose: false,
    axis: 0
  }, opts);

  var map, reduce, identity;

  var baseOp = {
    vert: `
      precision mediump float;
      attribute vec2 points;
      uniform vec2 prefixShift;
      varying vec2 current;
      varying vec2 prefix;
      void main () {
        current = 0.5 * (points + 1.0);
        prefix = current + prefixShift;
        gl_Position = vec4(points, 0, 1);
      }
    `,
    attributes: {
      points: [-4, -4, 0, 4, 4, -4]
    },
    uniforms: {
      src: regl.prop('src'),
      prefixShift: function (context, props) {
        return props.axis === 0 ?
          [-1.0 / context.framebufferWidth * props.shift, 0] :
          [0, -1.0 / context.framebufferHeight * props.shift];
      },
    },
    framebuffer: regl.prop('dest'),
    depth: {enable: false},
    count: 3,
  };

  function makeOp(params) {
    var op = extend(extend({}, baseOp), params);
    return regl(op);
  }

  identity = makeOp({
    frag: `
      precision mediump float;
      varying vec2 current;
      uniform sampler2D src;
      void main () {
        gl_FragColor = texture2D(src, current);
      }
    `,
    scissor: {
      enable: function (context, props) {
        if (props.scissor !== undefined) {
          return props.scissor;
        } else {
          return true;
        }
      },
      box: {
        x: function (context, props) {
          return props.axis === 0 ? Math.floor(props.shift / 2) : 0;
        },
        y: function (context, props) {
          return props.axis === 0 ? 0 : Math.floor(props.shift / 2);
        },
        width: function (context, props) {
          return props.axis === 0 ? props.shift : context.framebufferWidth;
        },
        height: function (context, props) {
          return props.axis === 0 ? context.framebufferHeight : props.shift;
        }
      }
    }
  });

  if (opts.map) {
    map = makeOp({
      frag: `
        precision mediump float;
        varying vec2 current;
        uniform sampler2D src;
        ${opts.map}
        void main () {
          //vec4 y = texture2D(src, current);
          //y.yzw += y.xyz;
          //y.zw += y.xy;
          //gl_FragColor = y;
          gl_FragColor = map(texture2D(src, current));
        }
      `
    });
  }

  reduce = makeOp({
    frag: `
      precision mediump float;
      varying vec2 current;
      varying vec2 prefix;
      uniform sampler2D src;
      ${opts.reduce}
      void main () {
        vec4 prefixVal = texture2D(src, prefix);
        vec4 sumVal = texture2D(src, current);
        gl_FragColor = reduce(prefixVal, sumVal);
      }
    `,
    scissor: {
      enable: true,
      box: {
        x: function (context, props) {
          return props.axis === 0 ? props.shift : 0;
        },
        y: function (context, props) {
          return props.axis === 0 ? 0 : props.shift;
        },
      }
    }
  });

  function swap (params) {
    var tmp = params.src;
    params.src = params.dest;
    params.dest = tmp;
  }

  function log (msg, params) {
    if (!opts.verbose) return;
    console.log(msg);
    params.src.use(function () {
      console.log('  src:   ' + show(ndarray(regl.read()).step(4)));
    });

    params.dest.use(function () {
      console.log('  dest:  ' + show(ndarray(regl.read()).step(4)));
    });
  }

  function compute (computeOpts) {
    var width = computeOpts.src.width;
    var height = computeOpts.src.height;
    var origDest = computeOpts.dest;

    var params = {
      src: computeOpts.src,
      dest: computeOpts.dest,
      axis: computeOpts.axis === undefined ? opts.axis : computeOpts.axis
    };

    log('input', params);

    if (opts.map) {
      map(params);

      log('map', params);

      swap(params);
    }

    log('swap', params);

    for (params.shift = 1; params.shift < width; params.shift *= 2) {
      identity(params);

      log('identity (shift: ' + params.shift + ')', params);

      reduce(params);

      log('reduce   (shift: ' + params.shift + ')', params);

      swap(params);
    }

    log('output', params);

    return {src: params.dest, dest: params.src};
  }

  function destroy () {
    if (opts.map) {
      map.destroy();
    }
    identity.destroy();
    reduce.destroy();
  }

  return {
    compute: compute,
    destroy: destroy
  }
};
