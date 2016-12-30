'use strict';

const h = require('h');
const extend = require('xtend');
const css = require('insert-css');
const fs = require('fs');
const control = h('div#control');
document.body.appendChild(control);
const controlHeader = h('div.control-header', 'Controls')
control.appendChild(controlHeader);
control.addEventListener('mousemove', e => e.stopPropagation());
control.addEventListener('mousedown', e => e.stopPropagation());
controlHeader.addEventListener('click', (e) => {
  e.stopPropagation();
  control.classList.toggle('expanded')
});
css(fs.readFileSync(__dirname + '/index.css', 'utf8'));

require('regl')({
  pixelRatio: 1.0,
  extensions: [
    'oes_texture_float',
    'oes_standard_derivatives'
  ],
  onDone: (err, regl) => {
    if (err) return require('fail-nicely')(err);
    run(regl);
  }
});

function run(regl) {
  const camera = require('./camera')(regl, {
    far: 10000,
    up: [0, 0, 1],
    right: [-1, 0, 0],
    front: [0, 1, 0],
    phi: Math.PI * 0.1,
    theta: Math.PI * 0.6,
    distance: 30,
  });

  var params = {
    maxLife: 1000000,
    rs: 1.0,
    dt: 1.0,
    alpha: 0.3,
    dilation: true,
    axes: false,
    spread: 1.0,
    v0: 1.0,
    r0: 10.0,
    shape: [256, 256, 4],
    gridAlpha: 0.15,
    gridRadius: 500,
    gridSpacing: 1.0,
    gridBg: [0.12, 0.12, 0.12, 1],
    gridFg: [1, 1, 1, 1],
    paraboloid: true
  };

  const gpu = require('./regl-cwise')(regl);
  const copy = require('./copy')(gpu);
  const allocate = require('./allocate')(gpu, {copy: copy});
  const init = require('./initialize')(gpu, {copy: copy});
  const integrate = require('./integrator')(gpu);
  const constrain = require('./constrain')(gpu, {copy: copy});
  const drawGrid = require('./grid')(regl, {radius: params.gridRadius});
  const restartDead = require('./restart-dead')(gpu, {copy: copy});
  const drawHole = require('./hole')(regl);
  const drawAxis = require('./axis')(regl, {radius: 100, alpha: 0.3});
  const drawParticles = require('./particles')(regl);

  require('control-panel')([
    {type: 'range', label: 'rs', min: 0.01, max: 10.0, initial: params.rs},
    {type: 'range', label: 'alpha', min: 0.0, max: 1.0, initial: params.alpha},
    {type: 'range', label: 'gridAlpha', min: 0.0, max: 1.0, initial: params.gridAlpha},
    {type: 'range', label: 'gridSpacing', min: 1.0, max: 50.0, initial: params.gridSpacing, steps: 49},
    {type: 'range', label: 'r0', min: 1.5, max: 50.0, initial: params.r0},
    {type: 'range', label: 'v0', min: 0.5, max: 1.5, initial: params.v0},
    {type: 'range', label: 'dt', min: 0.1, max: 100, initial: params.dt, scale: 'log', steps: 401},
    {type: 'range', label: 'spread', min: 0.01, max: 10.0, initial: params.spread},
    {type: 'button', label: 'restart', action: reinitialize},
    {type: 'checkbox', label: 'dilation', initial: params.dilation},
    {type: 'checkbox', label: 'axes', initial: params.axes},
    {type: 'checkbox', label: 'paraboloid', initial: params.paraboloid},
  ], {root: control, theme: 'light'}).on('input', data => params = extend(params, data));


  const {y0, v0, y, v, texCoords} = allocate(params);

  function reinitialize () {
    init(y0, v0, y, v, params);
    constrain(y[0], v[0], v[1], params);
  }

  reinitialize();

  let decay = 0.9;
  let dilation = 1.0;
  let paraboloid = 1.0;

  regl.frame(({tick}) => {
    dilation = params.dilation * decay + (1 - decay) * (params.dilation ? 1 : 0);
    paraboloid = paraboloid * decay + (1 - decay) * (params.paraboloid ? 1 : 0);

    integrate(y, v, extend(params, {dilation: dilation}));
    restartDead(y0, v0, y[0], v[0], y[1], v[1], params);
    //constrain(y[0], v[0], v[1], params);

    camera((props) => {
      regl.clear({color: [0.12, 0.12, 0.12, 1.0], depth: 1});
      if (params.gridAlpha > 1e-4) {
        drawGrid(extend(params, {paraboloid: paraboloid}));
      }
      if (params.axes) drawAxis();
      drawHole(extend(params, {paraboloid: paraboloid}));
      drawParticles(extend(params, {data: y[0], texcoords: texCoords, paraboloid: paraboloid}));
    });
  });
}
