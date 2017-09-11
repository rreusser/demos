var glsl = require('glslify');

module.exports = function (regl) {
  return regl({
    vert: glsl(`
      precision mediump float;

      #pragma glslify

      attribute vec2 xy;
      varying vec2 uv;

      void main () {
        uv = xy * 0.5 + 0.5;
        gl_Position = vec4(xy, 0, 1);
      }
    `),
    frag: `
      precision mediump float;

      varying vec2 uv;
      uniform vec2 duv;
      uniform sampler2D src;
      uniform vec2 der1;

      void main () {
        float ve = texture2D(src, vec2(uv.x + duv.x, uv.y)).y;
        float vw = texture2D(src, vec2(uv.x - duv.x, uv.y)).y;
        float un = texture2D(src, vec2(uv.x, uv.y + duv.y)).x;
        float us = texture2D(src, vec2(uv.x, uv.y - duv.y)).x;
        gl_FragColor = vec4(dot(vec2(ve - vw, -(un - us)), der1), 0, 0, 1);
      }
    `,
    attributes: {xy: [-4, -4, 0, 4, 4, -4]},
    uniforms: {src: regl.prop('src')},
    framebuffer: regl.prop('dst'),
    depth: {enable: false},
    count: 3
  });
};
