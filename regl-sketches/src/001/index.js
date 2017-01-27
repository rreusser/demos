'use strict';

const glslify = require('glslify');
const simplex = new (require('simplex-noise'))();
const hsv = require('hsv-rgb');
const tap = require('tap-to-start');
const hasAudio = !window.location.search.match(/audio=false/);

require('regl')({
  pixelRatio: 1,
  onDone: (err, regl) => {
    if (err) return require('fail-nicely')(err);
    tap({
      foreground: '#fff',
      background: '#2a3235',
      accent: '#2a3235',
      skip: !hasAudio
    }, () => run(regl));
  }
});

function randomColor (a, b) {
  let h = ((simplex.noise2D(a, b) + 1) % 1) * 360;
  let col = hsv(h, 30, 100).map(i => i / 255);
  return col;
}

function run(regl) {
  let analyser;
  let scaleContribution = 1;
  if (hasAudio) {
    var audio = require('./audio')((err, src, json, audio, a) => {
      analyser = a;
      scaleContribution = 0;
    });
  }

  const camera = require('./camera')(regl, {
    distance: 5,
  });

  const lighting = require('./lighting')(regl, {
    lights: [
      {position: [100, 100, 100],  color: [0.6, 0.8, 1, 0.4], power: 1},
      {position: [100, 100, -100], color: [0.6, 1, 0.8, 0.4], power: 1},
      {position: [40, -100, -40],   color: [1, 0.8, 0.6, 0.4], power: 5},
    ],
    ambient: [1, 1, 1, 0.1]
  });

  let drawBlob = require('./blob')(regl);
  let drawBg = require('./bg')(regl);

  let t0 = Date.now();
  let t = 0;
  let scale = 0;
  let st = 0;
  let avg = 0;

  let scaleFunc = (t) => Math.pow(0.5 + 0.5 * Math.sin(t * Math.PI * 2), 20);

  regl.frame(() => {
    let t1 = Date.now();
    let dt = (Date.now() - t0) / 1000.0;
    t += dt;

    let sum = 0;
    if (analyser) {
      let w = analyser.frequencies();
      let cnt = 0;
      for (let i = w.length * 1 / 8; i < w.length * 1/4; i++) {
        cnt++;
        sum += w[i];
      }
      sum /= cnt;
      let decay = Math.exp(-dt / 5);
      avg = decay * avg + (1 - decay) * sum;
    }

    let level = sum - avg;

    scale = level * 0.01 + 1.0 * scaleFunc(t) * scaleContribution;
    st += dt * (0.3 + 5.0 * scale);
    t0 = t1;

    lighting.setColor(0, randomColor(0, st / 10));
    lighting.setColor(1, randomColor(8, st / 10));
    lighting.setColor(2, randomColor(20, st / 10));

    lighting(() => {
      camera(() => {
        drawBg({t: t});

        drawBlob({
          t: t,
          scale: 0.25 + scale * 0.15,
          scaledTime: st
        });
      });
    });
  });
}
