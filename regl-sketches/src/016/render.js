const glsl = require('glslify');

module.exports = function (regl) {
  return regl({
    vert: `
      precision mediump float;
      attribute vec2 position;
      varying vec2 xy;
      void main () {
        xy = position;
        gl_Position = vec4(xy, 0, 1);
      }
    `,
    frag: glsl(`
      precision mediump float;

      #pragma glslify: lambert = require(glsl-diffuse-lambert)
      #pragma glslify: cookTorrance = require(glsl-specular-cook-torrance)

      varying vec2 xy;
      uniform mat4 iprojection, iview;
      uniform vec3 eye;
      uniform sampler2D color[4];

      struct Light {
        vec3 position;
        vec3 color;
      };

      const int nLight = 2;
      uniform Light lights[nLight];

      void main () {
        vec2 uv = xy * 0.5 + 0.5;
        vec4 c0 = texture2D(color[0], uv);

        // This in no was exits early, does it?
        if (c0.w == 1.0) {
          discard;
          return;
        }

        // Sample the textures:
        vec4 c1 = texture2D(color[1], uv);
        vec4 c2 = texture2D(color[2], uv);
        vec4 c3 = texture2D(color[3], uv);

        // Reconstruct the position from the depth:
        vec4 p = iprojection * vec4(xy, c0.w * 2.0 - 1.0, 1.0);
        vec3 position = (iview * (p / p.w)).xyz;

        vec3 normal = normalize(c0.xyz);
        vec3 diffuse = c1.rgb;
        vec3 ambient = c2.rgb;

        // Extract specular properties:
        float specular = c3.x;
        float roughness = c3.y;
        float fresnel = c3.z;

        // Start with ambient light, then add point lights:
        vec3 light = ambient;
        vec3 eyeDir = normalize(eye - position);

        for (int i = 0; i < nLight; i++) {
          vec3 lightDir = normalize(lights[i].position - position);

          light += lights[i].color * (
            diffuse * lambert(lightDir, normal) +
            specular * cookTorrance(lightDir, eyeDir, normal, roughness, fresnel)
          );
        }

        gl_FragColor = vec4(light, 1);
      }
    `),
    uniforms: {
      'color[0]': regl.prop('data[0]'),
      'color[1]': regl.prop('data[1]'),
      'color[2]': regl.prop('data[2]'),
      'color[3]': regl.prop('data[3]'),
    },
    attributes: {position: [[-4, -4], [0, 4], [4, -4]]},
    depth: {enable: false},
    count: 3
  });
};
