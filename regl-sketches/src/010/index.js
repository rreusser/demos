const glsl = require('glslify');

var qs = require('query-string');
var q = qs.parse(window.location.search);

function downloadURI(uri, name) {
  var link = document.createElement("a");
  link.download = name;
  link.href = uri;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

require('insert-css')(`
html, body {
  margin: 0;
  padding: 0;
}

canvas {
  margin-left: auto;
  margin-right: auto;
  display: inline-block;
}
`)

var canvas = null;
if (q.w && q.h) {
  var dpr = q.dpr ? parseFloat(q.dpr) : 1;
  canvas = document.createElement('canvas');
  canvas.width = q.w * dpr;
  canvas.height = q.h * dpr;
  canvas.style.width = parseInt(q.w) + 'px'
  canvas.style.height = parseInt(q.h) + 'px'
  document.body.append(canvas);
}

const regl = require('regl')({
  extensions: ['oes_standard_derivatives'],
  canvas: canvas,
  attributes: {
    antialias: false,
    stencil: false,
    depth: false,
    alpha: false,
    preserveDrawingBuffer: true
  },
  onDone: (err, regl) => {
    if (err) return require('fail-nicely')(err);
    document.querySelector('canvas').addEventListener('mousewheel', e => e.preventDefault());
    run(regl);
  }
});

function run (regl) {
  const size = [41, 81];

  const params = {
    mux: -0.08,
    muy: 0.08,
    n: 1.94,
    radius: 1,
    circulation: 0.0,
    alpha: 10,
    kuttaCondition: true,
    cpAlpha: 0.2,
    streamAlpha: 0.15,
    colorScale: 0.425,
    gridAlpha: 0.0,
    size: 10,
    gridSize: size,
    xmin: -2,
    xmax: 2,
    frames: q.frames ? parseFloat(q.frames) : 1,
    rotation: q.rotation ? parseFloat(q.rotation) : 0
  };

  const camera = require('./camera-2d')(regl, params);
  window.addEventListener('resize', camera.resize);

  const mesh = require('./mesh')(
    (r, th) => [Math.pow(r, 1.5), th],
    size[0], size[1], [0, 1], [0, Math.PI * 2]
  );

  const controls = require('./controls')([
    {type: 'range', label: 'mux', initial: params.mux, min: -0.8, max: 0.0, step: 0.01},
    {type: 'range', label: 'muy', initial: params.muy, min: -0.8, max: 0.8, step: 0.01},
    {type: 'range', label: 'n', initial: params.n, min: 1.0, max: 2.0, step: 0.01},
    {type: 'range', label: 'radius', initial: params.radius, min: 1.0, max: 2.0, step: 0.01},
    {type: 'range', label: 'alpha', initial: params.alpha, min: -90, max: 90, step: 0.1},
    {type: 'range', label: 'circulation', initial: params.circulation, min: -5.0, max: 5.0, step: 0.01},
    {type: 'checkbox', label: 'kuttaCondition', initial: params.kuttaCondition},
    {type: 'range', label: 'gridAlpha', initial: params.gridAlpha, min: 0.0, max: 1.0, step: 0.01},
    {type: 'range', label: 'cpAlpha', initial: params.cpAlpha, min: 0.0, max: 1.0, step: 0.01},
    {type: 'range', label: 'streamAlpha', initial: params.streamAlpha, min: 0.0, max: 1.0, step: 0.01},
    {type: 'range', label: 'colorScale', initial: params.colorScale, min: 0.0, max: 1.0, step: 0.01},
    {type: 'range', label: 'size', initial: params.size, min: 0.1, max: 20.0, step: 0.1},
  ], params, () => {
    camera.taint();
  })

  window.addEventListener('resize', camera.taint);
  const draw = require('./draw-mesh')(regl, mesh);
  const setUniforms = require('./uniforms')(regl);

  let frame = 0;
  let newframe = false;
  let t = 0;

  if (q.frames) {
    params.time = 0;
  }

  regl.frame(({tick}) => {

    camera.draw(({dirty}) => {
      if (!dirty && !q.rotation) return;

      setUniforms(params, () => {
        regl.clear({color: [1, 1, 1, 1], depth: 1});
        draw();
      });

      newframe = true;

    });

    if (q.frames && newframe && frame < params.frames) {
      downloadURI(regl._gl.canvas.toDataURL(), 'frame-' + (1000 + frame) + '.png');
      frame++;
      params.time = frame / params.frames;
      camera.taint();
      newframe = false;
    }
  });
}
