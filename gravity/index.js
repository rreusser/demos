const fs = require('fs');
const css = require('insert-css');
const html = require('h');
css(fs.readFileSync(__dirname + '/index.css', 'utf8'));

const regl = require('regl')({
  extensions: ['OES_texture_float', 'OES_texture_float_linear'],
  pixelRatio: 1,
  onDone: (err) => err && require('fail-nicely')(err)
});

const gpu = require('../regl-cwise')(regl);
const randn = require('random-normal');
const swap = require('./swap');
const boundaryOpts = {xboundary: 'repeat', yboundary: 'repeat', magfilter: 'linear', minfilter: 'linear'};

const ptexsize = 1024;
const ctexsize = 512;
const stexsize = 512;
const decay = 1.5;
const multiplier = 1;
const dt = 0.016;





// Particle fbos:
var dist;
if (false) {
  dist = () => {
    let x = 0.5 + 0.1 * randn();
    let y = 0.5 + 0.1 * randn();

    let r = Math.sqrt(Math.pow(y - 0.5, 2) + Math.pow(x - 0.5, 2));
    let v = Math.pow(r, -0.4) * 0.2;
    let vx = -(y - 0.5) * v;
    let vy = (x - 0.5) * v;

    return [x, y, vx, vy];
  }
} else if (true) {
  dist = () => [Math.random(), Math.random(), randn() * 0.005, randn() * 0.005];
} else {
  dist = (i, j) => {
    do {
      var x = Math.random();
      var y = Math.random();
      var r = Math.sqrt((x - 0.5) * (x - 0.5) + (y - 0.5) * (y - 0.5));
    } while (Math.random() > Math.exp(-r * 50))

    var vx = (y - 0.5);
    var vy = -(x - 0.5);
    var v = Math.sqrt(vx * vx + vy * vy);

    vx /= v;
    vy /= v;

    v = Math.pow(r, 1.0) * 1.5;

    vx *= v;
    vy *= v;

    return [x, y, vx ,vy];
      //randn() * 0.001 + 1.1 * (y - 0.5),
      //randn() * 0.001 - 1.1 * (x - 0.5)
    //];
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
const rho = gpu.array(() => [0, 0, 0, 0], cshape, boundaryOpts);
const phi = [
  gpu.array(() => [0, 0, 0, 0], cshape, boundaryOpts),
  gpu.array(() => [0, 0, 0, 0], cshape, boundaryOpts)
];

const loopbuf = gpu.array(null, [stexsize, stexsize, 4]);

const splatDensity = regl({
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
    #define G 0.5
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
    //uniform sampler2D rho;
    uniform float h;
    uniform float dt;
    uniform float decay;
    void main () {
      vec4 y = texture2D(src, uv);
      float dphidx = (texture2D(phi, y.xy + vec2(h, 0)).x - texture2D(phi, y.xy - vec2(h, 0)).x) * 0.5 / h;
      float dphidy = (texture2D(phi, y.xy + vec2(0, h)).x - texture2D(phi, y.xy - vec2(0, h)).x) * 0.5 / h;
      //float dens = texture2D(rho, y.xy).x;
      //dphidx = 1.0;
      //dphidy = 0.0;
      y = y + vec4(y.z, y.w, -dphidx, -dphidy) * dt;
      y.xy = mod(y.xy, vec2(1, 1));
      //y.zw *= exp(-dens / 50.0);
      y.zw *= decay;
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
    decay: regl.prop('decay')
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
      float col = texture2D(src, uvloop).x;
      col = sqrt(col);
      gl_FragColor = vec4(vec3(col), 1);
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

function iterate (tick) {
  var t1 = Date.now();
  rho.use(() => regl.clear({color: [0, 0, 0, 1]}));
  splatDensity({dest: rho, src: y[0]});

  var t2 = Date.now();
  relaxPoisson(relaxArgs, tick === 1 ? 200 : 50);

  var t3 = Date.now();
  debias({dest: relaxArgs[1], src: relaxArgs[0]});

  swap(relaxArgs, 1, 0);

  var t4 = Date.now();
  var d = Math.exp(-dt / (decay / (0.2 + 0.8 * Math.exp(-tick / 400))));
  gravitate({dest: y[1], src: y[0], rho: rho, phi: relaxArgs[0], dt: dt, decay: d});

  var t5 = Date.now();
  swap(y, 0, 1);

  return [t2 - t1, t3 - t2, t4 - t3, t5 - t4];
}

regl.frame(({tick}) => {
  var t1 = Date.now();
  regl.clear({color: [0, 0, 0, 1]});

  iterate(tick);

  loopbuf.use(() => regl.clear({color: [0, 0, 0, 1]}));

  splatDensity({dest: loopbuf, src: y[1], multiplier: multiplier})

  drawToScreen({src: loopbuf});
  var t2 = Date.now();
});
