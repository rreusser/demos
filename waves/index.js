const regl = require('regl')({extensions: ['OES_texture_float'], pixelRatio: 1});
const intersect = require('ray-plane-intersection');
const length = require('gl-vec3/length');
const subtract = require('gl-vec3/subtract');
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
      float c = 0.5;   // Wave speed
      float b = 0.1;  // Damping constant
      float dt = 0.05; // time step
      float k = 0.001;  // spring constant (pulls things back to zero)
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

      vec2 df = vec2(f.w - f.z * b, c * laplacian - k * f.z);

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
    uniform float opacity;
    void main() {
      gl_FragColor = vec4(0.3, 0.5, 1.0, opacity);
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
  uniforms: {
    points: regl.prop('points'),
    opacity: regl.prop('opacity')
  },
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

var raycastMouse = require('./raycast-mouse')(regl);

var phit;
regl.frame(({tick}) => {
  regl.clear({color: [0, 0, 0, 1]});

  camera(context => {
    raycastMouse(context, ({rayOrigin, rayDirection, rayChanged}) => {
      if (rayChanged) {
        var hit = intersect([], rayOrigin, rayDirection, [0, 1, 0], 0);
        if (hit && hit.length && phit && phit.length) {
          var diff = subtract([], hit, phit);
          doBump(Math.min(4, length(diff)), hit[0], hit[2]);
        }
        phit = hit;
      }

      iterate(20);

      var eye = context.eye;
      var phi = Math.atan2(eye[1], Math.sqrt(eye[0] * eye[0] + eye[2] * eye[2]))
      var diag = Math.sqrt(context.viewportWidth * context.viewportWidth + context.viewportHeight * context.viewportHeight) / 500;
      var opac = Math.min(1, Math.max(0.05, 20 * Math.atan(1 / length(context.eye)) * diag * Math.sin(phi * 2)));
      draw({points: y1, opacity: opac})
    });
  });
});

function doBump(amount, x, y) {
  nudgePoint([x / size[0] * 2, y / size[1] * 2]);
  bump({input: y2, output: y1f, amount: amount, radius: 10});
}

document.querySelector('canvas').addEventListener('wheel', function (e) {e.preventDefault();});
