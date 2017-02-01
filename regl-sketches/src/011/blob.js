const glslify = require('glslify');

module.exports = function (regl) {
  const ico = require('icosphere')(5);

  return regl({
    vert: glslify(`
      precision mediump float;
      #pragma glslify: snoise4 = require(glsl-noise/simplex/4d)
      #pragma glslify: matcap = require(matcap)

      uniform float st, scale, t;
      uniform mat4 projection, view;
      varying vec3 n, p;
      attribute vec3 xyz;//, normal;
      uniform vec3 eye;
      //varying vec2 uv;
      varying vec3 eyedir, normal;

      float noise (vec4 p, float t) {
        return scale * (pow(abs(snoise4(p)), 2.0) + 0.2 * sin(3.0 * p.y + 1.0 * t * 3.14159) * p.y);
      }

      void main () {
        //n = normal;
        vec3 p0 = xyz * (0.8 + 1.0 * scale);
        n = p0;
        p = p0;

        float freq = 2.0;
        float noisemag = noise(vec4(p * freq, st), t);

        float h = 0.001;
        vec3 np = p * freq;
        vec3 grad = (vec3(
          noise(vec4(np + vec3(h, 0, 0), st), t),
          noise(vec4(np + vec3(0, h, 0), st), t),
          noise(vec4(np + vec3(0, 0, h), st), t)
        ) - noisemag) / h;

        p += n * noisemag;
        n = normalize(p0 - grad * 0.8);

        mat3 view3 = mat3(view);
        eyedir = -view3 * normalize(eye - p);
        normal = view3 * normalize(n);

        gl_Position = projection * view * vec4(p, 1);
      }
    `),
    frag: glslify(`
      precision mediump float;
      #pragma glslify: matcap = require(matcap)
      uniform mat4 view;
      uniform float tween;
      uniform sampler2D texture0;
      uniform sampler2D texture1;
      //varying vec2 uv;
      varying vec3 eyedir, normal;

      varying vec3 n, p;
      uniform vec3 eye;
      void main () {
        vec2 uv = matcap(eyedir, normal);

        vec3 col = mix(
          texture2D(texture0, uv).xyz,
          texture2D(texture1, uv).xyz,
          tween
        );

        //float hot = smoothstep(1.55, 8.0, dot(p, p));
        //col = mix(col, vec3(10), hot);

        gl_FragColor = vec4(col, 1);
      }
    `),
    attributes: {
      xyz: ico.positions,
      //normal: require('angle-normals')(ico.cells, ico.positions)
    },
    uniforms: {
      st: regl.prop('scaledTime'),
      t: regl.prop('t'),
      scale: regl.prop('scale'),
      texture0: regl.prop('texture0'),
      texture1: regl.prop('texture1'),
      tween: regl.prop('tween')
    },
    elements: ico.cells,
    count: ico.cells.length * 3
  });
};
