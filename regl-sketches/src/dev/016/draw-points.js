const ndarray = require('ndarray');

module.exports = function (regl, lookup, x) {
  return regl({
    vert: `
      precision mediump float;
      attribute vec2 uv;
      uniform sampler2D src;
      void main () {
        vec2 xy = texture2D(src, uv).xy;
        gl_Position = vec4(xy, 0.0, 1.0);
        gl_PointSize = 2.0;
      }
    `,
    frag: `
      precision mediump float;
      void main () {
        gl_FragColor = vec4(1);
      }
    `,
    attributes: {
      uv: lookup
    },
    uniforms: {
      src: regl.prop('src'),
    },
    primitive: 'points',
    count: lookup.length
  });
}
