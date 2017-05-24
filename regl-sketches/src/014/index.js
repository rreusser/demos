const swap = (arr) => {let tmp = arr[0]; arr[0] = arr[1]; arr[1] = tmp;}
const vfill = require('ndarray-vector-fill');
const show = require('ndarray-show');
const ndarray = require('ndarray');
const glsl = require('glslify');
const particleLookup = require('./particle-lookup');
const regl = require('regl')({
  onDone: require('fail-nicely')(run),
  pixelRatio: 1.0,
  attributes: {
    antialias: false
  },
  extensions: ['oes_texture_float', 'webgl_draw_buffers']
});

function run (regl) {
  const ni = 20;
  const nj = 10;
  const x = window.x = new Array(2).fill(0).map(() =>
    regl.framebuffer({
      color: regl.texture({
        type: 'float',
        data: vfill(ndarray([], [ni, nj, 4]), (i, j) => {
          let th = i / ni * Math.PI * 2;
          let r = 1 - j / (nj - 1);
          return [
            r * Math.cos(th),
            r * Math.sin(th),
            0,
            0
          ]
        }),
      })
    })
  );

  const lookup = particleLookup(ni, nj);
  const integrate = require('./integrate')(regl, {
    l0: 1 / (nj - 1) * 1.0,
    k: 30,
    dt: 0.000005,
    g: 9.81 * 0.0005,
    repelStrength: 10,
    repelRadius: 0.1
  });
  const drawPoints = require('./draw-points')(regl, lookup, x[0]);
  const mouse = require('./mouse')();

  regl.frame(() => {
    regl.clear({color: [0, 0, 0, 1]});
    drawPoints({src: x[0]});

    for (i = 0; i < 100; i++) {
      integrate({
        src: x[0],
        dst: x[1],
        mouse: mouse
      })
      swap(x);
    }
  });
}

