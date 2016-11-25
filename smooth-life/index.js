'use strict';

var normalizeQueryParams = require('./normalize-query-params');
var extend = require('util-extend');
var qs = require('query-string');
var h = require('h');
var css = require('insert-css');
var fs = require('fs');

css(fs.readFileSync(__dirname + '/index.css', 'utf8'));

document.body.appendChild(h('h1', 'regl smooth life'));
document.body.appendChild(h('div#sim'));

var settings = {
  birth: [0.269, 0.34],
  death: [0.523, 0.746],
  alpha_n: 0.028,
  alpha_m: 0.147,
  initial_fill: 0.51,
  dt: 0.115,
};

extend(settings, normalizeQueryParams(location.hash, {
  birth: ['Number'],
  death: ['Number'],
  alpha_n: 'Number',
  alpha_m: 'Number',
  initial_fill: 'Number',
  dt: 'Number',
}));

var regl = require('regl')({
  container: document.getElementById('sim'),
  pixelRatio: 1,
  optionalExtensions: ['oes_texture_float']
});

var control = require('control-panel');

const RADIUS = 256;
var ra = 12.0;
var ri = ra / 3.0;
var b = 1;

var areai = ri * ri * Math.PI;
var areaa = ra * ra * Math.PI - areai;
var Minv = 1.0 / areai;
var Ninv = 1.0 / areaa

var panel = control([
  {type: 'button', label: 'restart', action: restart },
  {type: 'range', label: 'initial_fill', min: 0, max: 1, initial: settings.initial_fill},
  {type: 'interval', label: 'birth', min: 0, max: 1, initial: settings.birth},
  {type: 'interval', label: 'death', min: 0, max: 1, initial: settings.death},
  {type: 'range', label: 'alpha_n', min: 0, max: 1, initial: settings.alpha_n},
  {type: 'range', label: 'alpha_m', min: 0, max: 1, initial: settings.alpha_m},
  {type: 'range', label: 'dt', min: 0, max: 0.2, initial: settings.dt},
], {
  theme: 'dark',
  width: 512
});

panel.on('input', (data) => {
  window.location.hash = qs.stringify(settings);
  Object.keys(settings).forEach((key) => settings[key] = data[key]);
});


function createInitialConditions () {
  var y = (Array(RADIUS * RADIUS * 4)).fill(0);

  for (var i = 0; i < RADIUS; i++) {
    for (var j = 0; j < RADIUS; j++) {
      var dx = i - RADIUS * 0.5;
      var dy = j - RADIUS * 0.5;
      y[4 * (i + RADIUS * j)] = Math.exp((-dx * dx - dy * dy) / ra / ra / 2) + Math.random() * settings.initial_fill;
    }
  }
  console.log('y.length:', y.length);
  return y;
}

function restart () {
  state[(frame + 1) % 2]({
    color: regl.texture({
      width: RADIUS,
      height: RADIUS,
      data: createInitialConditions(),
      format: 'rgba',
      type: 'float',
      wrap: 'repeat',
    }),
  });
}

const state = (Array(2)).fill().map(() =>
  regl.framebuffer({
    color: regl.texture({
      width: RADIUS,
      height: RADIUS,
      data: createInitialConditions(),
      format: 'rgba',
      type: 'float',
      wrap: 'repeat',
    }),
    depth: false
  })
);

// Dynamically unroll this so that we can be *sure* not to perform extra work at least,
// since we're not just doing the fft like we should be:
function createLoop () {
  var lines = [];
  for (var dx = -ra - 2; dx <= ra + 2; dx++) {
    for (var dy = -ra - 2; dy <= ra + 2; dy++) {
      var r2 = dx * dx + dy * dy;
      var r = Math.sqrt(r2);
      var i_interp = (ri + b / 2 - r) / b;
      var a_interp = (ra + b / 2 - r) / b;

      // If we get *anything* here, sample the texture:
      if (a_interp > 0) {
        lines.push(`value = texture2D(prevState, uv + vec2(${dx}, ${dy}) / ${RADIUS.toFixed(8)}).r;`);
      }

      if (i_interp > 1) {
        // If inside the inner circle, just add:
        lines.push(`m += value;`);
      } else if (i_interp > 0) {
        // Else if greater than zero, add antialiased:
        lines.push(`m += value * ${((ri + b / 2 - r) / b).toFixed(8)};`);
      }

      if (i_interp < 1) {
        // If outside the inner border of the inner circle:
        if (1 - i_interp < 1) {
          // If inside the outer border of the inner circle, then interpolate according to inner (reversed):
          lines.push(`n += value * ${(1.0 - (ri + b / 2 - r) / b).toFixed(8)};`);
        } else if (a_interp > 1) {
          // Else if inside the outer circle, just add:
          lines.push(`n += value;`);
        } else if (a_interp > 0) {
          // Else, if interpolant greater than zero, add:
          lines.push(`n += value * ${((ra + b / 2 - r) / b).toFixed(8)};`);
        }
      }
    }
  }
  return lines.join('\n');
}

var updateLife = regl({
  frag: `
  precision mediump float;
  uniform sampler2D prevState;
  uniform float alpha_n, alpha_m, dt, b1, b2, d1, d2;
  varying vec2 uv;

  float func_smooth (float x, float a, float ea) {
    return 1.0 / (1.0 + exp(-(x - a) * 4.0 / ea));
  }

  float sigmoid_ab (float sn, float x, float a, float b) {
    return func_smooth(x, a, sn) * (1.0 - func_smooth(x, b, sn));
  }

  float sigmoid_mix (float sm, float x, float y, float m) {
    return x + func_smooth(m, 0.5, sm) * (y - x);
  }


  void main () {
    float minterp, ninterp, r, r2, value;
    float m = 0.0;
    float n = 0.0;

    ${createLoop()}

    m *= ${Minv.toFixed(16)};
    n *= ${Ninv.toFixed(16)};

    /*
    float s1m = 1.0 / (1.0 + exp((0.5 - m) * 4.0 / alpha_m));
    float sm1 = b1 * (1.0 - s1m) + d1 * s1m;
    float sm2 = b2 * (1.0 - s1m) + d2 * s1m;
    float s1n1 = 1.0 / (1.0 + exp((sm1 - n) * 4.0 / alpha_n));
    float s1n2 = 1.0 / (1.0 + exp((sm2 - n) * 4.0 / alpha_n));
    float s = s1n1 * (1.0 - s1n2);
    */

    float s = sigmoid_ab(
      alpha_n,
      n,
      sigmoid_mix(alpha_m, b1, d1, m),
      sigmoid_mix(alpha_m, b2, d2, m)
    );

    // Update:
    float prev = texture2D(prevState, uv).r;
    float next = prev + dt * (s - prev);
    //float next = prev + dt * (2.0 * s - 1.0);
    gl_FragColor = vec4(clamp(next, 0.0, 1.0), 0, 0, 1);
  }`,

  framebuffer: ({tick}) => state[(tick + 1) % 2]
});

const setupQuad = regl({
  frag: `
  precision mediump float;
  uniform sampler2D prevState;
  varying vec2 uv;
  void main () {
    float state = texture2D(prevState, uv).r;
    gl_FragColor = vec4(vec3(state), 1);
  }`,

  vert: `
  precision mediump float;
  attribute vec2 position;
  varying vec2 uv;
  void main () {
    uv = 0.5 * (position + 1.0);
    gl_Position = vec4(position, 0, 1);
  }`,

  attributes: {
    position: regl.buffer([-4, -4, 4, -4, 0, 4])
  },

  uniforms: {
    prevState: ({tick}) => state[tick % 2].color[0],
    b1: regl.prop('b1'),
    b2: regl.prop('b2'),
    d1: regl.prop('d1'),
    d2: regl.prop('d2'),
    alpha_n: regl.prop('alpha_n'),
    alpha_m: regl.prop('alpha_m'),
    dt: regl.prop('dt'),
  },

  depth: {enable: false},

  count: 3
})

var frame = 0;

regl.frame(({tick}) => {
  frame = tick;
  settings.b1 = settings.birth[0]
  settings.b2 = settings.birth[1]
  settings.d1 = settings.death[0]
  settings.d2 = settings.death[1]
  setupQuad(settings, () => {
    regl.draw();
    updateLife();
  });
});

