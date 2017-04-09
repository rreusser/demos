const karmanTrefftz = require('./karman-trefftz');
const glsl = require('glslify');
const regl = require('regl')({
  extensions: ['oes_standard_derivatives'],
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
    colorScale: 0.25,
    gridAlpha: 0.0,
    //karmanTrefftz: 1.0,
    size: 8.0,
    gridSize: size,
    xmin: -3,
    xmax: 3,
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
    {type: 'range', label: 'size', initial: params.size, min: 0.1, max: 10.0, step: 0.1},
  ], params, () => {
    camera.taint();
  })

  window.addEventListener('resize', camera.taint);

  const draw = require('./draw-mesh')(regl, mesh);
  const setUniforms = require('./uniforms')(regl, params);

  const loop = regl.frame(({tick}) => {
    camera.draw(({dirty}) => {
      if (!dirty) return;
      setUniforms(() => {
        regl.clear({color: [1, 1, 1, 1], depth: 1});
        draw();
      });
    });
  });
}
