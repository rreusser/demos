'use strict';

const extend = require('xtend/mutable');

require('regl')({
  //pixelRatio: 2.5,
  extensions: [
    'oes_texture_float',
    'oes_texture_float_linear',
    'oes_element_index_uint'
  ],
  onDone: (err, regl) => {
    if (err) return require('fail-nicely')(err);
    run(regl);
  }
});

function run(regl) {
  const controls = require('./controls');

  const params = {
    n: 1024,
    nRain: 512,
    seed: 0,
    smoothing: 0.5,
    rain: false,
    terrain: true,
    erosion: true,
    dt: 0.01,
    evaporationTime: 10.0,
    restartThreshold: 0.3,
    gravity: 0.1,
    maxVelocity: 0.1,
    friction: 2.0,
    carveRate: 0.5,
    carryingCapacity: 0.15,
  };

  controls([
    {type: 'range', label: 'n', min: 16, max: 1024, step: 1, initial: params.n},
    {type: 'range', label: 'nRain', min: 16, max: 1024, step: 1},
    {type: 'range', label: 'seed', min: 0, max: 100, step: 0.01, initial: params.seed},
    {type: 'range', label: 'smoothing', min: 0.0, max: 1.0, steps: 100, initial: params.smoothing},
    {type: 'range', label: 'dt', min: 0.001, max: 0.04, step: 0.001, initial: params.dt},
    {type: 'range', label: 'evaporationTime', min: 1.0, max: 100.0, step: 1.0, initial: params.evaporationTime},
    {type: 'range', label: 'restartThreshold', min: 0.0, max: 0.9, step: 0.01, initial: params.restartThreshold},
    {type: 'range', label: 'gravity', min: 0.01, max: 0.5, step: 0.01, initial: params.gravity},
    {type: 'range', label: 'maxVelocity', min: 0.01, max: 0.5, step: 0.01, initial: params.maxVelocity},
    {type: 'range', label: 'friction', min: 0.0, max: 10.0, step: 0.1, initial: params.friction},
    {type: 'range', label: 'carveRate', min: 0.01, max: 1.0, step: 0.01, initial: params.carveRate},
    {type: 'range', label: 'carryingCapacity', min: 0.01, max: 1.0, step: 0.01, initial: params.carryingCapacity},
    {type: 'checkbox', label: 'rain', initial: params.rain},
    {type: 'checkbox', label: 'terrain', initial: params.terrain},
    {type: 'checkbox', label: 'erosion', initial: params.erosion},
  ], params, (prevProps, props) => {
    let needsGridRealloc = (props.n = Math.round(props.n)) !== Math.round(prevProps.n);
    let needsRainRealloc = (props.nRain = Math.round(props.nRain)) !== Math.round(prevProps.nRain);

    if (needsRainRealloc) {
      rainState.resize(props.nRain);
    }

    if (needsGridRealloc) {
      gridState.resize(Math.round(props.n));
      gridGeometry.resize(props.n);
    }

    let needsReinit = needsGridRealloc || props.seed !== prevProps.seed;

    if (needsReinit) {
      initialize([gridState.y0, gridState.y1, params.seed]);
    }
  });

  const gpu = require('./regl-cwise')(regl);
  const camera = require('./camera')(regl, {
    up: [0, 0, 1],
    right: [-1, 0, 0],
    front: [0, 1, 0],
    phi: Math.PI * 0.1,
    theta: Math.PI * 0.6 * 0,
    distance: 15,
  });

  const gridGeometry = require('./create-draw-geometry')(regl, params.n);
  const gridState = require('./grid')(gpu, params.n);
  const rainState = require('./rain')(gpu, params.nRain);

  const makeDrawGrid = require('./draw-grid');
  let drawGrid = makeDrawGrid(regl, params.n);
  const drawRain = require('./draw-rain')(regl);
  const initialize = require('./initialize')(gpu);
  const erode = require('./erode')(regl);

  initialize([gridState.y0, gridState.y1, params.seed]);

  const setScale = regl({uniforms: {scale: [10, 10, 5]}});

  regl.frame(({tick}) => {
    if (params.erosion) {
      erode(gridState, rainState, params);
    }

    setScale(() => {
      camera(() => {
        regl.clear({color: [0, 0, 0, 1], depth: 1});

        if (params.terrain) {
          drawGrid({
            positions: gridGeometry.positions,
            elements: gridGeometry.elements,
            nel: gridGeometry.nel,
            hf: gridState.y0,
            ambient: [0.0, 0.04, 0.08],
            lambertLights: [
              {color: [0.9, 0.75, 0.7], position: [80, 80, 100]},
              {color: [0.1, 0.23, 0.3], position: [-80, -80, 100]},
            ]
          });
        }

        if (params.rain) {
          drawRain({
            y: gridState.y0,
            r: rainState.r0,
            rv: rainState.rv0,
            coords: rainState.coords,
          });
        }
      });
    });
  });
}

