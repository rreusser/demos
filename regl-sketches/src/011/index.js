'use strict';

const glslify = require('glslify');
const simplex = new (require('simplex-noise'))();
const hsv = require('hsv-rgb');
const tap = require('tap-to-start');
const hasAudio = !window.location.search.match(/audio=false/);

let matcaps = [
  '00019.png',
  '00029.png',
  '00045.png',
  '00047.png',
  '00042.png',
  '00034.png',
  '00046.png',
  '00038.png',
  '00033.png',
  '00032.png',
  '00030.png',
  '00031.png',
  '00028.png',
  '00026.png',
  '00025.png',
  '00024.png',
  '00023.png',
  '00014.png',
  '00013.png',
  '00007.png',
  '00006.png',
  '00005.png',
  '00003.png',
  '00001.png',
];

let manifest = matcaps.reduce((a, b) => {
  a[b] = {
    type: 'image',
    src: '../common/textures/' + b,
    parser: data => {
      return data;
    }
  }
  return a;
}, {});

require('regl')({
  pixelRatio: 1,
  onDone: (err, regl) => {
    if (err) return require('fail-nicely')(err);
    tap({
      foreground: '#fff',
      background: '#2a3235',
      accent: '#2a3235',
      skip: !hasAudio
    }, () => {
      require('resl')({
        manifest: manifest,
        onDone: assets => {
          run(regl, assets)
        }
      });
    })
  }
});

function randomColor (a, b) {
  let h = ((simplex.noise2D(a, b) + 1) % 1) * 360;
  let col = hsv(h, 30, 100).map(i => i / 255);
  return col;
}

function run(regl, assets) {
  let textures = [
    regl.texture({data: assets[matcaps[0]], flipY: true}),
    regl.texture({data: assets[matcaps[Math.floor(Math.random() * matcaps.length)]], flipY: true}),
  ]

  let occlusionFBO = regl.framebuffer({
    color: regl.texture({
      width: Math.round(window.innerWidth / 8),
      height: Math.round(window.innerHeight / 8),
      mag: 'linear'
    }),
  });

  let rayFBO = regl.framebuffer({
    color: regl.texture({
      width: Math.round(window.innerWidth / 8),
      height: Math.round(window.innerHeight / 8),
      mag: 'linear',
    }),
    depth: false,
  });

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

  let drawBlob = require('./blob')(regl);
  let drawOcclusion = require('./draw-occlusion')(regl);
  let drawRays = require('./draw-rays')(regl);
  let drawBg = require('./bg')(regl);
  let transferRays = require('./transfer-rays')(regl);

  let t0 = Date.now();
  let t = 0;
  let scale = 0;
  let st = 0;
  let avg = 0;

  let scaleFunc = (t) => Math.pow(0.5 + 0.5 * Math.sin(t * Math.PI * 2), 20);

  var tswitch = Date.now();
  var transitionDuration = 2000;
  var tween = 1.0;
  var idx = 1;
  function nextTex () {
    tswitch = Date.now();
    tween = 0.0;
    idx = Math.floor(Math.random() * matcaps.length);
    let tmp = textures[0];
    textures[0] = textures[1];
    textures[1] = tmp;
    textures[1]({data: assets[matcaps[idx]], flipY: true});
  }

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

    var tweentime = Date.now() - tswitch;

    if (tweentime > 8000 && scale > 0.5) {
      nextTex();
    }

    var rays = true;

    camera({dtheta: 0.005}, () => {
      drawBg({t: t});

      if (rays) {
        occlusionFBO.use(() => {
          regl.clear({color: [0, 0, 0, 1], depth: 1});
          drawOcclusion({
            t: t,
            scale: 0.25 + scale * 0.15,
            scaledTime: st,
          });
        });
      }

      drawBlob({
        t: t,
        scale: 0.25 + scale * 0.15,
        scaledTime: st,
        texture0: textures[0],
        texture1: textures[1],
        tween: Math.max(0, Math.min(1, tweentime / transitionDuration))
      });

      if (rays) {
        rayFBO.use(() => {
          regl.clear({color: [0, 0, 0, 1]});
          drawRays({src: occlusionFBO});
        });

        transferRays({src: rayFBO});
      }
    });
  });
}
