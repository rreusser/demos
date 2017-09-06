const canvas = document.createElement('canvas');
canvas.width = 384;
canvas.height = 384;
canvas.style.width = (384 * 2) + 'px';
canvas.style.height = (384 * 2) + 'px';
document.body.appendChild(canvas);

require('insert-css')(`
html, body {
  margin: 0;
  padding: 0;
  text-align: center;
}
body {
  background-color: black;
}
canvas {
  position: relative;
  top: 50vh;
  transform: translate(0, -50%);
}
`);

const regl = require('regl')({
  canvas: canvas,
  pixelRatio: 1,
  extensions: [
    'oes_texture_half_float',
    'oes_texture_half_float_linear',
  ],
  optionalExtensions: [
    'oes_texture_float',
    'oes_texture_float_linear',
  ],
  onDone: require('fail-nicely')(run)
});

function run (regl) {
  const hasFloat = regl.limits.extensions.indexOf('oes_texture_float') !== -1;
  const hasFloatLinear = regl.limits.extensions.indexOf('oes_texture_float_linear') !== -1;

  const swap = require('./swap');
  const advect = require('./advect')(regl);
  const relax = require('./relax')(regl);
  const log = require('./log')(regl);
  const field = require('./draw')(regl);
  const computeDivergence = require('./divergence')(regl);
  const computeVorticity = require('./vorticity')(regl);
  const project = require('./project')(regl);

  const n = [384, 384];

  const grid = require('./grid')(regl, {
    n: n,
    type: (hasFloat && hasFloatLinear) ? 'float' : 'half float'
  });

  const uniforms = require('./uniforms')(regl, {
    n: n,
    xrange: [-1, 1],
    yrange: [-1, 1],
    dt: 0.001,
  });

  const lines = require('./lines')(regl, {n: n});

  const initialize = require('./initialize')(regl, {
    u: `vec4 f(vec2 xy) {
      float r = length(xy);
      return vec4(exp(-r * r * 50.0), 0.0, 0.0, 1.0);
    }`,
    T: `vec4 f(vec2 xy) {
      vec2 cen = vec2(1.0, 0.5);
      vec2 xrel = (xy - cen) * vec2(4.0, 4.0);
      return vec4(1.0 / (1.0 + 2.0 * dot(xrel, xrel)), 0, 0, 1);
    }`,
  });

  uniforms(() => {
    initialize(grid);
  });

  function iterate () {
    uniforms(() => {
      // Use the divergence buffer to store the vorticity just between
      // this step and the advection:
      computeVorticity({
        src: grid.u0,
        dst: grid.div
      });

      advect({
        src: grid.u0,
        dst: grid.u1,
        vorticity: grid.div,
        u: grid.u0,
      });

      computeDivergence({
        src: grid.u0,
        dst: grid.div
      });

      for (let i = 0; i < 15; i++) {
        relax({
          src: grid.phi0,
          dst: grid.phi1,
          div: grid.div
        });

        swap(grid, 'phi0', 'phi1');
      }

      project({
        src: grid.u1,
        dst: grid.u0,
        phi: grid.phi0
      });

      field({src: grid});
      //lines({src: grid.u0});
    });
  }

  if (true) {
    regl.frame(({tick}) => {
      //if (tick % 30 !== 1) return
      //if (tick > 80) return;
      iterate();
    });
  } else {
    iterate();
  }
};
