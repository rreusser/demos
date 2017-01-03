const glslify = require('glslify');

module.exports = function (regl, n) {
  return regl({
    vert: `
      precision mediump float;
      attribute vec2 xy;
      varying vec2 uv;
      varying vec3 n, p;
      varying float laplacian;
      varying vec2 gradient;
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

        float lapScale = 4.0;
        float hx = h.x * lapScale;
        float hy = h.y * lapScale;
        float p20 = texture2D(ht, uv).z;
        float p2n = texture2D(ht, uv + vec2(hx, 0)).z;
        float p2s = texture2D(ht, uv - vec2(hx, 0)).z;
        float p2e = texture2D(ht, uv + vec2(0, hy)).z;
        float p2w = texture2D(ht, uv - vec2(0, hy)).z;
        laplacian = (p2e + p2w - 2.0 * p20) / hx / hx + (p2n + p2s - 2.0 * p20) / hy / hy;
        gradient = vec2((p2e - p2w) * 0.5 / hx, (p2n - p2s) * 0.5 / hy);

        n = normalize(cross(pn - ps, pe - pw));
        p = vec3(xy, p0.z) * scale;

        gl_Position = projection * view * vec4(p, 1);
      }
    `,
    frag: glslify (`
      #extension GL_OES_standard_derivatives : enable

      precision mediump float;

      #pragma glslify: lambert = require('glsl-diffuse-lambert');
      #pragma glslify: snoise = require('glsl-noise/simplex/2d');
      #pragma glslify: snoise3 = require('glsl-noise/simplex/3d');

      float grid (vec3 uv) {
        vec3 d = fwidth(uv);
        vec3 a3 = smoothstep(vec3(0.0), 1.5 * d, 0.5 - abs(mod(uv, 1.0) - 0.5));
        return a3.x;
      }

      struct Light {
        vec3 color;
        vec3 position;
      };

      uniform float topo, topoSpacing, stratification, snowLine, treeLine, rockiness;
      varying vec3 n, p;
      varying float laplacian;
      varying vec2 gradient;
      uniform vec3 ambient;
      uniform Light lambertLights[2];

      vec3 terrain (vec3 p, float lap, vec2 grad) {
        float noise = snoise(p.xy * 9.0);
        float noise2 = snoise(p.xy * 1.0);
        float strat = snoise3(vec3(p.x * 1.5, p.y * 1.5, (p.z - 0.4 * p.x - 0.4 * p.y) * 10.0)) * (1.0 + 1.0 * stratification);
        float htfac = exp(-p.z / 1.4);

        float snowEdge =
          0.1 * noise +
          0.1 * noise2 +
          0.0015 * laplacian * smoothstep(0.0, 2.0, p.z);

        float rockExposure =
          smoothstep(1.0, 1.3,
            (10.0 - rockiness) / length(gradient - vec2(0.0, 0.3 * p.z)) +
            snowEdge
          );

        float snow =
          smoothstep(snowLine - 2.0, snowLine - 1.6,
            p.z +
            snowEdge
          ) * rockExposure;

        float trees = smoothstep(treeLine, treeLine - 0.5,
          p.z -
          0.002 * laplacian +
          0.2 * noise +
          0.2 * noise2 +
          0.5 * length(grad + vec2(0.0, 1.0))
        ) * rockExposure;

        vec3 snowColor = vec3(1.0);

        vec3 treeColor = vec3(0.58, 0.65, 0.45) *
          (0.95 + 0.05 * noise) *
          (0.8 - 0.0003 * laplacian);

        vec3 rockColor = vec3(0.7) *
          (0.8 - max(-0.1, min(0.2, 0.0002 * laplacian))) *
          (0.97 + 0.03 * strat);

        return
          (
            snow * snowColor +
            (1.0 - snow) * (
              (1.0 - trees) * rockColor +
              trees * treeColor
            )
          );
      }

      void main () {
        vec3 color = terrain(p, laplacian, gradient);
        color *= ambient +
          lambert(normalize(lambertLights[0].position - p), n) * lambertLights[0].color +
          lambert(normalize(lambertLights[1].position - p), n) * lambertLights[1].color;
        if (topo > 0.0) {
          color *= 1.0 - topo + topo * grid(vec3(p.z / topoSpacing, 0.5, 0.5));
        }
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
      topo: regl.prop('topo'),
      topoSpacing: regl.prop('topoSpacing'),
      snowLine: regl.prop('snowLine'),
      rockiness: regl.prop('rockiness'),
      treeLine: regl.prop('treeLine'),
      stratification: regl.prop('stratification'),
      ambient: regl.prop('ambient'),
      'lambertLights[0].color': regl.prop('lambertLights[0].color'),
      'lambertLights[0].position': regl.prop('lambertLights[0].position'),
      'lambertLights[1].color': regl.prop('lambertLights[1].color'),
      'lambertLights[1].position': regl.prop('lambertLights[1].position'),
    },
    count: (context, props) => props.nel
  });
};
