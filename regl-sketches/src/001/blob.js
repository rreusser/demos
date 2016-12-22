const glslify = require('glslify');

module.exports = function (regl) {
  const ico = require('icosphere')(5);

  return regl({
    vert: glslify(`
      precision mediump float;
      #pragma glslify: snoise4 = require(glsl-noise/simplex/4d)

      uniform float st, scale, t;
      uniform mat4 projection, view;
      varying vec3 n, p;
      attribute vec3 xyz, normal;

      float noise (vec4 p, float t) {
        return pow(abs(snoise4(p)), 2.0) + 0.2 * sin(3.0 * p.y + 1.0 * t * 3.14159) * p.y;
      }

      void main () {
        n = normal;
        p = xyz * (0.8 + 1.0 * scale);

        float freq = 2.0;
        float n0 = noise(vec4(p * freq, st), t);

        float h = 0.01;
        vec3 np = p * freq;
        vec3 grad = (vec3(
          noise(vec4(np + vec3(h, 0, 0), st), t),
          noise(vec4(np + vec3(0, h, 0), st), t),
          noise(vec4(np + vec3(0, 0, h), st), t)
        ) - n0) / h;

        p *= 1.0 + scale * n0;
        n -= grad * scale * 0.5;
        n = normalize(n);

        gl_Position = projection * view * vec4(p, 1);
      }
    `),
    frag: glslify(`
      precision mediump float;
      #pragma glslify: blinnPhongSpec = require(glsl-specular-blinn-phong)

      varying vec3 n, p;
      uniform vec3 eye;
      uniform float light0power, light1power, light2power;
      uniform vec4 lightambient, light0color, light1color, light2color;
      uniform vec3 light0position, light1position, light2position;
      void main () {
        vec3 eyedir = normalize(eye - p);
        vec3 normal = normalize(n);

        vec3 light = lightambient.xyz * lightambient.w;
        light += blinnPhongSpec(light0position - p, eyedir, normal, light0power) * light0color.xyz * light0color.w;
        light += blinnPhongSpec(light1position - p, eyedir, normal, light1power) * light1color.xyz * light1color.w;
        light += blinnPhongSpec(light2position - p, eyedir, normal, light2power) * light2color.xyz * light2color.w;
        gl_FragColor = vec4(light, 1);
      }
    `),
    attributes: {
      xyz: ico.positions,
      normal: require('angle-normals')(ico.cells, ico.positions)
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
