const glsl = require('glslify');

module.exports = function (regl) {
  return regl({
    vert: `
      precision mediump float;
      attribute vec2 bt;
      varying vec2 uv;
      void main () {
        uv = bt * 0.5 + 0.5;
        gl_Position = vec4(bt, 0, 1);
      }
    `,
    frag: glsl(`
      precision mediump float;

      #pragma glslify: tr = require(./transform)

      uniform sampler2D src, u;
      uniform vec4 xy2uv;
      uniform float dt;
      varying vec2 uv;

      void main () {
        // Sample the xy coords:
        vec2 xy = texture2D(src, uv).xy;

        // Predict (midpoint integration):
        vec2 xy1 = xy + dt * 0.5 * texture2D(u, tr(xy, xy2uv)).xy;

        // Correct:
        xy1 = xy + dt * texture2D(u, tr(xy1, xy2uv)).xy;

        xy1.x = mod(xy1.x + 3.0, 2.0) - 1.0;


        // Euler integration:
        gl_FragColor = vec4(xy1, 0, 1);
      }
    `),
    attributes: {
      bt: [-4, -4, 0, 4, 4, -4]
    },
    uniforms: {
      u: regl.prop('u'),
      src: regl.prop('src')
    },
    framebuffer: regl.prop('dst'),
    depth: {enable: false},
    count: 3
  });
}
