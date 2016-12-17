const fs = require('fs');
const css = require('insert-css');
const html = require('h');
css(fs.readFileSync(__dirname + '/index.css', 'utf8'));

const regl = require('regl')({
  extensions: ['OES_texture_float', 'OES_texture_float_linear'],
  pixelRatio: 1.0,
  onDone: (err) => err && require('fail-nicely')(err)
});

const gpu = require('../regl-cwise')(regl);
const randn = require('random-normal');
const swap = require('./swap');
const fboOpts = {xboundary: 'repeat', yboundary: 'repeat', magfilter: 'linear', minfilter: 'linear'};

const ptexsize = 512;
const ctexsize = 256;
const stexsize = 512;
const decayTime = 1000;
const viscosityTime = 32;
const multiplier = 0.014;
const dt = 0.002;
const G = 1.0;





// Particle fbos:
var dist;
if (true) {
  dist = () => [
    Math.random(),
    Math.random(),
    randn() * 0.1,
    randn() * 0.1
  ];
} else if (false) {
  dist = () => {
    if (Math.random() < 0.1) {
      return [0.5, 0.5, 0, 0];
    }

    var theta = Math.random() * Math.PI * 2;
    var radius = Math.random() * Math.random() * 0.2
    let x = 0.5 + Math.cos(theta) * radius;
    let y = 0.5 + Math.sin(theta) * radius;

    let r = Math.sqrt(Math.pow(y - 0.5, 2) + Math.pow(x - 0.5, 2));
    let v = Math.pow(r, -0.4) * 5.0;
    let vx = -(y - 0.5) * v;
    let vy = (x - 0.5) * v;

    return [x, y, vx, vy];
  }
} else if (false) {
  dist = () => {
    var x = (randn() - 0.5) / 8
    var y = (randn() - 0.5) / 8
    return [
      x, y,
      randn() * 0.01 + y * 3,
      randn() * 0.01 - x * 3
    ];
  }
} else {
  dist = (i, j) => {
    var rad = 0.15;
    var vel = 0.15;
    if (Math.random() > 0.5) {
      x = 0.25 + randn() * rad
      y = 0.5 + randn() * rad
      vx = 0.5 + randn() * vel;
      vy = 0.1 + randn() * vel;
    } else {
      x = -0.25 + randn() * rad
      y = 0.5 + randn() * rad
      vx = -0.5 + randn() * vel;
      vy = -0.1 + randn() * vel;
    }

    return [x, y, vx ,vy];
  };
}
const pshape = [ptexsize, ptexsize, 4];
const n = pshape[0] * pshape[1];
const y = [
  gpu.array(dist, pshape),
  y2 = gpu.array(null, pshape)
]
const ycoords = y[0].samplerCoords();

// Continuum fbos:
const cshape = [ctexsize, ctexsize, 4];
const h = 1.0 / cshape[0];
const rho = gpu.array(() => [0, 0, 0, 0], cshape);
const phi = [
  gpu.array(() => [0, 0, 0, 0], cshape, fboOpts),
  gpu.array(() => [0, 0, 0, 0], cshape, fboOpts)
];
const velAccum = [
  gpu.array(() => [0, 0, 0, 0], cshape, fboOpts),
  gpu.array(() => [0, 0, 0, 0], cshape, fboOpts)
];
const loopbuf = gpu.array(null, [stexsize, stexsize, 4]);

const splatParticles = regl({
  frag: `
    precision mediump float;
    varying vec2 uv;
    void main () {
      gl_FragColor = vec4(1, uv, 0);
    }`,
  vert: `
    attribute vec2 xy;
    uniform sampler2D src;
    varying vec2 uv;
    void main () {
      vec4 val = texture2D(src, xy);
      uv = val.zw;
      gl_Position = vec4(val.xy * 2.0 - 1.0, 0, 1);
      gl_PointSize = 1.0;
    }
  `,
  attributes: {xy: ycoords},
  uniforms: {src: regl.prop('src')},
  framebuffer: regl.prop('dest'),
  count: n,
  primitive: 'points',
  blend: {
    enable: true,
    func: {srcRGB: 1, srcAlpha: 1, dstRGB: 1, dstAlpha: 1}
  },
  depth: {enable: false}
});

const renderToTexture = regl({
  frag: `
    precision mediump float;
    uniform float alpha;
    varying vec4 state;
    uniform float viscosity;
    varying vec4 dens;
    void main () {
      vec2 vavg = dens.yz / max(dens.x, 1.0);
      float heating = length(state.zw - vavg) * exp(-dens.x * viscosity);
      gl_FragColor = vec4(
        0.2 * (1.0 - heating) + 0.8 * heating,
        0.1,
        1.0 * (1.0 - heating),
        1.0
      ) * alpha;
    }`,
  vert: `
    attribute vec2 xy;
    uniform sampler2D src;
    uniform sampler2D rho;
    varying vec4 dens;
    varying vec4 state;
    void main () {
      state = texture2D(src, xy);
      dens = texture2D(rho, state.xy);
      state.xy = state.xy * 2.0 - 1.0;
      gl_Position = vec4(state.xy, 0, 1);
      gl_PointSize = 1.0;
    }
  `,
  attributes: {xy: ycoords},
  uniforms: {
    src: regl.prop('src'),
    rho: regl.prop('rho'),
    alpha: (context, props) => {
      return 0.05 / Math.sqrt(n) * Math.sqrt(cshape[0] * cshape[0]) * (props.multiplier || 1)
    },
    viscosity: (context, props) => dt / viscosityTime,
  },
  framebuffer: regl.prop('dest'),
  count: n,
  primitive: 'points',
  blend: {
    enable: true,
    func: {
      srcRGB: 1,
      srcAlpha: 1,
      dstRGB: 1,
      dstAlpha: 1
    }
  },
  depth: {enable: false}
});

const accumulateVelocity = regl({
  frag: `
    precision mediump float;
    uniform float alpha;
    void main () {
      gl_FragColor = vec4(1, 1, 1, alpha);
    }`,
  vert: `
    attribute vec2 xy;
    uniform sampler2D src;
    void main () {
      gl_Position = vec4(texture2D(src, xy).xy * 2.0 - 1.0, 0, 1);
      gl_PointSize = 1.0;
    }
  `,
  attributes: {xy: ycoords},
  uniforms: {
    src: regl.prop('src'),
    alpha: (context, props) => 0.05 / Math.sqrt(n) * Math.sqrt(cshape[0] * cshape[0]) * (props.multiplier || 1),
  },
  framebuffer: regl.prop('dest'),
  count: n,
  primitive: 'points',
  blend: {
    enable: true,
    func: {
      srcRGB: 'src alpha',
      srcAlpha: 1,
      dstRGB: 'one minus src alpha',
      dstAlpha: 1
    }
  },
  depth: {enable: false}
});

const relaxPoisson = gpu.map({
  args: [
    'array',
    'array',
    'scalar',
    {array: 0, offset: [0, 1]},
    {array: 0, offset: [0, -1]},
    {array: 0, offset: [1, 0]},
    {array: 0, offset: [-1, 0]}
  ],
  permute: [1, 0, 2, 3],
  body: `
    #define G ${G.toFixed(5)}
    #define PI 3.14159265358979
    vec4 compute (vec4 phi, vec4 rho, float h2, vec4 phin, vec4 phis, vec4 phie, vec4 phiw) {
      return vec4(0.25 * (phin.x + phis.x + phie.x + phiw.x) - PI * G * rho.x * h2, 0.0, 0.0, 0.0);
    }
  `
});

const gravitate = regl({
  frag: `
    precision mediump float;
    varying vec2 uv;
    uniform sampler2D src;
    uniform sampler2D phi;
    uniform sampler2D rho;
    uniform float h;
    uniform float dt;
    uniform float globalDecay;
    uniform float viscosity;
    void main () {
      vec4 y = texture2D(src, uv);
      float dphidx = (texture2D(phi, y.xy + vec2(h, 0)).x - texture2D(phi, y.xy - vec2(h, 0)).x) * 0.5 / h;
      float dphidy = (texture2D(phi, y.xy + vec2(0, h)).x - texture2D(phi, y.xy - vec2(0, h)).x) * 0.5 / h;
      vec3 rho = texture2D(rho, y.xy).xyz;
      vec2 vavg = rho.yz / max(rho.x, 1.0) * 2.0;
      y += vec4(y.z, y.w, -dphidx, -dphidy) * dt;
      y.xy = mod(y.xy, vec2(1, 1));
      float viscousDecay = exp(-rho.x * viscosity);
      y.zw = y.zw * viscousDecay + (vavg - y.zw) * (1.0 - viscousDecay);
      y.zw *= globalDecay;
      gl_FragColor = y;
    }`,
  vert: `
    attribute vec2 xy;
    varying vec2 uv;
    void main () {
      uv = (xy + 1.0) * 0.5;
      gl_Position = vec4(xy, 0, 1);
    }
  `,
  attributes: {xy: [[-4, -4], [0, 4], [4, -4]]},
  uniforms: {
    src: regl.prop('src'),
    phi: regl.prop('phi'),
    dt: regl.prop('dt'),
    rho: regl.prop('rho'),
    h: h,
    viscosity: (context, props) => dt / viscosityTime,
    globalDecay: (context, props) => Math.exp(-dt / props.decayTime)
  },
  framebuffer: regl.prop('dest'),
  depth: {enable: false},
  count: 3
});

const drawToScreen = regl({
  frag: `
    precision mediump float;
    varying vec2 uv;
    uniform sampler2D src;
    uniform float xmul, ymul;
    void main () {
      vec2 uvloop = mod(uv / vec2(xmul, ymul), 1.0);
      vec3 col = texture2D(src, uvloop).xyz;
      gl_FragColor = vec4(col, 1);
    }
  `,
  vert: `
    precision mediump float;
    attribute vec2 xy;
    varying vec2 uv;
    void main () {
      uv = (xy + 1.0) * 0.5;
      gl_Position = vec4(xy, 0, 1);
    }
  `,
  attributes: {xy: [[-4, -4], [0, 4], [4, -4]]},
  uniforms: {
    src: regl.prop('src'),
    xmul: (context, props) => props.src.width / context.viewportWidth,
    ymul: (context, props) => props.src.height / context.viewportHeight,
  },
  depth: {enable: false},
  count: 3
});

const loopTexture = regl({
  frag: `
    precision mediump float;
    varying vec2 uv;
    uniform sampler2D src;
    void main () {gl_FragColor = texture2D(src, uv);}
  `,
  vert: `
    precision mediump float;
    attribute vec2 xy;
    varying vec2 uv;
    void main () {
      uv = (xy + 1.0) * 0.5;
      gl_Position = vec4(xy, 0, 1);
    }
  `,
  attributes: {xy: [[-4, -4], [0, 4], [4, -4]]},
  uniforms: {src: regl.prop('src')},
  depth: {enable: false},
  count: 3
});

/*const debias = gpu.map({
  args: ['array', 'scalar'],
  permute: [1, 0, 2],
  body: `vec4 compute (vec4 src, float offset) {
    src.x -= offset;
    return src;
  }`
});*/

const debias = regl({
  frag: `
    precision mediump float;
    varying vec2 uv;
    uniform sampler2D src;
    uniform float xmul, ymul;
    void main () {
      float offset = texture2D(src, vec2(0, 0)).x;
      gl_FragColor = vec4(texture2D(src, uv).xyz - offset, 1);
    }
  `,
  vert: `
    precision mediump float;
    attribute vec2 xy;
    varying vec2 uv;
    void main () {
      uv = (xy + 1.0) * 0.5;
      gl_Position = vec4(xy, 0, 1);
    }
  `,
  attributes: {xy: [[-4, -4], [0, 4], [4, -4]]},
  uniforms: {src: regl.prop('src')},
  depth: {enable: false},
  count: 3
});


var buf = new Float32Array(4);
function computeMean (fbo) {
  var data = fbo.readraw({x: 0, y: 0, width: 1, height: 1, data: buf});
  return data[0];
}

const relaxArgs = [phi[0], phi[1], rho, h * h];
const debiasArgs = [];

regl.frame(({tick}) => {
  regl.clear({color: [0, 0, 0, 1]});

  relaxPoisson(relaxArgs, tick === 1 ? 200 : 50);

  debias({
    dest: relaxArgs[1],
    src: relaxArgs[0]
  });

  swap(relaxArgs, 1, 0);

  gravitate({
    dest: y[1],
    src: y[0],
    rho: rho,
    phi: relaxArgs[0],
    dt: dt,
    decayTime: decayTime
  });

  swap(y, 0, 1);

  loopbuf.use(() => regl.clear({color: [0, 0, 0, 1]}));

  rho.use(() => regl.clear({color: [0, 0, 0, 1]}));
  splatParticles({dest: rho, src: y[1]});

  renderToTexture({
    dest: loopbuf,
    rho: rho,
    src: y[1],
    multiplier: multiplier * Math.pow(stexsize / 16, 2)
  });

  drawToScreen({src: loopbuf});
});
