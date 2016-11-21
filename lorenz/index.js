const regl = require('regl')({
  extensions: ['OES_texture_float'],
  pixelRatio: 1.0
});

const n = 500000;
const ctx = require('./gpuwise')(regl, {n: n});

var y1 = ctx.variable();
var y2 = ctx.variable(i => [
  2 + (Math.random() * 2 - 1) * 0.1,
  2 + (Math.random() * 2 - 1) * 0.1,
  28 + (Math.random() * 2 - 1) * 0.1,
  1.0
]);

var lorenz = ctx.operation({
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

function iterate () {
  // Update the attractor
  lorenz(y1, y2, 0.01);

  // Swap buffers:
  tmp = y1; y1 = y2; y2 = tmp;
}

const camera = require('regl-camera')(regl, {
  center: [0, 28, 0],
  distance: 100,
  damping: 0
});

const drawPointsFromTexture = require('./draw-points')(regl);
const samplerCoords = ctx.getSamplerCoords();

regl.frame(({tick}) => {
  //if (tick % 10 !== 0) return;

  iterate();

  regl.clear({color: [0, 0, 0, 1]});

  camera(() => {
    drawPointsFromTexture({
      count: n,
      data: y1.getTexture(),
      sampleAt: samplerCoords,
      color: [0.3, 0.7, 1, 0.1]
    });
  });
});

document.querySelector('canvas').addEventListener('wheel', function (e) {e.preventDefault();});
