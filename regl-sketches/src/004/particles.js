const glslify = require('glslify');
const length = require('gl-vec3/length');

module.exports = function (regl) {
  window.regl = regl;
  return regl({
    vert: glslify(`
      precision mediump float;
      attribute vec2 xy;
      uniform sampler2D y;
      uniform sampler2D v;
      uniform mat4 view, projection;
      varying vec3 vel;
      void main () {
        vec3 pos = texture2D(y, xy).xyz;
        vel = texture2D(v, xy).xyz;
        gl_Position = projection * view * vec4(pos.xyz, 1);
        gl_PointSize = 2.0;
      }
    `),
    frag: glslify(`
      precision mediump float;
      #pragma glslify: hsv2rgb = require(glsl-hsv2rgb)
      uniform float alpha;
      varying vec3 vel;
      void main () {
        float vmag = (vel.x * vel.x + vel.y * vel.y + vel.z * vel.z);
        vec3 col = hsv2rgb(vec3(vmag * 1.0, 0.7, 1.0));
        gl_FragColor = vec4(col, alpha);
      }
    `),
    attributes: {xy: regl.prop('texCoords')},
    uniforms: {
      y: regl.prop('y[0]'),
      v: regl.prop('v[0]'),
      alpha: (context, props) => {
        let l = length(context.eye);
        return 0.002 * context.viewportHeight / l * Math.sqrt(16384 / props.n);
      }
    },
    depth: {enable: false},
    blend: {
      enable: true,
      func: {srcRGB: 'src alpha', srcAlpha: 1, dstRGB: 1, dstAlpha: 1},
      equation: {rgb: 'add', alpha: 'add'}
    },
    primitive: 'points',
    count: (context, props) => props.y[0].width * props.y[0].height,
  });
};
