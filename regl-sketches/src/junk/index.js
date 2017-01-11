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
  };

  controls([
  ], params, (prevProps, props) => {
  });

  const gpu = require('./regl-cwise')(regl);
  const camera = require('./camera')(regl, {
    up: [0, 0, 1],
    right: [-1, 0, 0],
    front: [0, 1, 0],
    center: [0, 0, 2],
    phi: Math.PI * 0.2,
    theta: Math.PI * 1.0,
    distance: 25,
  });

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
        motionBlurFrames: 5,
        framerate: 60
      });

      capturer.start();
    }
  }

  function render () {
    regl.poll();
    //raf = requestAnimationFrame(render);

    if (params.erosion) {
      for (let i = 0; i < params.iterations; i++) {
        erode(gridState, rainState, params);
      }
    }

    regl.clear({color: [0, 0, 0, 1], depth: 1});

    camera(() => {
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
