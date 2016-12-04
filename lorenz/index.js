'use strict';

var canvas = document.createElement('canvas');
document.body.appendChild(canvas);

function setCanvasSize(el, width, height) {
  el.width = width;
  el.height = height;
  el.style.width = width ? width + 'px' : undefined;
  el.style.height = height ? height + 'px' : undefined;
}

setCanvasSize(canvas, screenWidth, screenHeight);
const fit = require('canvas-fit')(canvas);
window.addEventListener('resize', fit, false);
let screenWidth = canvas.width;
let screenHeight = canvas.height;

require('regl/dist/regl.min.js')({
  extensions: ['OES_texture_float'],
  pixelRatio: 1,
  canvas: canvas,
  onDone: (err, regl) => {
    if (err) {
      return require('fail-nicely')(err);
    }
    run(regl);
  }
});

function run (regl) {
  const glslify = require('glslify')
  const gpgpu = require('../regl-cwise')(regl);
  const length = require('gl-vec3/length');
  const invert = require('gl-mat4/invert');
  const h = require('h');
  const fs = require('fs');
  const hsv = require('hsv2rgb');
  const hex = require('rgb-hex');
  const css = require('insert-css');
  css(fs.readFileSync(__dirname + '/index.css', 'utf8'));
  css(fs.readFileSync(__dirname + '/node_modules/simple-color-picker/src/simple-color-picker.css', 'utf8'));
  const styleDiv = h('div#colorStyles');
  document.body.appendChild(styleDiv);

  var doCapture = false;
  var needsStop = false;
  var mbframes = 1;
  const CCapture = require('ccapture.js');
  var capturer;

  const captureBtn = h('button#capture', 'Capture', {class: 'fg-color btn bg-color'});
  captureBtn.addEventListener('click', () => {
    doCapture = true;
    mbframes = 1;
    capturer = new CCapture({
      format: 'jpg',
      verbose: false,
      framerate: 60,
      motionBlurFrames: mbframes,
    });

    capturer.start();

    const stopBtn = h('button#capture', 'Stop', {class: 'fg-color btn bg-color'});
    window.removeEventListener('resize', fit);
    var dims = captureDims.value.match(/^([0-9]*)\s*x\s*([0-9]*)$/);
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
    setScreenbuffer(screenWidth, screenHeight);

    stopBtn.addEventListener('click', () => {
      mbframes = 1;
      needsStop = true;
      fit();
      setScreenbuffer(canvas.width, canvas.height);
      window.addEventListener('resize', fit, false);
      captureField.removeChild(stopBtn);
      captureField.removeChild(captureDims);
    });
    captureField.replaceChild(stopBtn, captureBtn);
  });

  const attractors = {
    lorenz: attractor(`
      10.0 * (y - x),
      x * (28.0 - z) - y,
      x * y - 8.0 /  3.0 * z
    `),
    lorenzmod1: attractor(`
      -0.1 * x + y * y - z * z + 0.1 * 14.0,
      x * (y - 4.0 * z) + 0.08,
      z + x * (4.0 * y + z)
    `, {dt: 0.5, shift: 28, scale: 0.5}),
    lorenzmod2: attractor(`
      -0.9 * x + y * y - z * z + 0.9 * 9.9,
      x * (y - 5.0 * z) + 1.0,
      -z + x * (5.0 * y + z)
    `, {dt: 0.3, shift: 28, scale: 1, clip: 1000}),
    rossler: attractor(`
      28.0 - z - y,
      x + 0.1 * y,
      0.1 + (z - 28.0) * (x - 14.0)
    `, {dt: 4}),
    chua: attractor(`
        40.0 * (y - x),
        -12.0 * x - x * z + 28.0 * y,
        x * y - 3.0 * z
    `, {dt: 0.3, zscale: 1.5}),
    arneodo: attractor(`
      y,
      z,
      5.5 * x - 3.5 * y - z - x * x * x
    `, {dt: 2, shift: 28, clip: 1000, scale: 3}),
    chenlee: attractor(`
      5.0 * x - y * z,
      -10.0 * y + x * z,
      -0.38 * z + x * y / 3.0
    `, {shift: 28}),
    coullet: attractor(`
      y,
      z,
      0.8 * x - 1.1 * y - 0.45 * z - x * x * x
    `, {dt: 4, shift: 28, scale: 10, clip: 1000}),
    dadras: attractor(`
      y - 3.0 * x + 2.7 * y * z,
      1.7 * y - x * z + z,
      2.0 * x * y - 9.0 * z
    `, {dt: 1, shift: 28, scale: 2}),
    thomas: attractor(`
      -0.19 * x + sin(y),
      -0.19 * y + sin(z),
      -0.19 * z + sin(x)
    `, {dt: 8, shift: 28, scale: 5}),
    tsucs1: attractor(`
      40.0 * (y - x) + 0.5 * x * z,
      20.0 * y - x * z,
      0.833 * z + x * y - 0.65 * x * x
    `, {dt: 0.25, shift: 10, scale: 0.5, clip: 1000}),
    tsucs2: attractor(`
      40.0 * (y - x) + 0.16 * x * z,
      55.0 * x - x * z + 20.0 * y,
      1.833 * z + x * y - 0.65 * x * x
    `, {dt: 0.1, shift: 12, scale: 0.15}),
    aizawa: attractor(`
      (z - 0.7) * x - 3.5 * y,
      3.5 * x + (z - 0.7) * y,
      0.6 + 0.95 * z - (z * z * z / 3.0) - (x * x + y * y) * (1.0 + 0.25 * z) + 0.1 * z * (x * x * x)
    `, {dt: 1.5, shift: 20, scale: 15, clip: 1000}),
    nosehoover: attractor(`
      y,
      -x + y * z,
      1.5 - y * y
    `, {dt: 4, shift: 28, scale: 6}),
    yuwang: attractor(`
      10.0 * (y - x),
      40.0 * x - 2.0 * x * z,
      exp(x * y) - 2.5 * z
    `, {dt: 0.3, scale: 6.0, clip: 1000, zscale: 0.25, shift: -5}),
    fourwing: attractor(`
      0.2 * x + y * z,
      -0.01 * x - 0.4 * y - x * z,
      -z - x * y
    `, {dt: 4, shift: 28, scale: 10}),
    liuchen: attractor(`
      0.4 * x - y * z,
      -12.0 * y + x * z,
      -5.0 * z + x * y
    `, {dt: 2, shift: 28, scale: 2, clip: 1000}),
    genesiotesi: attractor(`
      y,
      z,
      -x - 1.1 * y - 0.44 * z + x * x
    `, {dt: 4, shift: 28, scale: 30, clip: 100}),
    newtonleipnik: attractor(`
      0.4 * x + y + 10.0 * y * z,
      -x - 0.4 * y + 5.0 * x * z,
      0.175 * z - 5.0 * x * y
    `, {dt: 0.05, shift: 28, scale: 0.5, clip: 1000}),
    luchen: attractor(`
      -4.0 * x + z * y,
      -10.0 * y + z * x,
      (10.0 * 4.0 * z) / 14.0 - y * x + 18.1
    `, {dt: 0.5, shift: 23, scale: 1.3}),
    dequanli: attractor(`
      40.0 * (y - x) + 0.16 * x * z,
      55.0 * x + 20.0 * y - x * z,
      1.833 * z + x * y - 0.65 * x * x
    `, {dt: 0.1, shift: 2, clip: 1000, scale: 0.2}),
    halvorsen: attractor(`
      -1.4 * x - 4.0 * (y + z) - y * y,
      -1.4 * y - 4.0 * (z + x) - z * z,
      -1.4 * z - 4.0 * (x + y) - x * x
    `, {dt: 0.5, shift: 28, clip: 1000, scale: 2}),
    rucklidge: attractor(`
      -2.0 * x + 6.7 * y - y * z,
      x,
      -z + y * y
    `, {dt: 4.0, shift: 10, clip: 1000, scale: 3}),
    hadley: attractor(`
      4.0 * z * y + z * x - x,
      z * y - 4.0 * z * x - y + 1.0,
      -y * y - x * x - 0.2 * z + 0.2 * 8.0
    `, {shift: 15, scale: 10}),
    wangsun: attractor(`
      x * 0.2 + y * z,
      -0.01 * x + -0.4 * y - x * z,
      -z - x * y
    `, {dt: 6.0, shift: 28, scale: 15}),
    sakarya: attractor(`
      -x + y + y * z,
      -x - y + 0.4 * x * z,
      z - 0.3 * x * y
    `, {dt: 1, shift: 22, scale: 1}),
    burkeshaw: attractor(`
      -10.0 * (x + y),
      -y - 10.0 * x * z,
      10.0 * x * y + 4.272
    `, {dt: 0.5, shift: 28, clip: 100, scale: 5}),
    bouali: attractor(`
      x * (4.0 - y) + 0.3 * z,
      -y * (1.0 - x * x),
      -x * (1.5 - z) - 0.05 * z
    `, {dt: 1.0, shift: 28, scale: 2, clip: 100, scale: 1}),
    qichen: attractor(`
      38.0 * (y - x) + y * z,
      80.0 * x + y - x * z,
      x * y - 8.0 / 3.0 * z
    `, {dt: 0.2, shift: -50, clip: 10000, scale: 0.5, zscale: 2}),
    finance: attractor(`
      y - 1.1 * x,
      (5.0 - 0.001) * y - x - y * z,
      -0.2 * z + y * y
    `, {dt: 5, shift: -12, scale: 10}),
    rayleighbenard: attractor(`
      -9.0 * x + 9.0 * y,
      12.0 * x - y - x * z,
      x * y - 0.5 * z
    `, {dt: 2, shift: 5, clip: 10000, scale: 2}),
  };

  const attractorLabels = {
    aizawa: 'Aizawa',
    arneodo: 'Arneodo',
    bouali: 'Bouali',
    burkeshaw: 'Burke-Shaw',
    chua: 'Chua',
    chenlee: 'Chen-Lee',
    coullet: 'Coullet',
    dadras: 'Dadras',
    finance: 'Finance',
    fourwing: 'Four-Wing',
    genesiotesi: 'Genesio-Tesi',
    hadley: 'Hadley',
    halvorsen: 'Halvorsen',
    dequanli: 'Dequan-Li',
    lorenz: 'Lorenz',
    lorenzmod1: 'Lorenz Mod 1',
    lorenzmod2: 'Lorenz Mod 2',
    liuchen: 'Liu-Chen',
    luchen: 'Lü-Chen',
    newtonleipnik: 'Newton-Leipnik',
    nosehoover: 'Nose-Hoover',
    qichen: 'Qi-Chen',
    thomas: 'Thomas',
    tsucs1: 'TSUCS1',
    tsucs2: 'TSUCS2',
    rayleighbenard: 'Rayleigh-Benard',
    rossler: 'Rössler',
    rucklidge: 'Rucklidge',
    sakarya: 'Sakarya',
    wangsun: 'Wang-Sun',
    yuwang: 'Yu-Wang',
  };

  // Set random colors and inject corresponding styles
  var fg, bg;
  let hb = 180;
  let hf = 100;
  let sat = 0.3;
  let bgIntensity = 0.1;
  var isInverted = true;
  const randomizeColors = () => {
    let cf, cb, lhf, lhb;
    if (isInverted) {
      lhf = (hf + 180) % 360;
      lhb = (hb + 180) % 360;
    } else {
      lhf = hf;
      lhb = hb;
    }
    cf = hsv(lhf, sat, 1.0);
    cb = hsv(lhb, 0.1, bgIntensity);
    if (isInverted) {
      cf = cf.map(i => 255 - i);
      cb = cb.map(i => 255 - i);
    }
    fg = cf.map(i => i / 255);
    bg = cb.map(i => i / 255);

    let htmlfg = hsv(lhf, Math.min(0.3, sat), 1.0);
    if (isInverted) {
      htmlfg = htmlfg.map(i => 255 - i);
    }

    let s = styleDiv.querySelector('style');
    if (s) styleDiv.removeChild(s);
    styleDiv.appendChild(h('style', {type: 'text/css'}, `
      .selector button, .fg-color { color: #${hex.apply(null, htmlfg)}; }
    `));

    if (isInverted) {
      document.body.classList.add('isInverted');
    } else {
      document.body.classList.remove('isInverted');
    }
  };
  randomizeColors();

  // Get selected attractor from the hash
  var selectedAttractor = /^#/.test(window.location.hash || '') ? window.location.hash.substr(1) : 'lorenz';

  // Create buttons for each attractor
  const btns = Object.keys(attractorLabels).map(name =>
    h('button', {'data-attractor': name, class: name === selectedAttractor ? 'selected' : ''}, attractorLabels[name])
  );

  // Append the buttons
  document.body.appendChild(h('div.selector', btns));

  // Attach an event listener to switch the attractor on click
  btns.forEach(btn =>
    btn.addEventListener('click', function () {
      btns.forEach(b => b === btn ?  b.classList.add('selected') : b.classList.remove('selected'));
      selectedAttractor = btn.getAttribute('data-attractor');
      window.location.hash = selectedAttractor;
      randomizeColors();
    })
  );

  // A slider to change the number of particles
  var numberRange = h('input', {type: 'range', min: 1, max: 100, value: 60});
  var numberOutput = h('span');
  var numberField = h('div.field.fg-color', [numberRange, numberOutput]);
  numberRange.addEventListener('input', setNumber);
  numberRange.addEventListener('mousemove', e => e.stopPropagation());

  function setNumber () {
    let min = parseInt(numberRange.getAttribute('min'));
    let max = parseInt(numberRange.getAttribute('max'));
    let interp = (parseInt(numberRange.value) - min) / (max - min);
    let number = Math.pow(10, 4.0 + interp * 3.0);
    let newside = Math.floor(Math.sqrt(number))
    if (newside === side) return;

    side = newside;
    shape[0] = shape[1] = side;
    n = shape[0] * shape[1];

    numberOutput.textContent = 'Particles: ' + n;

    if (args[0]) args[0].destroy();
    if (args[1]) args[1].destroy();
    args[0] = gpgpu.array(null, shape);
    args[1] = gpgpu.array((i, j) => {
      var vec;
      do {
        var vec = [Math.random(), Math.random(), Math.random()].map(i => i * 2 - 1);
      } while(length(vec) > 1);

      vec = vec.map(x => x * 0.3);
      vec[2] += 28;
      vec[3] = 1;

      return vec;
    }, shape);
    if (uv) uv.destroy();
    uv = args[0].samplerCoords();
  }

  var screenbufferProxy;

  function setScreenbuffer (w, h) {
    if (screenbufferProxy && screenbufferProxy.destroy) {
      screenbufferProxy.destroy();
    }
    canvas.style.width = w;
    canvas.style.height = h;

    screenbufferProxy = gpgpu.array(null, [w, h, 4]);
  }
  setScreenbuffer(screenWidth, screenHeight);

  window.addEventListener('resize', function () {
    screenWidth = canvas.width;
    screenHeight = canvas.height;
    setScreenbuffer(screenWidth, screenHeight);
  });

  var dtOutput = h('span');
  var dtRange = h('input', {type: 'range', min: 1, max: 100, value: 25});
  var dtField = h('div.field.fg-color', [dtRange, dtOutput]);
  dtRange.addEventListener('input', setDt);
  dtRange.addEventListener('mousemove', e => e.stopPropagation());

  function setDt () {
    let min = parseInt(dtRange.getAttribute('min'));
    let max = parseInt(dtRange.getAttribute('max'));
    let interp = (parseInt(dtRange.value) - min) / (max - min);
    dt0 = 0.0001 + 0.0399 * interp
    dtOutput.textContent = '∆t: ' + dt0.toFixed(4);
  }

  setDt();


  var hueOutput = h('span');
  var hueRange = h('input', {type: 'range', min: 0, max: 360, value: 100});
  var hueField = h('div.field.fg-color', [hueRange, hueOutput]);
  hueRange.addEventListener('input', setHue);
  hueRange.addEventListener('mousemove', e => e.stopPropagation());

  function setHue () {
    let min = parseInt(hueRange.getAttribute('min'));
    let max = parseInt(hueRange.getAttribute('max'));
    let interp = (parseInt(hueRange.value) - min) / (max - min);
    hf = 360 * interp;
    hb = (hf + 180) % 180;
    hueOutput.textContent = 'Hue: ' + hf.toFixed(0);
    randomizeColors();
  }

  setHue();


  var satOutput = h('span');
  var satRange = h('input', {type: 'range', min: 0, max: 100, value: 30});
  var satField = h('div.field.fg-color', [satRange, satOutput]);
  satRange.addEventListener('input', setSat);
  satRange.addEventListener('mousemove', e => e.stopPropagation());

  function setSat () {
    let min = parseInt(satRange.getAttribute('min'));
    let max = parseInt(satRange.getAttribute('max'));
    let interp = (parseInt(satRange.value) - min) / (max - min);
    sat = interp;
    satOutput.textContent = 'Saturation: ' + sat.toFixed(2);
    randomizeColors();
  }

  setSat();

  var exposureOutput = h('span');
  var exposureRange = h('input', {type: 'range', min: 0, max: 101, value: 20});
  var exposureField = h('div.field.fg-color', [exposureRange, exposureOutput]);
  exposureRange.addEventListener('input', setExposure);
  exposureRange.addEventListener('mousemove', e => e.stopPropagation());

  function setExposure () {
    let min = parseInt(exposureRange.getAttribute('min'));
    let max = parseInt(exposureRange.getAttribute('max'));
    let interp = (parseInt(exposureRange.value) - min) / (max - min);
    exposure = interp;
    exposureOutput.textContent = 'Exposure: ' + exposure.toFixed(2);
    randomizeColors();
  }

  setExposure();


  var bgOutput = h('span');
  var bgRange = h('input', {type: 'range', min: 0, max: 100, value: 7});
  var bgField = h('div.field.fg-color', [bgRange, bgOutput]);
  bgRange.addEventListener('input', setBackground);
  bgRange.addEventListener('mousemove', e => e.stopPropagation());

  function setBackground () {
    let min = parseInt(bgRange.getAttribute('min'));
    let max = parseInt(bgRange.getAttribute('max'));
    let interp = (parseInt(bgRange.value) - min) / (max - min);
    bgIntensity = interp;
    bgOutput.textContent = 'Background: ' + bgIntensity.toFixed(2);
    randomizeColors();
  }

  setBackground();

  //const ColorPicker = require('simple-color-picker');
  /*var pickerField = h('div.field');
  var picker = new ColorPicker({
    color: '#FF0000',
    background: '#454545',
    el: pickerField,
    width: 200,
    height: 200,
  })*/

  const invertBtn = h('button', 'Invert', {class: 'fg-color btn bg-color'});
  const invertField = h('div.field.fg-color', [invertBtn]);
  invertField.addEventListener('click', () => {
    isInverted = !isInverted;
    randomizeColors();
  });

  const captureDims = h('input', {type: 'text', value: '540x540', class: 'bg-color fg-color'});

  var captureField = h('div.field', [captureBtn, captureDims]);

  var fields = h('div.fields', [
    numberField,
    dtField,
    hueField,
    satField,
    exposureField,
    bgField,
    invertField,
    //pickerField,
    captureField
  ]);
  document.body.appendChild(fields);
  fields.addEventListener('mousedown', e => e.stopPropagation());
  fields.addEventListener('mouseup', e => e.stopPropagation());
  fields.addEventListener('mousemove', e => e.stopPropagation());
  fields.addEventListener('click', e => e.stopPropagation());

  var side = 600;
  const shape = [side, side, 4];
  var n = shape[0] * shape[1];
  const args = [null, null, 0.01];
  setNumber();
  var uv = args[0].samplerCoords();

  function attractor(op, opts) {
    opts = opts || {};
    opts.dt = opts.dt || 1.0;
    return gpgpu.map({
      args: ['array', 'scalar'],
      permute: [1, 0, 2],
      body: `
        vec3 deriv (float x, float y, float z) {
          return vec3(${op});
        }
        vec4 compute (vec4 y, float dt) {
          ${opts.shift ? `y.z -= ${opts.shift.toFixed(2)};` : ''}
          ${opts.scale ? `y.xyz *= ${(1 / opts.scale).toFixed(10)};` : ''}
          ${opts.zscale ? `y.z *= ${(1 / opts.zscale).toFixed(10)};` : ''}
          vec3 yh = y.xyz + ${(opts.dt * 0.5).toFixed(2)} * dt * deriv(y.x, y.y, y.z);
          y.xyz = y.xyz + ${opts.dt.toFixed(2)} * dt * deriv(yh.x, yh.y, yh.z);
          ${opts.zscale ? `y.z *= ${opts.zscale.toFixed(10)};` : ''}
          ${opts.scale ? `y.xyz *= ${opts.scale.toFixed(10)};` : ''}
          ${opts.clip ? `
          float r = length(y.xyz);
          if (r > ${opts.clip.toFixed(2)}) y.xyz /= r;
          ` : ''}
          ${opts.shift ? `y.z += ${opts.shift.toFixed(2)};` : ''}
          return y;
        }
      `,
    });
  }

  const camera = require('regl-camera')(regl, {
    center: [0, 28, 0],
    distance: 100,
    near: 5,
    far: 1000,
    damping: 0
  });

  const invView = [];
  const drawBg = regl({
    frag: glslify(`
      precision mediump float;
      #pragma glslify: camera = require('glsl-camera-ray')
      #pragma glslify: noise = require('glsl-noise/simplex/3d')
      uniform vec3 color;
      varying vec3 dir;
      #define OO2PI 0.15915494309189535
      #define PI 3.141592653589793238
      #define VFADE 0.1
      #define NOISEINTENSITY 0.05
      void main() {
        vec3 ndir = dir;
        float phi = atan(ndir.z, ndir.x);
        float y = dir.y / length(ndir);
        float mag = 1.0 - NOISEINTENSITY + NOISEINTENSITY * noise(ndir  / length(ndir) * 2.0);
        float vertFade = (1.0 - VFADE) + VFADE * y;
        gl_FragColor = vec4(color * vertFade * mag, 1.0);
      }
    `),
    vert: `
      precision mediump float;
      attribute vec2 xy;
      varying vec3 dir;
      uniform mat4 invView;
      uniform float aspect;
      void main() {
        dir = (invView * vec4(xy * vec2(aspect, 1.0), -1, 0)).xyz;
        gl_Position = vec4(xy, 0, 1);
      }
    `,
    attributes: {xy: [[-4, -4], [0, 4], [4, -4]]},
    uniforms: {
      color: regl.prop('color'),
      invView: context => invert(invView, context.view),
      aspect: context => context.viewportWidth / context.viewportHeight
    },
    framebuffer: regl.prop('dest'),
    depth: {enable: false},
    count: 3
  });

  const drawPointsFromTexture = regl({
    frag: `
      precision mediump float;
      uniform vec4 color;
      uniform float opac;
      void main() {
        vec4 c = color;
        c.w *= opac;
        gl_FragColor = c;
      }
    `,
    vert: `
      precision mediump float;
      attribute vec2 xy;
      uniform sampler2D points;
      uniform mat4 projection, view;
      void main() {
        vec4 pt = texture2D(points, xy).xzyw;
        gl_Position = projection * view * pt;
        gl_PointSize = 1.0;
      }
    `,
    attributes: {xy: regl.prop('sampleAt')},
    uniforms: {
      points: regl.prop('data'),
      color: regl.prop('color'),
      opac: regl.prop('opac')
    },
    blend: {
      enable: true,
      func: {
        srcRGB: 'src alpha',
        srcAlpha: 1,
        dstRGB: (context, props) => props.invert ? 'one minus src alpha' : 1,
        dstAlpha: 1
      },
      equation: {
        rgb: (context, props) => props.invert ? 'reverse subtract' : 'add',
        alpha: 'add'
      }
    },
    framebuffer: regl.prop('dest'),
    depth: {enable: false},
    primitive: 'points',
    count: regl.prop('count')
  });

  const transfer = gpgpu.map({
    args: ['array'],
    body: `vec4 compute (vec4 c) {
      //c.xyz = sqrt(c.xyz);
      return c;
    }`
  });

  let exposure = 0.2;
  let tick = 0;
  let dt0 = 0.01;
  function render () {
    regl.poll();
    tick++;
    raf = requestAnimationFrame(render);

    let dt = dt0 / mbframes;
    args[2] = dt;
    attractors[selectedAttractor](args);

    // Don't scale this with dt. otherwise it mess with camera rotation
    let changes = doCapture ? {
      dtheta: -0.01 / mbframes
    } : {};

    camera(changes, (context) => {
      drawBg({color: bg, dest: screenbufferProxy});

      fg[3] = 1;
      let opac = Math.max(0, Math.min(1, Math.atan(1 / length(context.eye)) * context.viewportHeight * 0.02 * exposure)) * (360000 / n) * 2.0;

      drawPointsFromTexture({
        count: n,
        data: args[0],
        sampleAt: uv,
        color: fg,
        opac: opac,
        invert: isInverted,
        dest: screenbufferProxy
      });

      transfer([null, screenbufferProxy]);
    });

    if (doCapture) {
      capturer.capture(canvas);

      if (needsStop) {
        capturer.stop();
        capturer.save();
        needsStop = false;
        doCapture = false;
      }
    }
  }

  var raf = render();

  document.querySelector('canvas').addEventListener('wheel', function (e) {e.preventDefault();});
}

(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-50197543-4', 'auto');
ga('send', 'pageview');
