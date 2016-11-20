var instructions = document.createElement('span');
instructions.textContent = 'Spacebar to nudge';
instructions.style.fontStyle = 'italic';
instructions.style.zIndex = 100000;
instructions.style.position = 'absolute';
instructions.style.color = 'white';
document.body.appendChild(instructions);

const regl = require('regl')({
  extensions: ['OES_texture_float'],
  pixelRatio: 1
});

const gpu = require('./utils')(regl);
const shape = [150, 150];
const size = [40, 40];
const dx = [size[0] / (shape[0] - 1), size[1] / (shape[1] - 1)];

const y1 = gpu.array(shape, (i, j) => {
  let u = (i / (shape[0] - 1) - 0.5) * size[0];
  let v = (j / (shape[1] - 1) - 0.5) * size[1];
  let r = Math.sqrt(u * u + v * v);
  return [u, v, 0 * Math.cos(r) / (1 + 0.1 * r * r), 0]
});

const y2 = gpu.array(shape, (i, j) => 0);
const y1f = gpu.fbo(y1);
const y2f = gpu.fbo(y2);

const integrate = gpu.op({
  frag: `
    precision mediump float;
    uniform vec2 du, dv;
    uniform sampler2D y;
    varying vec2 uv;
    void main () {
      float c = 0.1;
      float b = 0.02;
      float dt = 0.05;
      vec4 f = texture2D(y, uv);
      vec2 e = texture2D(y, uv + du).zw;
      vec2 w = texture2D(y, uv - du).zw;
      vec2 n = texture2D(y, uv + dv).zw;
      vec2 s = texture2D(y, uv - dv).zw;
      vec2 ne = texture2D(y, uv + du + dv).zw;
      vec2 se = texture2D(y, uv + du - dv).zw;
      vec2 nw = texture2D(y, uv - du + dv).zw;
      vec2 sw = texture2D(y, uv - du - dv).zw;

      float laplacian = -3.0 * f.z +
        0.5 * (e.x + w.x + n.x + s.x) +
        0.25 * (ne.x + nw.x + se.x + sw.x);

      vec2 df = vec2(f.w - f.z * b, c * laplacian);

      gl_FragColor = vec4(f.xy, f.zw + dt * df);
    }
  `,
  uniforms: {y: regl.prop('input')}
});

const nudgePoint = regl.buffer([0, 0]);
const bump = gpu.op({
  frag: `
    precision mediump float;
    uniform sampler2D y;
    uniform float amount;
    varying vec2 uv;
    void main () {
      vec4 f = texture2D(y, uv);
      vec2 x = gl_PointCoord - 0.5;
      float r2 = dot(x, x);
      float mag = exp(-r2 / (0.2 * 0.2));
      gl_FragColor = vec4(0, 0, 0, mag * amount);
    }
  `,
  vert: `
    precision mediump float;
    uniform float radius;
    attribute vec2 points;
    varying vec2 uv;
    void main () {
      uv = 0.5 * (points + 1.0);
      gl_Position = vec4(points, 0, 1);
      gl_PointSize = radius;
    }
  `,
  uniforms: {
    y: regl.prop('input'),
    amount: regl.prop('amount'),
    radius: regl.prop('radius')
  },
  framebuffer: regl.prop('output'),
  primitive: 'points',
  count: 1,
  attributes: {points: nudgePoint},
  blend: {
    enable: true,
    func: {srcRGB: 'src alpha', srcAlpha: 1, dstRGB: 1, dstAlpha: 1},
    equation: {rgb: 'add', alpha: 'add'}
  },
});

const draw = regl({
  frag: `
    precision mediump float;
    uniform vec4 color;
    void main() {
      gl_FragColor = vec4(0.3, 0.5, 1.0, 0.5);
    }
  `,
  vert: `
    precision mediump float;
    attribute vec2 uv;
    uniform sampler2D points;
    uniform mat4 projection, view;
    void main() {
      vec4 pt = texture2D(points, uv).xyzw;
      gl_Position = projection * view * vec4(pt.xzy, 1.0);
      gl_PointSize = 3.0;
    }
  `,
  attributes: {uv: gpu.arrayLookup(shape)},
  blend: {
    enable: true,
    func: {srcRGB: 'src alpha', srcAlpha: 1, dstRGB: 1, dstAlpha: 1},
    equation: {rgb: 'add', alpha: 'add'}
  },
  uniforms: {points: regl.prop('points')},
  depth: {enable: false},
  primitive: 'points',
  count: shape[0] * shape[1]
});


function iterate (n) {
  for (let i = 0; i < n; i++) {
    integrate({input: y1, output: y2f});


    let tmp = y1; y1 = y2; y2 = tmp;
    tmp = y1f; y1f = y2f; y2f = tmp;
  }
}

const camera = require('regl-camera')(regl, {
  damping: 0,
  theta: 0.2,
  phi: 0.35,
  distance: 40,
  center: [0.5, 0.5, 0.5],
});

regl.frame(({tick}) => {
  if (tick === 1) {
    doBump(-4, 0, 0);
  }

  iterate(20);

  regl.clear({color: [0, 0, 0, 1]});
  camera(() => draw({points: y1}));
});

function doBump(amount, x, y) {
  nudgePoint([x, y]);
  bump({
    input: y2,
    output: y1f,
    amount: amount,
    radius: 20
  });
}

window.addEventListener('keypress', function (e) {
  if (e.charCode === 32) {
    if (instructions) {
      document.body.removeChild(instructions);
      instructions = null;
    }

    doBump((Math.random() * 2 - 1) * 4, Math.random() * 2 - 1, Math.random() * 2 - 1);
  }
}, false);

document.querySelector('canvas').addEventListener('wheel', function (e) {e.preventDefault();});
