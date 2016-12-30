const glslify = require('glslify');

module.exports = function (regl, opts) {
  const radius = opts.radius;
  const res = [51, 51];
  const elements = [];
  const positions = [];

  for (let j = 0; j < res[1] - 1; j++) {
    for (let i = 0; i < res[0] - 1; i++) {
      let idx = i + res[0] * j;
      elements.push([idx, idx + 1, idx + res[0]]);
      elements.push([idx + res[0] + 1, idx + res[0], idx + 1]);
    }
  }

  let clustering = 5.0;
  const rrange = [0, 1];
  for (let j = 0; j < res[1]; j++) {
    for (let i = 0; i < res[0]; i++) {
      let r = 1 + Math.pow((rrange[1] - rrange[0]) * i / (res[0] - 1), 4);
      let th = Math.PI * 2 * j / (res[1] - 1);
      let u = r * Math.cos(th);
      let v = r * Math.sin(th);
      positions.push([u, v, 0]);
    }
  }

  return regl({
    vert: glslify(`
      #pragma glslify: flamm = require(./flamms-paraboloid);

      precision mediump float;
      attribute vec3 pos;
      varying vec2 xy;
      varying float rad;
      uniform float rs, paraboloid, rmax;
      uniform mat4 projection, view;
      void main () {
        float r = length(pos.xy);
        vec2 er = pos.xy / r;

        rad = rs + (rmax - rs) * (r - 1.0) + 1e-4;
        xy = er * rad;

        float z = flamm(rs, rad) - flamm(rs, 20.0);
        z *= paraboloid;
        gl_Position = projection * view * vec4(xy, z, 1);
      }
    `),
    frag: `
      #extension GL_OES_standard_derivatives : enable
      precision mediump float;
      uniform vec2 spacing;
      varying vec2 xy;
      varying float rad;
      uniform vec4 gridBg, gridFg;
      uniform float radius, alpha, rmax;

      float grid (vec3 uv) {
        vec3 d = fwidth(uv);
        vec3 a3 = smoothstep(vec3(0.0), 1.5 * d, 0.5 - abs(mod(uv, 1.0) - 0.5));
        return min(a3.x, a3.y);
      }

      void main () {
        float ef = grid(vec3(xy / spacing, 0));
        float falloff = 1.0 / (1.0 + rad * rad / rmax / rmax * 64.0);
        vec4 col = (ef * gridBg + (1.0 - ef) * (falloff * alpha * gridFg + (1.0 - falloff * alpha) * gridBg));
        gl_FragColor = vec4(col.xyz, 1);
      }
    `,
    attributes: {
      pos: positions,
    },
    depth: {
      enable: (context, props) => props.paraboloid > 1e-4 ? true : false
    },
    blend: {
      enable: true,
      func: {srcRGB: 'src alpha', srcAlpha: 1, dstRGB: 'one minus src alpha', dstAlpha: 1},
      equation: {rgb: 'add', alpha: 'add'}
    },
    uniforms: {
      spacing: (context, props) => [props.gridSpacing, props.gridSpacing],
      radius: regl.prop('gridRadius'),
      gridBg: regl.prop('gridBg'),
      gridFg: regl.prop('gridFg'),
      alpha: regl.prop('gridAlpha'),
      paraboloid: regl.prop('paraboloid'),
      rs: regl.prop('rs'),
      rmax: 500
    },
    elements: elements,
    count: elements.length * 3
  });
};
