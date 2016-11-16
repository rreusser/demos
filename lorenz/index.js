const regl = require('regl')({
  extensions: ['OES_texture_float']
});

const n = 100000;
const gpu = require('./gpuwise')(regl, n);

var y1 = gpu.variable();
var y2 = gpu.variable(i => [
  2 + (Math.random() * 2 - 1) * 0.01,
  2 + (Math.random() * 2 - 1) * 0.01,
  28 + (Math.random() * 2 - 1) * 0.01,
  1.0
]);

var lorenz = gpu.operation({
  args: ['array', 'scalar'],
  body: `
    const float s = 10.0;
    const float b = 8.0 / 3.0;
    const float r = 28.0;

    vec4 compute (vec4 y, float dt) {
      // Predict:
      vec4 ytmp = y + 0.5 * dt * vec4(
        s * (y.y - y.x),
        y.x * (r - y.z) - y.y,
        y.x * y.y - b * y.z,
        0.0
      );

      // Correct:
      return y + dt * vec4(
        s * (ytmp.y - ytmp.x),
        ytmp.x * (r - ytmp.z) - ytmp.y,
        ytmp.x * ytmp.y - b * ytmp.z,
        0.0
      );
    }
  `,
});

function iterate (n) {
  for (let i = 0; i < n; i++) {
    // Update the attractor
    lorenz(y1, y2, 0.005);

    // Swap buffers:
    tmp = y1; y1 = y2; y2 = tmp;
  }
}

const camera = require('regl-camera')(regl, {
  center: [0, 28, 0],
  distance: 100,
});

const draw = require('./draw-points')(regl, gpu.width, gpu.height);

regl.frame(({tick}) => {
  iterate(2);
  regl.clear({color: [0, 0, 0, 1]});
  camera(() => draw({points: y1.texture}));
});

document.querySelector('canvas').addEventListener('wheel', function (e) {e.preventDefault();});
