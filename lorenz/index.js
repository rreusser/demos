const regl = require('regl')({extensions: ['OES_texture_float'], pixelRatio: 1.0});
const gpgpu = require('../regl-cwise')(regl);
const length = require('gl-vec3/length');
const h = require('h');
var fs = require('fs');
require('insert-css')(fs.readFileSync(__dirname + '/index.css', 'utf8'));

var attractor = 'lorenz';

const btns = [
  h('button.selected', {'data-attractor': 'lorenz'}, 'Lorenz'),
  h('button', {'data-attractor': 'rossler'}, 'Rössler'),
  h('button', {'data-attractor': 'chua'}, 'Chua'),
  h('button', {'data-attractor': 'ikeda'}, 'Ikeda'),
  h('button', {'data-attractor': 'pickover'}, 'Pickover'),
];
document.body.appendChild(h('div.selector', btns));

btns.forEach(btn =>
  btn.addEventListener('click', function () {
    btns.forEach(b => b === btn ?  b.classList.add('selected') : b.classList.remove('selected'));
    attractor = btn.getAttribute('data-attractor');
  })
);

const shape = [600, 600, 4];
const n = shape[0] * shape[1];
const y1 = gpgpu.array(null, shape);
const y2 = gpgpu.array((i, j) => [
  2 + (Math.random() * 2 - 1) * 10.1,
  2 + (Math.random() * 2 - 1) * 10.1,
  28 + (Math.random() * 2 - 1) * 10.1,
  1.0
], shape);

const attractors = {
  lorenz: gpgpu.map({
    args: ['array', 'scalar'],
    permute: [1, 0, 2],
    body: `
      vec4 deriv (vec4 p) {
        return vec4(
          10.0 * (p.y - p.x),
          p.x * (28.0 - p.z) - p.y,
          p.x * p.y - 8.0 /  3.0 * p.z,
          0.0
        );
      }
      vec4 compute (vec4 y, float dt) {
        return y + dt * deriv(y + 0.5 * dt * deriv(y));
      }
    `,
  }),
  rossler: gpgpu.map({
    args: ['array', 'scalar'],
    permute: [1, 0, 2],
    body: `
      vec4 deriv (vec4 p) {
        return 4.0 * vec4(
          -p.y - (p.z - 28.0),
          p.x + 0.1 * p.y,
          0.1 + (p.z - 28.0) * (p.x - 14.0),
          0.0
        );
      }
      vec4 compute (vec4 y, float dt) {
        return y + dt * deriv(y + 0.5 * dt * deriv(y));
      }
    `,
  }),
  chua: gpgpu.map({
    args: ['array', 'scalar'],
    permute: [1, 0, 2],
    body: `
      vec4 deriv (vec4 p) {
        return vec4(
          40.0 * (p.y - p.x),
          -12.0 * p.x - p.x * p.z + 28.0 * p.y,
          p.x * p.y - 3.0 * p.z,
          0.0
        );
      }
      vec4 compute (vec4 y, float dt) {
        y.z -= 10.0;
        y = y + dt * 0.5 * deriv(y + 0.25 * dt * deriv(y));
        y.z += 10.0;
        return y;
      }
    `,
  }),
  ikeda: gpgpu.map({
    args: ['array', 'scalar'],
    permute: [1, 0, 2],
    body: `
      const float a = 1.0;
      const float b = 0.9;
      const float c = 0.4;
      const float d = 6.0;
      vec4 deriv (vec4 p) {
        return vec4(
          a + b * (p.x * cos(p.z) - p.y * sin(p.z)),
          b * (p.x * sin(p.z) + p.y * cos(p.z)),
          c - d / (1.0 + p.x * p.x + p.y * p.y),
          0.0
        );
      }
      vec4 compute (vec4 y, float dt) {
        y.z -= 10.0;
        y = y + dt * 2.0 * deriv(y + dt * deriv(y));
        y.z += 10.0;
        return y;
      }
    `,
  }),
  pickover: gpgpu.map({
    args: ['array', 'scalar'],
    permute: [1, 0, 2],
    body: `
      const float a = 2.24;
      const float b = 0.43;
      const float c = -0.65;
      const float d = -2.43;
      vec4 deriv (vec4 p) {
        return vec4(
          sin(a * p.x) - p.z * cos(b * p.y),
          p.z * sin(c * p.x) - cos(d * p.y),
          1.0 / sin(p.x),
          0.0
        );
      }
      vec4 compute (vec4 y, float dt) {
        y.z -= 28.0;
        y = y + dt * deriv(y + 0.5 * dt * deriv(y));
        y.z += 28.0;
        return y;
      }
    `,
  })
};

const camera = require('regl-camera')(regl, {
  center: [0, 28, 0],
  distance: 100,
  damping: 0
});

const uv = y1.samplerCoords();
const args = [y1, y2, 0.01];

const drawPointsFromTexture = regl({
  frag: `
    precision mediump float;
    uniform vec4 color;
    void main() {
      gl_FragColor = color;
    }
  `,
  vert: `
    precision mediump float;
    attribute vec2 xy;
    uniform sampler2D points;
    uniform mat4 projection, view;
    void main() {
      vec4 pt = texture2D(points, xy).xzyw;
      gl_Position = projection * view * pt;
      gl_PointSize = 1.0;
    }
  `,
  attributes: {xy: regl.prop('sampleAt')},
  uniforms: {
    points: regl.prop('data'),
    color: regl.prop('color')
  },
  blend: {
    enable: true,
    func: {srcRGB: 'src alpha', srcAlpha: 1, dstRGB: 1, dstAlpha: 1},
    equation: {rgb: 'add', alpha: 'add'}
  },
  depth: {enable: false},
  primitive: 'points',
  count: regl.prop('count')
});

regl.frame(({tick}) => {
  attractors[attractor](args);

  regl.clear({color: [0, 0, 0, 1]});

  camera((context) => {
    let opac = Math.atan(1 / length(context.eye)) * context.viewportHeight * 0.02;
    drawPointsFromTexture({
      count: n,
      data: args[0],
      sampleAt: uv,
      color: [0.3, 0.7, 1, opac]
    });
  });
});

document.querySelector('canvas').addEventListener('wheel', function (e) {e.preventDefault();});
