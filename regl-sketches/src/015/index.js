const btns = document.createElement('div');

const resetBtn = document.createElement('button');
resetBtn.innerHTML = 'Reset';

const gridBtn = document.createElement('button');
gridBtn.innerHTML = 'Grid';

const interfaceBtn = document.createElement('button');
interfaceBtn.innerHTML = 'Interface';

const randomBtn = document.createElement('button');
randomBtn.innerHTML = 'Random';

const rtBtn = document.createElement('button');
rtBtn.innerHTML = 'Rayleigh-Taylor';

const khBtn = document.createElement('button');
khBtn.innerHTML = 'Kelvin-Helmholtz';

btns.appendChild(rtBtn);
btns.appendChild(khBtn);
btns.appendChild(interfaceBtn);
btns.appendChild(gridBtn);
btns.appendChild(randomBtn);
btns.appendChild(resetBtn);
btns.classList.add('btns');
document.body.appendChild(btns);

const canvas = document.createElement('canvas');
var pixelRatio = 2.0;
canvas.width = 384 * pixelRatio;
canvas.height = 384 * pixelRatio;
//canvas.style.width = (384) + 'px';
//canvas.style.height = (384) + 'px';
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

.btns {
  position: absolute;
  top: 5px;
  left: 5px;
  z-index: 1;
}

.btns button {
  background: none;
  border: 1px solid white;
  border-radius: 2px;
  color: white;
  outline: none;
  margin-right: 5px;
}

.btns button:active {
  background-color: white;
  color: black;
}

`);

const regl = require('regl')({
  canvas: canvas,
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

  const pointType = window.location.hash.replace(/^#/, '') || 'interface';
  const swap = require('./swap');
  const pointData = require('./initialize-points')(regl, 100000, null, pointType);
  const advect = require('./advect')(regl);
  const advectPoints = require('./advect-points')(regl);
  const drawPoints = require('./draw-points')(regl);
  const relax = require('./relax')(regl);
  const log = require('./log')(regl);
  const field = require('./draw')(regl);
  const computeDivergence = require('./divergence')(regl);
  const computeVorticity = require('./vorticity')(regl);
  const project = require('./project')(regl);

  gridBtn.addEventListener('click', function () {
    window.location.hash = 'grid';
    require('./initialize-points')(regl, 100000, pointData, 'grid');
  });

  interfaceBtn.addEventListener('click', function () {
    window.location.hash = 'interface';
    require('./initialize-points')(regl, 100000, pointData, 'interface');
  });

  randomBtn.addEventListener('click', function () {
    window.location.hash = 'random';
    require('./initialize-points')(regl, 100000, pointData, 'random');
  });

  resetBtn.addEventListener('click', doInit);

  rtBtn.addEventListener('click', function () {
    state.type = 'rt';
    doInit();
  });

  khBtn.addEventListener('click', function () {
    state.type = 'kh';
    doInit();
  });

  const n = [256, 256];

  const grid = require('./grid')(regl, {
    n: n,
    type: (hasFloat && hasFloatLinear) ? 'float' : 'half float'
  });

  var state = {
    type: 'rt',
  }

  const uniforms = require('./uniforms')(regl, {
    n: n,
    xrange: [-1, 1],
    yrange: [-1, 1],
    dt: 0.0005,
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

  function doInit () {
    uniforms(state, () => {
      initialize(grid);
    });

    require('./initialize-points')(regl, 100000, pointData, window.location.hash.replace(/^#/, '') || 'interface');
  }

  function iterate (tick, skipDraw) {
    uniforms(state, () => {
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
      });

      computeDivergence({
        src: grid.u0,
        dst: grid.div
      });

      for (let i = 0; i < 20; i++) {
        relax({
          src: grid.phi0,
          dst: grid.phi1,
          div: grid.div,
          sor: true
        });
      }

      /*for (let i = 0; i < 2; i++) {
        relax({
          src: grid.phi0,
          dst: grid.phi1,
          div: grid.div,
          sor: false
        });
      }*/

      project({
        src: grid.u1,
        dst: grid.u0,
        phi: grid.phi0
      });

      pointData.u = grid.u0;
      advectPoints(pointData);
      swap(pointData, 'src', 'dst');

      if (!skipDraw) {
        field({src: grid});
        drawPoints(pointData);
        //lines({src: grid.u0});
      }
    });
  }

  doInit();

  regl.frame(({tick}) => {
    //if (tick % 20 !== 1) return
    //if (tick > 800) return;

    iterate(tick);
  });
};
