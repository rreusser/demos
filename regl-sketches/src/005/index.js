'use strict';

const extend = require('xtend/mutable');

require('regl')({
  //pixelRatio: 0.5,
  extensions: [
    'oes_texture_float',
    'oes_texture_float_linear',
    'oes_element_index_uint',
    'oes_standard_derivatives',
  ],
  onDone: (err, regl) => {
    if (err) return require('fail-nicely')(err);
    run(regl);
  }
});

function run(regl) {
  const canvas = document.querySelector('canvas');
  const controls = require('./controls');
  const CCapture = require('ccapture.js');

  const params = {
    n: 512,
    iterations: 5,
    nRain: 512,
    seed: 0,
    smoothing: 0.5,
    rain: 0.15,
    terrain: true,
    erosion: true,
    topo: 0.0,
    topoSpacing: 0.4,
    dt: 0.01,
    evaporationTime: 10.0,
    restartThreshold: 0.3,
    brushSize: 4.0,
    gravity: 0.1,
    maxVelocity: 0.1,
    friction: 2.0,
    carveRate: 0.5,
    carryingCapacity: 0.15,
    captureSize: '540 x 540',
  };

  controls([
    {type: 'range', label: 'n', min: 16, max: 1024, step: 1, initial: params.n},
    {type: 'range', label: 'nRain', min: 16, max: 1024, step: 1, initial: params.nRain},
    {type: 'range', label: 'seed', min: 0, max: 100, step: 0.01, initial: params.seed},
    {type: 'range', label: 'iterations', min: 1, max: 20, step: 1, initial: params.iterations},
    {type: 'range', label: 'smoothing', min: 0.0, max: 2.0, steps: 100, initial: params.smoothing},
    {type: 'range', label: 'dt', min: 0.001, max: 0.04, step: 0.001, initial: params.dt},
    {type: 'range', label: 'evaporationTime', min: 1.0, max: 100.0, step: 1.0, initial: params.evaporationTime},
    {type: 'range', label: 'restartThreshold', min: 0.0, max: 0.9, step: 0.01, initial: params.restartThreshold},
    {type: 'range', label: 'gravity', min: 0.01, max: 0.5, step: 0.01, initial: params.gravity},
    {type: 'range', label: 'maxVelocity', min: 0.01, max: 0.5, step: 0.01, initial: params.maxVelocity},
    {type: 'range', label: 'friction', min: 0.0, max: 10.0, step: 0.1, initial: params.friction},
    {type: 'range', label: 'carveRate', min: 0.01, max: 4.0, step: 0.01, initial: params.carveRate},
    {type: 'range', label: 'brushSize', min: 1.0, max: 16.0, step: 0.1, initial: params.brushSize},
    {type: 'range', label: 'carryingCapacity', min: 0.01, max: 1.0, step: 0.01, initial: params.carryingCapacity},
    {type: 'range', label: 'topo', min: 0.0, max: 1.0, initial: params.topo, step: 0.01},
    {type: 'range', label: 'topoSpacing', min: 0.0, max: 1.0, initial: params.topoSpacing, step: 0.01},
    {type: 'range', label: 'rain', min: 0.0, max: 1.0, step: 0.01, initial: params.rain},
    {type: 'checkbox', label: 'terrain', initial: params.terrain},
    {type: 'checkbox', label: 'erosion', initial: params.erosion},
    {type: 'button', label: 'start/stop capture', action: toggleCapture},
    {type: 'text', label: 'captureSize', initial: params.captureSize},
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
    phi: Math.PI * 0.2,
    theta: Math.PI * 1.1,
    distance: 18,
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

  let capturing = false;
  let needsStop = false;
  let capturer;
  function toggleCapture () {
    if (capturing) {
      needsStop = true;
    } else {
      var screenWidth, screenHeight;
      var dims = params.captureSize.match(/^([0-9]*)\s*x\s*([0-9]*)$/);

      if (dims) {
        screenWidth = parseInt(dims[1]);
        screenHeight = parseInt(dims[2]);
      } else {
        screenWidth = 540;
        screenHeight = 540;
      }

      canvas.width = screenWidth;
      canvas.height = screenHeight;
      canvas.style.width = screenWidth + 'px';
      canvas.style.height = screenHeight + 'px';

      capturing = true;
      capturer = new CCapture({
        verbose: true,
        format: 'jpg',
        framerate: 60
      });

      capturer.start();
    }
  }

  function render () {
    regl.poll();
    raf = requestAnimationFrame(render);

    if (params.erosion) {
      for (let i = 0; i < params.iterations; i++) {
        erode(gridState, rainState, params);
      }
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
            topo: params.topo,
            topoSpacing: params.topoSpacing,
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
            alpha: params.rain
          });
        }
      });
    });

    if (capturing) {
      capturer.capture(canvas);

      if (needsStop) {
        capturer.stop();
        capturer.save();
        needsStop = false;
        capturing = false;
      }
    }
  }

  var raf = render();
}

(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-50197543-4', 'auto');
ga('send', 'pageview');
