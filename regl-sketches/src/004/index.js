'use strict';

require('regl')({
  pixelRatio: 1.0,
  extensions: ['oes_texture_float', 'oes_standard_derivatives'],
  onDone: (err, regl) => {
    if (err) return require('fail-nicely')(err);
    run(regl);
  }
});

function run(regl) {
  const params = {
    shape: [256, 256, 4],
    dt: 0.1,
    t: 0.0
  };

  const camera = require('./camera')(regl, {phi: Math.PI * 0.2, distance: 10});
  const gpu = require('./regl-cwise')(regl);
  const copy = require('./copy')(gpu);
  const allocate = require('./allocate')(gpu);
  const initialize = require('./initialize')(regl);
  const integrate = require('./integrator')(gpu);
  const drawParticles = require('./particles')(regl);
  const state = allocate(params);
  initialize(state, params);

  const screenbuffer = gpu.array(null, [regl._gl.canvas.width, regl._gl.canvas.height, 4]);
  state.n = params.shape[0] * params.shape[1];

  regl.frame(({tick}) => {
    integrate(state, params);

    screenbuffer.use(() => {
      regl.clear({color: [0.12, 0.12, 0.12, 1], depth: 1});
      camera(() => {
        drawParticles(state);
      });
    });

    copy([null, screenbuffer]);
  });
}
