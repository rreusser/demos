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
    shape: [384, 384, 4],
    dt: 0.1,
    t: 0.0
  };

  const camera = require('./camera')(regl, {phi: Math.PI * 0.2, distance: 10});
  const gpu = require('./regl-cwise')(regl);
  const allocate = require('./allocate')(gpu);
  const initialize = require('./initialize')(regl);
  const integrate = require('./integrator')(gpu);
  const drawParticles = require('./particles')(regl);
  const state = allocate(params);
  const colorCorrect = require('./color-correct')(gpu);
  initialize(state, params);

  const screenbuffer = gpu.array(null, [regl._gl.canvas.width, regl._gl.canvas.height, 4]);
  state.n = params.shape[0] * params.shape[1];

  regl.frame(({tick}) => {
    integrate(state, params);

    screenbuffer.use(() => {
      regl.clear({color: [0.03, 0.03, 0.03, 1], depth: 1});
      camera(() => {
        drawParticles(state);
      });
    });

    colorCorrect([null, screenbuffer]);
  });
}
