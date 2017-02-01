'use strict';

var glsl = require('glslify');

module.exports = function (regl) {
  return regl({
    vert: `
      precision mediump float;
      attribute vec2 xy;
      varying vec2 uv;
      void main () {
        uv = 0.5 * (1.0 + xy);
        gl_Position = vec4(xy, 0, 1);
      }
    `,
    frag: glsl(`
      precision mediump float;
      #pragma glslify: godrays = require(glsl-godrays)

      varying vec2 uv;
      uniform sampler2D src;
      void main () {

        vec3 rays = godrays(
          1.0,
          0.02,
          1.0,
          1.0,
          25,
          src,
          vec2(0.5, 0.5),
          uv
        );

        float alpha = texture2D(src, uv).x;

        gl_FragColor = vec4(vec3(1.0), rays.x);
      }
    `),
    blend: {
      enable: true,
      func: {srcRGB: 'src alpha', srcAlpha: 1, dstRGB: 1, dstAlpha: 1},
      equation: {rgb: 'add', alpha: 'add'}
    },
    attributes: {
      xy: [[-4, -4], [0, 4], [4, -4]]
    },
    uniforms: {
      src: regl.prop('src'),
    },
    depth: {enable: false},
    count: 3
  });
};
