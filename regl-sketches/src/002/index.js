'use strict';

const glslify = require('glslify');
const lighting = require('./lighting');

require('regl')({
  extensions: ['oes_standard_derivatives'],
  onDone: (err, regl) => {
    if (err) return require('fail-nicely')(err);
    run(regl)
  }
});

function run(regl) {
  const size = [81, 81];
  const positions = [];
  const grid = [];
  const urange = [0, 5];
  const vrange = [0, Math.PI * 2];
  for (let j = 0; j < size[1]; j++) {
    for (let i = 0; i < size[0]; i++) {
      let r = 1 + 0.25 * Math.pow((urange[1] - urange[0]) * i / (size[0] - 1), 2);
      let th = Math.PI * 2 * j / (size[1] - 1);
      positions.push([
        r * Math.cos(th),
        2.0 * Math.sqrt(Math.abs(1.0 - r)) - 3,
        r * Math.sin(th)
      ]);

      grid.push([i, j]);
    }
  }

  const elements = [];
  for (let j = 0; j < size[1] - 1; j++) {
    for (let i = 0; i < size[0] - 1; i++) {
      let idx = i + size[0] * j;
      elements.push([idx, idx + 1, idx + size[0]]);
      elements.push([idx + size[0] + 1, idx + size[0], idx + 1]);
    }
  }

  const normals = require('angle-normals')(elements, positions);

  const lighting = require('./lighting')(regl, {
    lights: [
      {position: [-40, -200, -40], color: [0.6, 0.8, 1, 0.25], power: 2},
      {position: [40, -200, -40], color: [0.6, 1, 0.8, 0.25], power: 2},
      {position: [0, -200, 40], color: [1, 0.8, 0.6, 0.25], power: 2},
    ],
    ambient: [1, 1, 1, 0.5]
  });

  const drawMesh = regl({
    frag: glslify(`
      #extension GL_OES_standard_derivatives : enable
      #pragma glslify: blinnPhongSpec = require(glsl-specular-blinn-phong)

      precision mediump float;
      uniform vec2 stride;
      varying vec2 griduv;
      varying vec3 n;
      varying vec3 pos;

      uniform float light0power, light1power, light2power;
      uniform vec4 lightambient, light0color, light1color, light2color;
      uniform vec3 light0position, light1position, light2position;
      uniform vec3 eye;

      float grid (vec3 uv) {
        vec3 d = fwidth(uv);
        vec3 a3 = smoothstep(vec3(0.0), 1.5 * d, 0.5 - abs(mod(uv, 1.0) - 0.5));
        return min(a3.x, a3.y);
      }

      void main () {
        vec3 eyedir = normalize(eye - pos);
        vec3 normal = normalize(n);

        vec3 light = lightambient.xyz * lightambient.w;
        light += blinnPhongSpec(light0position - pos, eyedir, normal, light0power) * light0color.xyz * light0color.w;
        light += blinnPhongSpec(light1position - pos, eyedir, normal, light1power) * light1color.xyz * light1color.w;
        light += blinnPhongSpec(light2position - pos, eyedir, normal, light2power) * light2color.xyz * light2color.w;
        float ef = grid(vec3(griduv / stride, 0));
        vec3 col = vec3(0.7 + 0.2 * abs(normal));

        gl_FragColor = vec4(light * col * vec3(ef), 1.0);
      }
    `),
    vert: `
      precision mediump float;
      uniform mat4 projection, view;
      attribute vec3 xyz, normal;
      attribute vec2 grid;
      varying vec2 griduv;
      varying vec3 n, pos;

      void main () {
        griduv = grid;
        n = normal;
        pos = xyz;
        gl_Position = projection * view * vec4(xyz, 1);
      }
    `,
    uniforms: {stride: [10, 10]},
    attributes: {xyz: positions, normal: normals, grid: grid},
    elements: elements,
    count: elements.length * 3,
  });

  const camera = require('./camera')(regl, {
    phi: Math.PI  * 0.12,
    distance: 20
  });

  regl.frame(() => {
    lighting(() => {
      camera(() => {
        regl.clear({color: [0.2, 0.2, 0.2, 1], depth: 1});
        drawMesh();
      });
    });
  });
}
