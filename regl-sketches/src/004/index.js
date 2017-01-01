'use strict';

const extend = require('extend');

require('regl')({
  pixelRatio: 1.0,
  extensions: ['oes_texture_float', 'oes_standard_derivatives'],
  onDone: (err, regl) => {
    if (err) return require('fail-nicely')(err);
    run(regl);
  }
});

const toSide = n => Math.pow(Math.round(Math.sqrt(n)), 2);

function run(regl) {
  const params = {
    n: 384 * 384,
    dt: 0.1,
    t: 0.0,
    lumaMin: 0.007,
    lumaMax: 10,
    gamma: 0.6
  };

  const state = {};
  const camera = require('./camera')(regl, {phi: Math.PI * 0.2, distance: 10});
  const gpu = require('./regl-cwise')(regl);
  const allocate = require('./allocate')(gpu);
  const initialize = require('./initialize')(regl);
  const integrate = require('./integrator')(gpu);
  const drawParticles = require('./particles')(regl);
  const colorCorrect = require('./color-correct')(gpu);

  allocate(state, params);
  initialize(state, params);

  require('./controls')([
    {type: 'range', label: 'dt', min: 0.01, max: 0.5, initial: params.dt, step: 0.01},
    {type: 'range', label: 'n', min: 10000, max: 1e6, initial: params.n, step: 10000},
    {type: 'range', label: 'gamma', min: 0.1, max: 2, initial: params.gamma, steps: 190},
    {type: 'range', label: 'lumaMin', min: 0.001, max: 0.1, initial: params.lumaMin, steps: 1000},
    {type: 'range', label: 'lumaMax', min: 1, max: 20, initial: params.lumaMax, steps: 190},
  ], params, (nextProps, props) => {
    if ((nextProps.n = toSide(nextProps.n)) !== toSide(props.n)) {
      allocate(state, params);
      initialize(state, params);
    }
  })

  const screenbuffer = gpu.array(null, [regl._gl.canvas.width, regl._gl.canvas.height, 4]);

  regl.frame(({tick}) => {
    integrate(state, params);

    screenbuffer.use(() => {
      regl.clear({color: [0.04, 0.04, 0.04, 1], depth: 1});
      camera(() => drawParticles(extend(state, params)));
    });

    colorCorrect([null, screenbuffer, params.gamma, Math.log(params.lumaMin), Math.log(params.lumaMax)]);
  });
}
