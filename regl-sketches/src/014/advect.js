const glsl = require('glslify');

module.exports = function (regl) {
  return regl({
    vert: glsl(`
      precision mediump float;

      attribute vec2 cl;
      varying vec2 uv;
      uniform vec4 cl2uv;

      #pragma glslify: tr = require(./transform)

      void main () {
        uv = tr(cl, cl2uv);
        gl_Position = vec4(cl, 0, 1);
      }
    `),
    frag: glsl(`
      precision mediump float;
      varying vec2 uv;
      uniform sampler2D u, src;
      uniform vec4 uv2xy, xy2uv;
      uniform float dt;

      #pragma glslify: tr = require(./transform)
      #pragma glslify: force = require(./force)

      void main () {
        // Sample the velocity at this point:
        vec3 u = texture2D(u, uv).xyz;
        float T = u.z;
        vec2 xy = tr(uv, uv2xy);
        vec2 uvd = tr(xy - u.xy * dt, xy2uv);

        vec3 f = force(xy, T);

        gl_FragColor = vec4(texture2D(src, uvd).xyz + f * dt, 1);
      }
    `),
    attributes: {
      cl: [[-4, -4], [0, 4], [4, -4]]
    },
    uniforms: {
      u: regl.prop('u'),
      src: regl.prop('src'),
    },
    framebuffer: regl.prop('dst'),
    depth: {enable: false},
    count: 3
  });
}
