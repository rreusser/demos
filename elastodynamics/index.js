'use strict';

var tfi = require('ndarray-transfinite-interpolation');
var zeros = require('ndarray-scratch').zeros;
var createGeometry = require('ndarray-grid-connectivity');
var extend = require('util-extend');
var flatten = require('flatten');
var vectorFill = require('ndarray-vector-fill');
var show = require('ndarray-show');
var cwise = require('cwise');
var findRoots = require('durand-kerner');
var ops = require('ndarray-ops');
var PID = require('node-pid-controller');
var controlPanel = require('control-panel');
var ResetTimer = require('./reset-timer');
var qs = require('query-string');
var Complex = require('complex.js');
var createCamera = require('./camera');
var camera2d = require('./camera2d');
var glslify = require('glslify');
var css = require('insert-css');
var fs = require('fs');

css(fs.readFileSync(__dirname + '/index.css', 'utf8'));

function byteSize (arr) {
  if (arr.constructor === Float32Array) {
    return 4;
  } else {
    throw new Error('Unexpected array type: ' + String(arr.constructor));
  }
};

window.myshader = glslify(__dirname + '/map.glsl');

const regl = require('regl')({
  extensions: [
    'oes_standard_derivatives',
    'EXT_frag_depth'
  ],
  optionalExtensions: ['oes_element_index_uint']
});


var n = [41, 21, 2];
var res = [0.5, 0.2, 0.5];
var scale = [4, 2.5, 2];

// Face and line colors for the top face:
var f1 = [0.9, 0.9, 0.9];
var l1 = [0, 0, 0];

// Face and line colors for the others:
var f2 = [1.0, 1.0, 1.0];
var l2 = [0.0, 0.0, 0.0];

var faceColors = [f1, f1, f1, f2, f1, f1];
var lineColors = [l1, l1, l1, l2, l1, l1];

function makeRayleigh (E, rho, nu) {
  var c12 = Math.sqrt(E * (1 - nu) / rho / (1 + nu) / (1 - 2 * nu));
  var c22 = Math.sqrt(E * 0.5 / rho / (1 + nu));
  var kn2 = c22 / c12;

  // Solve the cubic relation for rayleigh waves:
  var k2Roots = findRoots([16 * kn2 - 16, 24 - 16 * kn2, -8, 1]);

  // The only acceptable root is the real root between 0 and 1:
  for (var i = 0, ks2 = null; i < k2Roots[0].length; i++) {
    if (Math.abs(k2Roots[1][i] / k2Roots[0][i]) < 1e-8 && k2Roots[0][i] >= 0 && k2Roots[0][i] <= 1) {
      ks2 = k2Roots[0][i];
    }
  }

  var k2 = (w) => w * w / c22 / ks2;

  return {
    k: (w) => Math.sqrt(k2(w)),
    q: (w) => Math.sqrt(k2(w) - w * w / c12),
    s: (w) => Math.sqrt(k2(w) - w * w / c22)
  }
}

function evalRayleigh(rayleigh, A, w) {
  var q = rayleigh.q(w);
  var s = rayleigh.s(w);
  var k = rayleigh.k(w);
  var u1 = k;
  var u2 = -k * 2 * q * s / (s * s + k * k);
  var w1 = q;
  var w2 = -q * 2 * k * k / (s * s + k * k);
  var norm = A / Math.max(Math.sqrt(u1 * u1 + u2 * u2), Math.sqrt(w1 * w1 + w2 * w2));
  norm *= Math.PI * 2 / k;
  return {
    k: k, w: w, q: q, s: s,
    ucoeff1: u1 * norm,
    ucoeff2: u2 * norm,
    wcoeff1: w1 * norm,
    wcoeff2: w2 * norm,
  };
}

const scalar = cwise({
  args: ['scalar', {blockIndices: -1}],
  body: function (scale, A) {
    A[0] = (A[0] - 0.5) * scale[0];
    A[1] = (A[1] - 1.0) * scale[1];
    A[2] = (A[2] - 0.5) * scale[2];
  }
})

const applyScale = A => {
  scalar(scale, A);
  return A;
}

const faces = [
  [[w => [0, 0, w], w => [0, 1, w]], [v => [0, v, 0], v => [0, v, 1]]],
  [[w => [1, 0, w], w => [1, 1, w]], [v => [1, v, 0], v => [1, v, 1]]],
  [[w => [0, 0, w], w => [1, 0, w]], [u => [u, 0, 0], u => [u, 0, 1]]],
  [[w => [0, 1, w], w => [1, 1, w]], [u => [u, 1, 0], u => [u, 1, 1]]],
  [[v => [0, v, 0], v => [1, v, 0]], [u => [u, 0, 0], u => [u, 1, 0]]],
  [[v => [0, v, 1], v => [1, v, 1]], [u => [u, 0, 1], u => [u, 1, 1]]]
]
  .map((f, i) => tfi(zeros(n.filter((j, k) => k !== Math.floor(i / 2)).concat([3]), 'float32'), f))
  .map(applyScale)
  .map(createFace)
  .map((f, i) => {
    f.faceColor = faceColors[i];
    f.lineColor = lineColors[i];
    return f;
  });

function createFace (A, dir) {
  var dir = Math.floor(dir / 2);
  var dim = A.dimension;
  var a, b, c, d, i, j;
  var l = A.shape[0];
  var m = A.shape[1];
  var o = A.offset;
  var si = A.stride[0];
  var sj = A.stride[1];
  var gridCoord = [];

  var verts = [];
  for (j = 0; j < m - 1; j++) {
    for (i = 0; i < l - 1; i++) {
      // Four vertices comprise a face. Layout is:
      // c d
      // a b
      a = o + si * i + sj * j;
      b = a + si;
      c = a + sj;
      d = b + sj;

      // Push the two triangles:
      verts.push(a, b, c);
      verts.push(d, c, b);
    }
  }

  var dirs = [0, 1, 2].filter((x) => x !== dir);
  var A1dir = A.pick(null, null, dirs[0]);
  var A2dir = A.pick(null, null, dirs[1]);
  var dA1 = ops.sup(A1dir) - ops.inf(A1dir);
  var dA2 = ops.sup(A2dir) - ops.inf(A2dir);

  var f1 = dA1 / (n[dirs[0]] - 1) / res[dirs[0]];
  var f2 = dA2 / (n[dirs[1]] - 1) / res[dirs[1]];

  for (j = 0; j < m; j++) {
    for (i = 0; i < l; i++) {
      a = o + si * i + sj * j;
      gridCoord[a] = i * f1;
      gridCoord[a + 1] = j * f2;
      gridCoord[a + 2] = 0;
    }
  }

  return {
    array: A,
    faces: verts,
    buffer: A.data,
    count: verts.length,
    color: [1, 0, 0, 0.5],
    byteSize: byteSize(A.data),
    gridCoord: new Float32Array(gridCoord)
  };
}

const camera = createCamera(regl, {
  center: [0, -0.5, 0],
  phi: Math.PI * 0.13,
  theta: Math.PI * 0.25,
  distance: 6,
});

const drawRayleighWaveCube = regl({
  frag: `
    #extension GL_OES_standard_derivatives : enable

    precision mediump float;
    varying vec3 vBC;
    uniform vec3 faceColor, lineColor;
    varying float z;
    uniform float viewportHeight;
    uniform vec3 topColor, bottomColor;
    float screenY;
    float fadeTop = 1.5;

    float edgeFactor () {
      vec3 d = fwidth(vBC);
      vec3 a3 = smoothstep(vec3(0.0), 1.5 * d, 0.5 - abs(mod(vBC, 1.0) - 0.5));
      return min(a3.x, a3.y);
    }

    void main () {
      // Compute the background gradient color for this pixel:
      float screenY = gl_FragCoord.y / viewportHeight;
      vec3 bgColor = screenY * topColor + (1.0 - screenY) * bottomColor;

      // Compute the grid line scaling:
      float ef = edgeFactor();

      // Compute a depth factor that fades out the mesh toward the bottom:
      float df = clamp(exp(fadeTop - z) - (fadeTop - z) / (fadeTop - ${scale[1].toFixed(2)}) * exp(fadeTop - ${scale[1].toFixed(2)}), 0.0, 1.0);

      // Interpolate the mesh and the background
      gl_FragColor = vec4(mix(lineColor, faceColor, ef) * df + (1.0 - df) * bgColor, 1.0);
    }
  `,
  vert: `
    precision mediump float;
    varying vec3 vBC;
    uniform mat4 projection, view;
    uniform float time, k, w, s, q, ucoeff1, ucoeff2, wcoeff1, wcoeff2, shift;
    varying float z;
    attribute vec3 position, gridCoord;
    uniform vec4 interp;

    void main () {
      vBC = gridCoord;
      z = -position.y;

      float wtkx = w * time - k * (position.x - shift);
      float eqz = exp(-q * z);
      float esz = exp(-s * z);

      float swtkx = sin(wtkx);
      float cwtkx = cos(wtkx);

      float p = interp.x;
      float sh = interp.y;
      float sv = interp.z;
      float ray = interp.w;

      float rayDx = ray * (ucoeff1 * eqz + ucoeff2 * esz);
      float rayDy = ray * (wcoeff1 * eqz + wcoeff2 * esz);

      gl_Position = projection * view * vec4(
        position.x + (rayDx + p) * swtkx,
        position.y + rayDy * cwtkx + sv * swtkx,
        position.z + sh * swtkx,
        1.0
      );
    }
  `,
  primitive: 'triangles',
  attributes: {
    position: {
      buffer: regl.prop('buffer'),
      stride: regl.prop('byteSize'),
    },
    gridCoord: {
      buffer: regl.prop('gridCoord'),
      stride: 4
    }
  },
  uniforms: {
    color: regl.prop('color'),
    w: regl.context('w'),
    k: regl.context('k'),
    s: regl.context('s'),
    q: regl.context('q'),
    shift: regl.context('shift'),
    interp: regl.context('interp'),
    ucoeff1: regl.context('ucoeff1'),
    ucoeff2: regl.context('ucoeff2'),
    wcoeff1: regl.context('wcoeff1'),
    wcoeff2: regl.context('wcoeff2'),
    faceColor: regl.prop('faceColor'),
    lineColor: regl.prop('lineColor'),
    time: regl.context('time'),
    viewportWidth: regl.context('viewportWidth'),
    viewportHeight: regl.context('viewportHeight'),
  },
  count: regl.prop('count'),
  elements: regl.prop('faces')
})

const backgroundGradient = regl({
  frag: `
    precision mediump float;
    uniform vec3 topColor, bottomColor;
    varying mediump float y;
    void main () {
      gl_FragColor = vec4(y * topColor + (1.0 - y) * bottomColor, 1.0);
    }
  `,
  vert: `
    precision mediump float;
    attribute vec2 position;
    varying mediump float y;
    void main () {
      y = position.y * 0.5 + 0.5;
      gl_Position = vec4(position, 0, 1);
    }
  `,
  attributes: {
    position: [[-2, -2], [2, -2], [0, 4]]
  },
  count: 3,
  depth: {
    enable: false
  },
});

const setProps = regl({
  context: {
    w: regl.prop('w'),
    k: regl.prop('k'),
    s: regl.prop('s'),
    q: regl.prop('q'),
    shift: regl.prop('shift'),
    interp: regl.prop('interp'),
    ucoeff1: regl.prop('ucoeff1'),
    ucoeff2: regl.prop('ucoeff2'),
    wcoeff1: regl.prop('wcoeff1'),
    wcoeff2: regl.prop('wcoeff2'),
  }
});

const interpTarget = {p: 0, sv: 0, sh: 0, rayleigh: 1};
const interp = {p: 0, sv: 0, sh: 0, rayleigh: 1};

var waveType = 'Rayleigh';
const state = {
  w: 3,
  E: 2,
  rho: 1,
  nu: 0.3
};

function loadParams () {
  try {
    var params = qs.parse(window.location.hash.replace(/^#/,''));
    if (params.type) waveType = String(params.type);
    if (params.ω) state.w = Number(params.ω);
    if (params.E) state.E = Number(params.E);
    if (params.ρ) state.rho = Number(params.ρ);
    if (params.ν) state.nu = Number(params.ν);
    if (params.xres) res[0] = Number(params.xres);
    if (params.yres) res[1] = Number(params.yres);
    if (params.zres) res[2] = Number(params.zres);

    interp.p = interpTarget.p = waveType === 'Longitudinal' ? 1 : 0;
    interp.sh = interpTarget.sh = waveType === 'Shear Horizontal' ? 1 : 0;
    interp.sv = interpTarget.sv = waveType === 'Shear Vertical' ? 1 : 0;
    interp.rayleigh = interpTarget.rayleigh = waveType === 'Rayleigh' ? 1 : 0;

    quantizeRes();

  } catch (e) {}
}

loadParams();

function updateControllers (controllers) {
  for (var key in controllers) {
    state[key] += controllers[key].update(state[key]);
  }
}

function createControllers () {
  var controllers = {};
  for (var key in state) {
    controllers[key] = new PID({k_p: 0.2, k_i: 0.0, k_d: 0.0});
    controllers[key].setTarget(state[key]);
  }
  return controllers;
}

var controllers = createControllers();

function setRes (faces, res) {
  var a, i, j, k;
  for (i = 0; i < faces.length; i++) {
    var j, k;
    var face = faces[i];
    var gridCoord = face.gridCoord;
    var A = face.array;
    var dir = Math.floor(i / 2);
    var o = A.offset;
    var si = A.stride[0];
    var sj = A.stride[1];

    var dirs = [0, 1, 2].filter((x) => x !== dir);
    var A1dir = A.pick(null, null, dirs[0]);
    var A2dir = A.pick(null, null, dirs[1]);
    var dA1 = ops.sup(A1dir) - ops.inf(A1dir);
    var dA2 = ops.sup(A2dir) - ops.inf(A2dir);

    var f1 = dA1 / (n[dirs[0]] - 1) / res[dirs[0]];
    var f2 = dA2 / (n[dirs[1]] - 1) / res[dirs[1]];

    for (j = 0; j < A.shape[1]; j++) {
      for (k = 0; k < A.shape[0]; k++) {
        a = o + si * k + sj * j;
        gridCoord[a] = k * f1;
        gridCoord[a + 1] = j * f2;
        gridCoord[a + 2] = 0;
      }
    }
  }
}

setRes(faces, res);

function updateInterp (dt) {
  var fac = Math.exp(-dt);
  interp.p *= fac;
  interp.sh *= fac;
  interp.sv *= fac;
  interp.rayleigh *= fac;

  interp.p += (1 - fac) * interpTarget.p;
  interp.sh += (1 - fac) * interpTarget.sh;
  interp.sv += (1 - fac) * interpTarget.sv;
  interp.rayleigh += (1 - fac) * interpTarget.rayleigh;
}

var controlPanelRoot = document.createElement('div');
controlPanelRoot.id = 'control-panel-root';
document.body.appendChild(controlPanelRoot);

function quantizeRes () {
  res[0] = scale[0] / Math.round(scale[0] / res[0]);
  res[1] = scale[1] / Math.round(scale[1] / res[1]);
  res[2] = scale[2] / Math.round(scale[2] / res[2]);
}

var hashTimer = new ResetTimer(1000);


hashTimer.on('timeout', function () {
  window.location.hash = qs.stringify(setData);
});

var setData;

controlPanel([
  {type: 'select', label: 'type', options: ['Longitudinal', 'Shear Horizontal', 'Shear Vertical', 'Rayleigh'], initial: waveType},
  {type: 'range', label: 'ω', initial: state.w, min: 1, max: 8, step: 0.1},
  {type: 'range', label: 'E', initial: state.E, min: 0.1, max: 4, step: 0.1},
  {type: 'range', label: 'ρ', initial: state.rho, min: 0.1, max: 4, step: 0.1},
  {type: 'range', label: 'ν', initial: state.nu, min: 0, max: 0.5, step: 0.01},
  {type: 'range', label: 'xres', initial: res[0], min: 0.02, max: 1, step: 0.01},
  {type: 'range', label: 'yres', initial: res[1], min: 0.02, max: 1, step: 0.01},
  {type: 'range', label: 'zres', initial: res[2], min: 0.02, max: 1, step: 0.01},
], {
  theme: 'light',
  position: 'top-left',
  root: controlPanelRoot
}).on('input', function (data) {
  controllers.w.setTarget(data.ω);
  controllers.E.setTarget(data.E);
  controllers.rho.setTarget(data.ρ);
  controllers.nu.setTarget(data.ν);

  interpTarget.p = data.type === 'Longitudinal' ? 1 : 0;
  interpTarget.sh = data.type === 'Shear Horizontal' ? 1 : 0;
  interpTarget.sv = data.type === 'Shear Vertical' ? 1 : 0;
  interpTarget.rayleigh = data.type === 'Rayleigh' ? 1 : 0;

  setData = data;
  hashTimer.reset();

  if (data.xres !== res[0] || data.yres !== res[1] || data.zres !== res[2]) {
    res[0] = parseFloat(data.xres);
    res[1] = parseFloat(data.yres);
    res[2] = parseFloat(data.zres);

    quantizeRes();

    setRes(faces, res);
  }
});

var injectColors = regl({
  uniforms: {
    topColor: regl.prop('topColor'),
    bottomColor: regl.prop('bottomColor'),
  }
});

// Prevent control panel events from affecting regl:
var cp = document.querySelector('.control-panel');
['mousewheel', 'mousedown', 'mousemove', 'mouseup'].forEach((event) => {
  cp.addEventListener(event, ev => ev.stopPropagation());
});

var xshift = 0.0;
var tprev = 0;
var dt;
var A = 0.3;
var props = evalRayleigh(makeRayleigh(state.E, state.rho, state.nu), A, state.w)
var wprev = props.w;
var kprev = props.k;

regl.frame(({tick, time}) => {
  //if (tick % 120 !== 0) return;

  dt = time - tprev;
  tprev = time;

  updateControllers(controllers);
  updateInterp(dt);

  regl.clear({color: [1, 1, 1, 1]})

  injectColors({
    topColor: [1.0, 1.0, 1.0],
    bottomColor: [0.5, 0.5, 0.5],
  }, () => {
    backgroundGradient();

    camera(() => {
      var props = evalRayleigh(makeRayleigh(state.E, state.rho, state.nu), A, state.w)

      props.interp = [
        interp.p * 2.0 * Math.PI / props.k * 0.1,
        interp.sh * 2.0 * Math.PI / props.k * 0.1,
        interp.sv * 2.0 * Math.PI / props.k * 0.1,
        interp.rayleigh
      ];

      // Update the shift so that changed frequencies take effect from the
      // *center* of the domain. Otherwise the origin is far off screen and
      // changing the frequency just makes it go crazy.
      xshift = (wprev * tprev - props.w * time + kprev * xshift) / props.k;
      props.shift = xshift;
      props.A = A;

      wprev = props.w;
      kprev = props.k;

      setProps(props, () => {
        drawRayleighWaveCube(faces);
      });
    });
  });
});

var hideTimer = new ResetTimer(2000);
controlPanelRoot.addEventListener('mouseenter', function () {
  controlPanelRoot.classList.add('is-hover');
  hideTimer.stop();
}, false);

controlPanelRoot.addEventListener('mouseleave', function () {
  hideTimer.reset();
}, false);

hideTimer.on('timeout', function () {
  controlPanelRoot.classList.remove('is-hover');
});
hideTimer.start();
