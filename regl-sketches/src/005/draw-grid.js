const glslify = require('glslify');

module.exports = function (regl, n) {
  return regl({
    vert: `
      precision mediump float;
      attribute vec2 xy;
      varying vec2 uv;
      varying vec3 n, p;
      uniform sampler2D ht;
      uniform vec2 h;
      uniform vec3 scale;
      uniform mat4 projection, view;
      void main () {
        vec2 uv = 0.5 * (1.0 + xy);
        vec3 p0 = texture2D(ht, uv).xyz;
        vec3 pn = texture2D(ht, uv + vec2(h.x, 0)).xyz * scale;
        vec3 ps = texture2D(ht, uv - vec2(h.x, 0)).xyz * scale;
        vec3 pe = texture2D(ht, uv + vec2(0, h.y)).xyz * scale;
        vec3 pw = texture2D(ht, uv - vec2(0, h.y)).xyz * scale;

        n = normalize(cross(pn - ps, pe - pw));
        p = vec3(xy, p0.z) * scale;

        gl_Position = projection * view * vec4(p, 1);
      }
    `,
    frag: glslify (`
      precision mediump float;

      #pragma glslify: lambert = require('glsl-diffuse-lambert');

      struct Light {
        vec3 color;
        vec3 position;
      };

      varying vec3 n, p;
      uniform vec3 ambient;
      uniform Light lambertLights[2];

      void main () {
        vec3 color = ambient +
          lambert(normalize(lambertLights[0].position - p), n) * lambertLights[0].color +
          lambert(normalize(lambertLights[1].position - p), n) * lambertLights[1].color;
        gl_FragColor = vec4(color, 1);
      }
    `),
    elements: regl.prop('elements'),
    attributes: {xy: regl.prop('positions')},
    uniforms: {
      ht: regl.prop('hf'),
      h: (context, props) => [
        1 / props.hf.width,
        1 / props.hf.height
      ],
      ambient: regl.prop('ambient'),
      'lambertLights[0].color': regl.prop('lambertLights[0].color'),
      'lambertLights[0].position': regl.prop('lambertLights[0].position'),
      'lambertLights[1].color': regl.prop('lambertLights[1].color'),
      'lambertLights[1].position': regl.prop('lambertLights[1].position'),
    },
    count: (context, props) => props.nel
  });
};
