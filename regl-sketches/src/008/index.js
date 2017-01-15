const hsl2rgb = require('float-hsl2rgb');
const glslify = require('glslify');
const roots = require('durand-kerner');
const randn = require('random-normal');
const h = require('h');

var explanation = h('div.explanation', [
  h('h1', [
    'Roots of a degree n polynomial with',
    h('br'),
    'random coefficients on the integer complex grid',
    h('br'),
    h('small', [
      'Based on John Baez\'s ',
      h('a', 'The Beauty of Roots', {href: 'http://www.math.ucr.edu/home/baez/roots/'})
    ])
  ])
]);

document.body.appendChild(explanation);

const regl = require('regl')({
  extensions: ['OES_texture_float', 'oes_standard_derivatives'],
  onDone: (err, regl) => {
    if (err) return require('fail-nicely')(err);
    document.querySelector('canvas').addEventListener('mousewheel', e => e.preventDefault());
    run(regl);
  }
});

function run (regl) {
  var params = {
    alpha: 1.0,
    gamma: 2.5,
    grid: 0.1,
    realRange: 4,
    imagRange: 4,
    batchSize: 8000,
    gaussianRandom: false,
    colormap: 'viridis',
    x0: 0,
    y0: 0,
    zoom: 0,
    degree: 4,
    useSymmetry: false
  };
  params.n = params.degree + 1;

  var byColormap = {
    viridis: glslify(`
      precision mediump float;
      #pragma glslify: colormap = require(glsl-colormap/viridis)
      uniform sampler2D src;
      uniform float alf, alpha, gamma;
      varying vec2 uv;
      void main () {
        float dens = texture2D(src, uv).x;
        float r = length(dens);
        float intens = max(0.0, min(1.0, dens / r * alpha * pow(r * alf, gamma)));
        vec4 color = colormap(intens);
        gl_FragColor = vec4(color.xyz * color.w, 1);
      }
    `),
    electric: glslify(`
      precision mediump float;
      #pragma glslify: colormap = require(glsl-colormap/electric)
      uniform sampler2D src;
      uniform float alf, alpha, gamma;
      varying vec2 uv;
      void main () {
        float dens = texture2D(src, uv).x;
        float r = length(dens);
        float intens = max(0.0, min(1.0, dens / r * alpha * pow(r * alf, gamma)));
        vec4 color = colormap(intens);
        gl_FragColor = vec4(color.xyz * color.w, 1);
      }
    `),
    density: glslify(`
      precision mediump float;
      #pragma glslify: colormap = require(glsl-colormap/density)
      uniform sampler2D src;
      uniform float alf, alpha, gamma;
      varying vec2 uv;
      void main () {
        float dens = texture2D(src, uv).x;
        float r = length(dens);
        float intens = max(0.0, min(1.0, dens / r * alpha * pow(r * alf, gamma)));
        vec4 color = colormap(intens);
        gl_FragColor = vec4(color.xyz * color.w, 1);
      }
    `),
    bone: glslify(`
      precision mediump float;
      #pragma glslify: colormap = require(glsl-colormap/bone)
      uniform sampler2D src;
      uniform float alf, alpha, gamma;
      varying vec2 uv;
      void main () {
        float dens = texture2D(src, uv).x;
        float r = length(dens);
        float intens = max(0.0, min(1.0, dens / r * alpha * pow(r * alf, gamma)));
        vec4 color = colormap(intens);
        gl_FragColor = vec4(color.xyz * color.w, 1);
      }
    `),
    chlorophyll: glslify(`
      precision mediump float;
      #pragma glslify: colormap = require(glsl-colormap/chlorophyll)
      uniform sampler2D src;
      uniform float alf, alpha, gamma;
      varying vec2 uv;
      void main () {
        float dens = texture2D(src, uv).x;
        float r = length(dens);
        float intens = max(0.0, min(1.0, dens / r * alpha * pow(r * alf, gamma)));
        vec4 color = colormap(intens);
        gl_FragColor = vec4(color.xyz * color.w, 1);
      }
    `),
    par: glslify(`
      precision mediump float;
      #pragma glslify: colormap = require(glsl-colormap/par)
      uniform sampler2D src;
      uniform float alf, alpha, gamma;
      varying vec2 uv;
      void main () {
        float dens = texture2D(src, uv).x;
        float r = length(dens);
        float intens = max(0.0, min(1.0, dens / r * alpha * pow(r * alf, gamma)));
        vec4 color = colormap(intens);
        gl_FragColor = vec4(color.xyz * color.w, 1);
      }
    `),
    cdom: glslify(`
      precision mediump float;
      #pragma glslify: colormap = require(glsl-colormap/cdom)
      uniform sampler2D src;
      uniform float alf, alpha, gamma;
      varying vec2 uv;
      void main () {
        float dens = texture2D(src, uv).x;
        float r = length(dens);
        float intens = max(0.0, min(1.0, dens / r * alpha * pow(r * alf, gamma)));
        vec4 color = colormap(intens);
        gl_FragColor = vec4(color.xyz * color.w, 1);
      }
    `),
    inferno: glslify(`
      precision mediump float;
      #pragma glslify: colormap = require(glsl-colormap/inferno)
      uniform sampler2D src;
      uniform float alf, alpha, gamma;
      varying vec2 uv;
      void main () {
        float dens = texture2D(src, uv).x;
        float r = length(dens);
        float intens = max(0.0, min(1.0, dens / r * alpha * pow(r * alf, gamma)));
        vec4 color = colormap(intens);
        gl_FragColor = vec4(color.xyz * color.w, 1);
      }
    `),
    cubehelix: glslify(`
      precision mediump float;
      #pragma glslify: colormap = require(glsl-colormap/cubehelix)
      uniform sampler2D src;
      uniform float alf, alpha, gamma;
      varying vec2 uv;
      void main () {
        float dens = texture2D(src, uv).x;
        float r = length(dens);
        float intens = max(0.0, min(1.0, dens / r * alpha * pow(r * alf, gamma)));
        vec4 color = colormap(intens);
        gl_FragColor = vec4(color.xyz * color.w, 1);
      }
    `),
  };

  function clear () {
    fbo.use(() => {
      regl.clear({color: [0, 0, 0, 1]});
    });
    batchCnt = 0;
  }

  require('./controls')([
    {type: 'range', label: 'realRange', min: 0, max: 10, initial: params.realRange, step: 1},
    {type: 'range', label: 'imagRange', min: 0, max: 10, initial: params.imagRange, step: 1},
    {type: 'checkbox', label: 'gaussianRandom', initial: params.gaussianRandom},
    {type: 'range', label: 'degree', min: 2, max: 24, initial: params.degree, step: 1},
    {type: 'range', label: 'batchSize', min: 1, max: 10000, initial: params.batchSize, step: 1},
    {type: 'range', label: 'x0', min: -4, max: 4, initial: params.x0, step: 0.01},
    {type: 'range', label: 'y0', min: -4, max: 4, initial: params.y0, step: 0.01},
    {type: 'range', label: 'zoom', min: -5, max: 5, initial: params.zoom, step: 0.01},
    {type: 'range', label: 'alpha', min: 0.0, max: 2.0, initial: params.alpha, step: 0.01},
    {type: 'range', label: 'gamma', min: 0.0, max: 4.0, initial: params.gamma, step: 0.01},
    {type: 'range', label: 'grid', min: 0, max: 1, initial: params.grid, step: 0.01},
    {type: 'checkbox', label: 'useSymmetry', initial: params.useSymmetry},
    {type: 'select', label: 'colormap', options: Object.keys(byColormap), initial: params.colormap},
  ], params, (nextProps, props) => {
    if (nextProps.realRange !== props.realRange || nextProps.imagRange !== props.imagRange) {
      clear();
    }

    params.n = params.degree + 1;

    if (nextProps.n !== props.n) {
      clear();
      buf = new Float32Array(params.n * 2 * params.batchSize);
      coeffs = [[], []];
    }

    if (nextProps.gaussianRandom !== props.gaussianRandom ||
      nextProps.x0 !== props.x0 ||
      nextProps.y0 !== props.y0 ||
      nextProps.zoom !== props.zoom) {
      clear();
    }

    if (nextProps.batchSize !== props.batchSize) {
      buf = new Float32Array(params.n * 2 * params.batchSize);
      coeffs = [[], []];
    }
  });

  var setParams = regl({
    uniforms: {
        ar: ctx => [ctx.framebufferHeight / ctx.framebufferWidth, 1.0],
        alpha: (ctx, props) => props.alpha * Math.pow(Math.exp(props.zoom), 1.5),
        gamma: (ctx, props) => 1.0 / props.gamma,
        x0: regl.prop('x0'),
        y0: regl.prop('y0'),
        gridAlpha: regl.prop('grid'),
        zoom: (ctx, props) => Math.exp(props.zoom)
      }
  });

  var coeffs = [[], []];

  var buf = new Float32Array(params.n * 2 * params.batchSize);
  var rootPts = regl.buffer(buf);
  function compute () {
    for (j = 0; j < params.batchSize; j++) {
      if (params.gaussianRandom) {
        for (var i = 0; i < params.n; i++) {
          coeffs[0][i] = params.realRange ? (Math.round(randn() * params.realRange)) : 0;
          coeffs[1][i] = params.imagRange ? (Math.round(randn() * params.imagRange)) : 0;
        }
      } else {
        for (var i = 0; i < params.n; i++) {
          coeffs[0][i] = params.realRange ? (Math.floor(Math.random() * (params.realRange * 2 + 1)) - params.realRange) : 0;
          coeffs[1][i] = params.imagRange ? (Math.floor(Math.random() * (params.imagRange * 2 + 1)) - params.imagRange) : 0;
        }
      }
      var zeros = roots(coeffs[0], coeffs[1]);
      for (var i = 0; i < params.n; i++) {
        buf[j * params.n * 2 + 2 * i] = zeros[0][i];
        buf[j * params.n * 2 + 2 * i + 1] = zeros[1][i];
      }
    }
    rootPts(buf);
    batchCnt += (params.useSymmetry ? 4 : 1) * (params.batchSize * params.n);
  }

  var fbo = regl.framebuffer({
    width: regl._gl.canvas.width, height: regl._gl.canvas.height,
    depth: false,
    colorType: 'float'
  });

  const drawPoints = regl({
    vert: `
      precision mediump float;
      attribute vec2 xy;
      uniform vec2 ar, scale;
      uniform float x0, y0, zoom;
      void main () {
        gl_Position = vec4((xy * scale - vec2(x0, y0)) * zoom * ar * 0.5, 0, 1);
        gl_PointSize = 1.0;
      }
    `,
    frag: `
      precision mediump float;
      void main () {
        gl_FragColor = vec4(vec3(1), 0.5);
      }
    `,
    uniforms: {scale: regl.prop('scale')},
    depth: {enable: false},
    blend: {
      enable: true,
      func: {srcRGB: 'src alpha', srcAlpha: 1, dstRGB: 1, dstAlpha: 1},
      equation: {rgb: 'add', alpha: 'add'}
    },
    attributes: {xy: rootPts},
    primitive: 'points',
    count: () => params.n * params.batchSize
  });


  const drawToScreen = regl({
    vert: `
      precision mediump float;
      attribute vec2 xy;
      varying vec2 uv;
      void main () {
        uv = 0.5 * (1.0 + xy);
        gl_Position = vec4(xy, 0, 1);
      }
    `,
    frag: (ctx, props) => byColormap[params.colormap],
    attributes: {xy: [[-4, -4], [0, 4], [4, -4]]},
    uniforms: {
      src: fbo,
      alf: (ctx, props) => props.alf / Math.pow(ctx.framebufferWidth * ctx.framebufferHeight, 0.25)
    },
    depth: {enable: false},
    count: 3
  });

  const drawGrid = regl({
    vert: `
      precision mediump float;
      attribute vec2 xy;
      varying vec2 uv;
      void main () {
        uv = xy;
        gl_Position = vec4(xy, 0, 1);
      }
    `,
    frag: glslify(`
      #extension GL_OES_standard_derivatives : enable
      precision mediump float;
      #pragma glslify: grid = require(glsl-solid-wireframe/cartesian/scaled)
      varying vec2 uv;
      uniform float x0, y0, zoom, gridAlpha;
      uniform vec2 ar;
      void main () {
        vec2 xy = vec2(x0, y0) + uv * 4.0 / zoom / ar * 0.5;
        gl_FragColor = vec4(vec3(1), gridAlpha * (1.0 - grid(xy, 1.0)));
      }
    `),
    blend: {
      enable: true,
      func: {srcRGB: 'src alpha', srcAlpha: 1, dstRGB: 1, dstAlpha: 1},
      equation: {rgb: 'add', alpha: 'add'}
    },
    attributes: {
      xy: [[-4, -4], [0, 4], [4, -4]]
    },
    depth: {enable: false},
    count: 3
  });

  var single = [{scale: [1, 1]}];
  var reflected = [
    {scale: [1, 1]},
    {scale: [-1, 1]},
    {scale: [1, -1]},
    {scale: [-1, -1]},
  ];

  var batchCnt = 0;
  clear();
  const loop = regl.frame(({time, tick}) => {
    compute();
    setParams(params, () => {
      fbo.use(() => {
        drawPoints(params.useSymmetry ? reflected : single);
      });
      drawToScreen({alf: 1e8 / batchCnt});
      if (params.grid) {
        drawGrid();
      }
    });
  });
}
