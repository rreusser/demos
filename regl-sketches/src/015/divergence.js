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
        float vn = texture2D(src, vec2(uv.x, uv.y + duv.y)).y;
        float vs = texture2D(src, vec2(uv.x, uv.y - duv.y)).y;
        float ue = texture2D(src, vec2(uv.x + duv.x, uv.y)).x;
        float uw = texture2D(src, vec2(uv.x - duv.x, uv.y)).x;
        gl_FragColor = vec4(dot(vec2(ue - uw, vn - vs), der1), 0, 0, 1);
      }
    `,
    attributes: {xy: [-4, -4, 0, 4, 4, -4]},
    uniforms: {src: regl.prop('src')},
    framebuffer: regl.prop('dst'),
    depth: {enable: false},
    count: 3
  });
};
