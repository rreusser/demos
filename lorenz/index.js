const regl = require('regl')({extensions: ['OES_texture_float'], pixelRatio: 1.0});
const gpgpu = require('../regl-cwise')(regl);
const length = require('gl-vec3/length');
const h = require('h');
const fs = require('fs');
require('insert-css')(fs.readFileSync(__dirname + '/index.css', 'utf8'));

var attractor = 'lorenz';

const btns = [
  h('button.selected', {'data-attractor': 'lorenz'}, 'Lorenz'),
  h('button', {'data-attractor': 'rossler'}, 'Rössler'),
  h('button', {'data-attractor': 'chua'}, 'Chua'),
  h('button', {'data-attractor': 'arneodo'}, 'Arneodo'),
  h('button', {'data-attractor': 'chenlee'}, 'Chen-Lee'),
  h('button', {'data-attractor': 'coullet'}, 'Coullet'),
  h('button', {'data-attractor': 'dadras'}, 'Dadras'),
  h('button', {'data-attractor': 'aizawa'}, 'Aizawa'),
  h('button', {'data-attractor': 'thomas'}, 'Thomas'),
  h('button', {'data-attractor': 'tsucs2'}, 'TSUCS2'),
  h('button', {'data-attractor': 'rayleighbenard'}, 'Rayleigh-Benard'),
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
  0 + (Math.random() * 2 - 1) * 0.5,
  0 + (Math.random() * 2 - 1) * 0.5,
  28 + (Math.random() * 2 - 1) * 0.5,
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
  arneodo: gpgpu.map({
    args: ['array', 'scalar'],
    permute: [1, 0, 2],
    body: `
      const float mu = 1.2;
      const float nu = 0.5;
      vec4 deriv (vec4 p) {
        return vec4(
          p.y,
          p.z,
          5.5 * p.x - 3.5 * p.y - p.z - p.x * p.x * p.x,
          0.0
        );
      }
      vec4 compute (vec4 y, float dt) {
        y.z -= 28.0;
        y = y + dt * 1.0 * deriv(y + 0.5 * dt * deriv(y));
        float r = length(y.xyz);
        if (r > 1000.0) {
          y.xyz /= r;
        }
        y.z += 28.0;
        return y;
      }
    `,
  }),
  chenlee: gpgpu.map({
    args: ['array', 'scalar'],
    permute: [1, 0, 2],
    body: `
      const float mu = 1.2;
      const float nu = 0.5;
      vec4 deriv (vec4 p) {
        return vec4(
          5.0 * p.x - p.y * p.z,
          -10.0 * p.y + p.x * p.z,
          -0.38 * p.z + p.x * p.y / 3.0,
          0.0
        );
      }
      vec4 compute (vec4 y, float dt) {
        y.z -= 28.0;
        y = y + dt * 1.0 * deriv(y + 0.5 * dt * deriv(y));
        float r = length(y.xyz);
        if (r > 1000.0) {
          y.xyz /= r;
        }
        y.z += 28.0;
        return y;
      }
    `,
  }),
  coullet: gpgpu.map({
    args: ['array', 'scalar'],
    permute: [1, 0, 2],
    body: `
      vec4 deriv (vec4 p) {
        return vec4(
          p.y,
          p.z,
          0.8 * p.x - 1.1 * p.y - 0.45 * p.z - p.x * p.x * p.x,
          0.0
        );
      }
      vec4 compute (vec4 y, float dt) {
        y.z -= 28.0;
        y *= 0.1;
        y = y + dt * 4.0 * deriv(y + 2.0 * dt * deriv(y));
        float r = length(y.xyz);
        if (r > 1000.0) {
          y.xyz /= r;
        }
        y /= 0.1;
        y.z += 28.0;
        return y;
      }
    `,
  }),
  dadras: gpgpu.map({
    args: ['array', 'scalar'],
    permute: [1, 0, 2],
    body: `
      vec4 deriv (vec4 p) {
        return vec4(
          p.y - 3.0 * p.x + 2.7 * p.y * p.z,
          1.7 * p.y - p.x * p.z + p.z,
          2.0 * p.x * p.y - 9.0 * p.z,
          0.0
        );
      }
      vec4 compute (vec4 y, float dt) {
        y.z -= 28.0;
        y *= 0.4;
        y = y + dt * 2.0 * deriv(y + dt * deriv(y));
        float r = length(y.xyz);
        if (r > 1000.0) {
          y.xyz /= r;
        }
        y /= 0.4;
        y.z += 28.0;
        return y;
      }
    `,
  }),
  thomas: gpgpu.map({
    args: ['array', 'scalar'],
    permute: [1, 0, 2],
    body: `
      vec3 deriv (float x, float y, float z) {
        return vec3(
          -0.19 * x + sin(y),
          -0.19 * y + sin(z),
          -0.19 * z + sin(x)
        );
      }
      vec4 compute (vec4 y, float dt) {
        dt *= 8.0;
        y.z -= 28.0;
        y.xyz *= 0.2;
        vec3 ytmp = y.xyz + 0.5 * dt * deriv(y.x, y.y, y.z);
        y.xyz = y.xyz + dt * deriv(ytmp.x, ytmp.y, ytmp.z);
        float r = length(y.xyz);
        y.xyz /= 0.2;
        y.z += 28.0;
        return y;
      }
    `,
  }),
  tsucs2: gpgpu.map({
    args: ['array', 'scalar'],
    permute: [1, 0, 2],
    body: `
      vec3 deriv (float x, float y, float z) {
        return vec3(
          40.0 * (y - x) + 0.16 * x * z,
          55.0 * x - x * z + 20.0 * y,
          1.833 * z + x * y - 0.65 * x * x
        );
      }
      vec4 compute (vec4 y, float dt) {
        dt *= 0.1;
        y.z -= 8.0;
        y.xyz /= 0.15;
        vec3 ytmp = y.xyz + 0.5 * dt * deriv(y.x, y.y, y.z);
        y.xyz = y.xyz + dt * deriv(ytmp.x, ytmp.y, ytmp.z);
        //float r = length(y.xyz);
        y.xyz *= 0.15;
        y.z += 8.0;
        return y;
      }
    `,
  }),
  rayleighbenard: gpgpu.map({
    args: ['array', 'scalar'],
    permute: [1, 0, 2],
    body: `
      vec3 deriv (float x, float y, float z) {
        return vec3(
          9.0 * (y - x),
          12.0 * x - y - x * z,
          x * y - 0.5 * z
        );
      }
      vec4 compute (vec4 y, float dt) {
        dt *= 2.0;
        //y.z -= 18.0;
        y.xyz /= 2.5;
        vec3 ytmp = y.xyz + 0.5 * dt * deriv(y.x, y.y, y.z);
        y.xyz = y.xyz + dt * deriv(ytmp.x, ytmp.y, ytmp.z);
        //float r = length(y.xyz);
        y.xyz *= 2.5;
        //y.z += 18.0;
        return y;
      }
    `,
  }),
  aizawa: gpgpu.map({
    args: ['array', 'scalar'],
    permute: [1, 0, 2],
    body: `
      vec3 deriv (float x, float y, float z) {
        return vec3(
          (z - 0.7) * x - 3.5 * y,
          3.5 * x + (z - 0.7) * y,
          0.6 + 0.95 * z - (z * z * z / 3.0) - (x * x + y * y) * (1.0 + 0.25 * z) + 0.1 * z * (x * x * x)
        );
      }
      vec4 compute (vec4 y, float dt) {
        dt *= 2.0;
        y.z -= 18.0;
        y.xyz *= 0.1;
        vec3 ytmp = y.xyz + 0.5 * dt * deriv(y.x, y.y, y.z);
        y.xyz = y.xyz + dt * deriv(ytmp.x, ytmp.y, ytmp.z);
        float r = length(y.xyz);
        if (r > 2.0) {
          y.xyz /= r;
        }
        y.xyz /= 0.1;
        y.z += 18.0;
        return y;
      }
    `,
  }),
};

const camera = require('regl-camera')(regl, {
  center: [0, 28, 0],
  distance: 100,
  far: 10000,
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
