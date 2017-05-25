const glsl = require('glslify');
const mat4 = require('gl-mat4');

module.exports = function (regl) {
  return regl({
    vert: `
      precision lowp float;
      attribute vec2 xy;
      uniform mat4 model;
      varying vec2 uv;
      uniform mat4 view;
      void main () {
        uv = xy;
        gl_Position = view * model * vec4(xy, 0, 1);
      }
    `,
    frag: glsl(`
      #extension GL_OES_standard_derivatives : enable
      precision lowp float;

      #pragma glslify: hypot = require(glsl-hypot)
      #pragma glslify: arrow = require(./arrow)

      varying vec2 uv;
      uniform float tailWidth, tailLength, border, aspectRatio;

      float debugSdf (float dist, float scale) {
        return (dist > 0.0 ? 0.5 : 0.0) + 0.5 * fract(-dist / 40.0 * scale * aspectRatio);
      }

      void main () {
        float sdf = arrow(uv, tailLength, tailWidth, aspectRatio);
        float dx = dFdx(sdf);
        float dy = dFdy(sdf);
        float wid = inversesqrt(dx * dx + dy * dy);
        float sdfScaled = sdf * wid;
        float alpha = smoothstep(0.0, -1.0, sdfScaled);
        float color = smoothstep(-border, -border + 1.0, sdfScaled);

        gl_FragColor = vec4(vec3(color), 0.8 * alpha + 0.2 * debugSdf(sdf, wid / aspectRatio));
      }
    `),
    depth: {enable: false},
    blend: {
      enable: true,
      func: {
        srcRGB: 'src alpha',
        srcAlpha: 1,
        dstRGB: 'one minus src alpha',
        dstAlpha: 1
      },
      equation: {rgb: 'add', alpha: 'add'}
    },
    attributes: {
      xy: [0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1],
    },
    count: 6
  });
}
