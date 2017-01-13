const linspace = require('ndarray-linspace');
const ndarray = require('ndarray');
const glslify = require('glslify');

const regl = require('regl')({
  extensions: ['oes_texture_float', 'oes_element_index_uint'],
  pixelRatio: 1,
  onDone: (err, regl) => {
    if (err) return require('fail-nicely')(err);
    document.querySelector('canvas').addEventListener('mousewheel', e => e.preventDefault());
    run(regl);
  }
});

function run(regl) {
  const camera = require('./camera')(regl, {
    distance: 20,
    center: [0, 5, 0]
  });

  const nx = 101;
  const ny = 101;
  const xy = ndarray(new Float32Array(nx * ny * 2), [nx, ny, 2]);
  const x = linspace(xy.pick(null, null, 0), -10 + 0.5, 10 + 0.5, {axis: 0});
  const y = linspace(xy.pick(null, null, 1), -10, 10, {axis: 1});

  const drawPoints = regl({
    vert: `
      precision mediump float;
      attribute vec2 z;
      uniform float t;
      varying float falloff;
      uniform vec2 a, b, c, d, ar;

      vec2 cmul (vec2 a, vec2 b) {
        return vec2(a.x * b.x - a.y * b.y, a.y * b.x + a.x * b.y);
      }

      vec2 cdiv (vec2 a, vec2 b) {
        float det = a.x * a.x + b.y * b.y;
        return vec2(a.x * b.x + a.y * b.y, a.y * b.x - a.x * b.y) / det;
      }

      void main () {
        //vec2 zt = z + vec2(t, 0.0);
        //vec2 p = cdiv(cmul(a, zt) + b, cmul(c, zt) + d);
        falloff = 1.0;
        //falloff = smoothstep(100.0, 1.0, dot(zt, zt));
        float x = z.x + t;
        float y = z.y;

        float r = (x - 1.0) * (x - 1.0) + y * y;
        float xx = (1.0 - x * x - y * y) / r;
        float yy = 2.0 * y / r;
        float det = (x + 1.0) * (x + 1.0) + y * y;
        vec2 p = vec2((x * x - 1.0 + y * y) / det, 2.0 * y / det);
        gl_Position = vec4(p * ar, 0, 1);
        gl_PointSize = 2.0;
      }
    `,
    frag: `
      precision mediump float;
      varying float falloff;
      void main () {
        gl_FragColor = vec4(vec3(1), falloff);
      }
    `,
    attributes: {z: xy.data},
    uniforms: {
      t: ctx => ctx.time % 1,
      ar: ctx => [ctx.framebufferHeight / ctx.framebufferWidth, 1],
      a: [1, 0],
      b: [5, 0],
      c: [1, 0],
      d: [-5, 0]
    },
    blend: {
      enable: true,
      func: {srcRGB: 'src alpha', srcAlpha: 1, dstRGB: 1, dstAlpha: 1},
      equation: {rgb: 'add', alpha: 'add'}
    },
    primitive: 'points',
    count: nx * ny
  });

  const loop = regl.frame(({tick}) => {
    //if (tick % 10 !== 1) return;
    try {
      regl.clear({
        color: [0, 0, 0, 1],
        depth: 1
      });

      drawPoints();
    } catch (err) {
      loop.cancel();
      throw err;
    }
  });
}
