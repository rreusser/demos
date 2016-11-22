const regl = require('regl')();
const vecFill = require('ndarray-vector-fill');
const linspace = require('ndarray-linspace');
const pool = require('ndarray-scratch');
const fill = require('ndarray-fill');
const gridConnectivity = require('ndarray-grid-connectivity');
const cellsFromGrid = require('./cells-from-grid');
const extractContour = require('simplicial-complex-contour');
const camera = require('./camera-2d')(regl, {center: [8, 7], zoom: 5, aspectRatio: 1/3});

// The data:
const xfunc = (a, b) => Math.sqrt(a * b);
const yfunc = (a, b) => Math.pow(b, 1.5) / a;
const zfunc = (a, b) => Math.pow(a, 1.2) / b;

// a/b sampling:
const abrange = [[4, 8], [10, 15]];
const abdims = [51, 51];

// Define the contours:
const zrange = [0, 1];
const zlevels = 21;

// Basis for a and b:
const a = linspace(abrange[0][0], abrange[0][1], abdims[0], {dtype: 'float32'});
const b = linspace(abrange[1][0], abrange[1][1], abdims[1], {dtype: 'float32'});

// Evaluate x and y:
const xy = vecFill(pool.zeros([abdims[0], abdims[1], 2], 'float32'), (i, j) =>
  [xfunc(a.get(i), b.get(j)), yfunc(a.get(i), b.get(j))]
);

// Evaluate z:
const z = fill(pool.zeros([abdims[0], abdims[1]], 'float32'), (i, j) => zfunc(a.get(i), b.get(j)));

const curves = [{
  vertices: xy.data,
  vertexStride: 4,
  elements: gridConnectivity(xy.pick(null, null, 0), {stride: [5, 5]}),
  color: [0, 0, 0, 1]
}];

linspace(zrange[0], zrange[1], zlevels).data.map((level) => {
  let curve = extractContour(cellsFromGrid(abdims), z.data, level);
  if (!curve.cells.length) return;
  curves.push({
    vertices: regl.buffer(curve.vertexWeights.map((w, i) => {
      let i1 = curve.vertexIds[i][0] * 2;
      let i2 = curve.vertexIds[i][1] * 2;
      return [
        w * xy.data[i1] + (1 - w) * xy.data[i2],
        w * xy.data[i1 + 1] + (1 - w) * xy.data[i2 + 1]
      ]
    })),
    vertexStride: 8,
    elements: curve.cells,
    color: [1, 0, 0, 1]
  });
})

const drawCurves = regl({
  frag: `
    precision mediump float;
    uniform vec4 color;
    void main () {
      gl_FragColor = color;
    }
  `,
  vert: `
    precision mediump float;
    uniform mat4 view, projection;
    attribute vec2 xy;
    void main () {
      gl_Position = projection * view * vec4(xy, 0, 1);
    }
  `,
  attributes: {
    xy: {
      buffer: regl.prop('vertices'),
      stride: regl.prop('vertexStride')
    }
  },
  uniforms: {
    color: regl.prop('color')
  },
  lineWidth: 2,
  primitive: 'lines',
  elements: regl.prop('elements'),
  depth: {enable: false}
});

regl.frame(({tick}) => {
  camera(({dirty}) => {
    if (!dirty) return;
    drawCurves(curves);
  });
});
