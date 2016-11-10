const newton = require('newton-raphson-method');
const regl = require('regl')({});
const fft = require('ndarray-fft');
const ndarray = require('ndarray');
const createPlayer = require('web-audio-player');
const blackmanHarris = require('scijs-window-functions/blackman-harris');

const n = 256;
var audio = createPlayer('danosongs.com-remember-the-stars-techno.mp3');
var fftAnalyser = audio.context.createAnalyser();
fftAnalyser.fftSize = n;
const nf = fftAnalyser.frequencyBinCount;


const win = [];
for (i = 0; i < nf; i++) {
  win[i] = blackmanHarris(i, nf);
}
const x = new Float32Array(nf);
const yr = new Float32Array(nf);
const yi = new Float32Array(nf);
const ndyr = ndarray(yr);
const ndyi = ndarray(yi);
const yfast = new Float32Array(nf / 2);
const yslow = new Float32Array(nf / 2);
const ydiff = new Float32Array(nf / 2);

for (i = 0; i < nf; i++) {
  x[i] = i / (nf - 1) * 2;
  yr[i] = Math.sin(x[i] * 5);
  yi[i] = 0;
}

const xbuf = regl.buffer({data: x});
const ybuf = regl.buffer({data: ydiff});

audio.on('load', () => {
  audio.play();
  audio.node.connect(fftAnalyser);
  audio.node.connect(audio.context.destination)

  const drawLines = regl({
    frag: `void main () {
      gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    }`,
    vert: `
      attribute float x, y;

      void main () {
        gl_Position = vec4(
          x * 2.0 - 1.0,
          y * 2.0 - 1.0,
          0.0,
          1.0
        );
      }
    `,
    attributes: {
      x: xbuf,
      y: ybuf
    },
    count: nf / 2,
    lineWidth: 2,
    primitive: 'line strip'
  });

  var ptime = 0;
  regl.frame(({time}) => {
    fftAnalyser.getFloatTimeDomainData(yr);

    for (i = 0; i < nf; i++) {
      yi[i] = 0;
      yr[i] *= win[i];
    }

    fft(1, ndyr, ndyi);

    for (i = 0; i < nf / 2; i++) {
      yr[i] = Math.sqrt(yr[i] * yr[i] + yi[i] * yi[i]) * 0.01;
      yi[i] = 0;
    }

    var dt = time - ptime;
    var decay = Math.exp(-dt / 0.15);
    for (i = 0; i < nf / 2; i++) {
      yfast[i] *= decay;
      yfast[i] += (1.0 - decay) * yr[i];
    }

    var decay = Math.exp(-dt / 4);
    for (i = 0; i < nf / 2; i++) {
      yslow[i] *= decay;
      yslow[i] += (1.0 - decay) * yr[i];
    }

    var min = Infinity;
    var max = -Infinity;
    for (i = 0; i < nf / 2; i++) {
      ydiff[i] = (Math.log(yfast[i]) - Math.log(yslow[i])) * 0.1;
      min = Math.min(min, ydiff[i]);
      max = Math.max(max, ydiff[i]);
    }

    for (i = 0; i < nf / 2; i++) {
      ydiff[i] = (ydiff[i] - min) / (max - min)
    }

    ybuf(ydiff);

    regl.clear({color: [0, 0, 0, 1]});
    drawLines();
    ptime = time;
  });


});
