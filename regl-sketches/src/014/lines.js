const glsl = require('glslify');

module.exports = function (regl, opts) {
  var m = opts.n[0];
  var n = opts.n[1];
  var uv = [];
  var l = [];

  for (let j = 0; j < n; j++) {
    for (let i = 0; i < m; i++) {
      uv.push([(i + 0.5) / m, (j + 0.5) / n, -0.5]);
      uv.push([(i + 0.5) / m, (j + 0.5) / n, 0.5]);
    }
  }

  return regl({
    vert: glsl(`
      precision mediump float;

      #pragma glslify: tr = require(./transform)

      attribute vec3 uv;
      uniform vec4 uv2cl, uv2xy, xy2cl;
      uniform sampler2D src;

      void main () {
        vec2 u = texture2D(src, uv.xy).xy;
        vec2 xy = tr(uv.xy, uv2xy) + u * 0.1 * uv.z;
        vec2 cl = tr(xy, xy2cl);
        gl_Position = vec4(cl, 0, 1);
      }
    `),
    frag: `
      precision mediump float;
      void main () {
        gl_FragColor = vec4(1);
      }
    `,
    depth: {
      enable: false,
    },
    attributes: {
      uv: uv,
      l: l,
    },
    uniforms: {
      src: regl.prop('src')
    },
    primitive: 'lines',
    count: uv.length
  });
};
