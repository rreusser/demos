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
  const camera = require('./camera-2d')(regl, {x: [0, 0], zoom: 0.3});

  const wireframe = require('glsl-solid-wireframe');
  const mesh = require('./mesh')(
    (r, th) => [Math.pow(r, 1.5), th],
    31, 81, [0, 1], [0, Math.PI * 2]
  );

  const params = {
    mux: -0.08,
    muy: 0.08,
    n: 1.94,
    circulation: 9.31,
    kuttaCondition: false,
    cpAlpha: 0.8,
    streamAlpha: 0.2,
  };

  const controls = require('./controls')([
    {type: 'range', label: 'mux', initial: params.mux, min: -0.4, max: 0.0, step: 0.01},
    {type: 'range', label: 'muy', initial: params.muy, min: -0.4, max: 0.4, step: 0.01},
    {type: 'range', label: 'n', initial: params.n, min: 1.0, max: 2.0, step: 0.01},
    //{type: 'range', label: 'velocity', initial: params.velocity, min: 0.01, max: 10.0, step: 0.01},
    {type: 'range', label: 'circulation', initial: params.circulation, min: -50.0, max: 50.0, step: 0.01},
    {type: 'checkbox', label: 'kuttaCondition', initial: params.kuttaCondition},
    {type: 'range', label: 'cpAlpha', initial: params.cpAlpha, min: 0.0, max: 1.0, step: 0.01},
    {type: 'range', label: 'streamAlpha', initial: params.streamAlpha, min: 0.0, max: 1.0, step: 0.01},
  ], params, () => {
    camera.taint();
  })

  window.addEventListener('resize', camera.taint);

  const draw = require('./draw-mesh')(regl, mesh);
  const setUniforms = require('./uniforms')(regl, params);

  const loop = regl.frame(({tick}) => {
    camera(({dirty}) => {
      if (!dirty) return;
      setUniforms(() => {
        regl.clear({color: [1, 1, 1, 1], depth: 1});
        draw();
      });
    });
  });
}
