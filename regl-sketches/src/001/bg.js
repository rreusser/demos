const glslify = require('glslify');

module.exports = function (regl) {
  return regl({
    vert: `
      precision mediump float;
      uniform mat4 iview;
      uniform float aspect;
      attribute vec2 xy;
      varying vec2 uv;
      varying vec3 dir;
      void main () {
        uv = 0.5 * (1.0 + xy);
        dir = (iview * vec4(xy * vec2(aspect, 1.0), -1, 0)).xyz;
        gl_Position = vec4(xy, 0, 1);
      }
    `,
    frag: glslify(`
      precision mediump float;
      #pragma glslify: snoise4 = require(glsl-noise/simplex/4d)

      uniform float t;
      varying vec2 uv;
      varying vec3 dir;
      void main () {
        vec3 ndir = normalize(dir);
        vec3 color = vec3(snoise4(vec4(ndir * 3.0, t)) + snoise4(vec4(ndir * 800.0, t)));
        gl_FragColor = vec4((0.75 + 0.075 * color) * (0.3 + 0.1 * ndir.y) * vec3(0.8, 0.95, 1.0), 1);
      }
    `),
    uniforms: {
      t: regl.prop('t'),
    },
    attributes: {xy: [[-4, -4], [0, 4], [4, -4]]},
    count: 3,
    depth: {enable: false}
  });
};
