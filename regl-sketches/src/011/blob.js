const glslify = require('glslify');

module.exports = function (regl) {
  const ico = require('icosphere')(5);

  return regl({
    vert: glslify(`
      precision mediump float;
      #pragma glslify: bump = require(./bump)
      #pragma glslify: matcap = require(matcap)

      uniform float st, scale, t;
      uniform mat4 projection, view;
      varying vec3 n, p;
      attribute vec3 xyz;//, normal;
      uniform vec3 eye;
      //varying vec2 uv;
      varying vec3 eyedir, normal;
      varying float noisemag;

      void main () {
        //n = normal;
        vec3 p0 = xyz * (0.8 + 1.0 * scale);
        n = p0;
        p = p0;

        float freq = 2.0;
        noisemag = bump(vec4(p * freq, st), t, scale);

        float h = 0.001;
        vec3 np = p * freq;
        vec3 grad = (vec3(
          bump(vec4(np + vec3(h, 0, 0), st), t, scale),
          bump(vec4(np + vec3(0, h, 0), st), t, scale),
          bump(vec4(np + vec3(0, 0, h), st), t, scale)
        ) - noisemag) / h;

        p = p0 * noisemag;
        n = normalize(p0 - grad * 0.8);

        mat3 view3 = mat3(view);
        eyedir = view3 * normalize(p - eye);
        normal = view3 * normalize(n);

        gl_Position = projection * view * vec4(p, 1);
      }
    `),
    frag: glslify(`
      precision mediump float;
      #pragma glslify: matcap = require(matcap)
      #pragma glslify: hotspot = require(./hotspot)
      uniform mat4 view;
      uniform float tween;
      uniform sampler2D texture0;
      uniform sampler2D texture1;
      uniform float t;
      //varying vec2 uv;
      varying vec3 eyedir, normal;
      varying float noisemag;

      varying vec3 n, p;
      uniform vec3 eye;
      void main () {
        vec2 uv = matcap(eyedir, normal);

        vec3 col = mix(
          texture2D(texture0, uv).xyz,
          texture2D(texture1, uv).xyz,
          tween
        );

        float hot = hotspot(noisemag - 1.0);
        col = mix(col, vec3(1.2, 1.1, 1.0), hot);

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
