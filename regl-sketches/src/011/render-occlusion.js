const glslify = require('glslify');

module.exports = function (regl) {
  const ico = require('icosphere')(5);

  return regl({
    vert: glslify(`
      precision mediump float;
      #pragma glslify: snoise4 = require(glsl-noise/simplex/4d)

      uniform float st, scale, t;
      uniform mat4 projection, view;
      varying vec3 p;
      attribute vec3 xyz;

      float noise (vec4 p, float t) {
        return scale * (pow(abs(snoise4(p)), 2.0) + 0.2 * sin(3.0 * p.y + 1.0 * t * 3.14159) * p.y);
      }

      void main () {
        vec3 p0 = xyz * (0.8 + 1.0 * scale);
        p = p0;
        float freq = 2.0;
        float noisemag = noise(vec4(p * freq, st), t);
        p += p0 * noisemag;
        gl_Position = projection * view * vec4(p, 1);
      }
    `),
    frag: glslify(`
      precision mediump float;
      varying vec3 p;
      void main () {
        gl_FragColor = vec4(vec3(smoothstep(1.6, 1.7, dot(p, p))), 1.0);
      }
    `),
    attributes: {
      xyz: ico.positions,
    },
    uniforms: {
      st: regl.prop('scaledTime'),
      t: regl.prop('t'),
      scale: regl.prop('scale')
    },
    elements: ico.cells,
    count: ico.cells.length * 3
  });
};
