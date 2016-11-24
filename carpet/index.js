const regl = require('regl')({
  //extensions: ['oes_element_index_uint']
});
const vecFill = require('ndarray-vector-fill');
const linspace = require('ndarray-linspace');
const pool = require('ndarray-scratch');
const show = require('ndarray-show');
const ndarray = require('ndarray');
const fill = require('ndarray-fill');
const gridConnectivity = require('ndarray-grid-connectivity');
const cellsFromGrid = require('./cells-from-grid');
const extractContour = require('simplicial-complex-contour');
const ops = require('ndarray-ops');
const continuify = require('./continuify-simplicial-contours');
const hsl2rgb = require('float-hsl2rgb');

// (Extra square root for dramatic visual effect:)
const ellipsoidSA = (a, b) => Math.sqrt(4 * Math.PI * Math.pow((Math.pow(a * b, 1.6) + Math.pow(a, 1.6) + Math.pow(b, 1.6)) / 3, 1 / 1.6));
const ellipseCircumf = (a, b) => {
  let h = Math.pow((a - b) / (a + b), 2);
  return Math.PI * (a + b) * (1 + 3 * h / (10 + Math.sqrt(4 - 3 * h)));
}

const wavyFunc = (a, b) => Math.pow(Math.sin(Math.cos(Math.pow(a - 0.5, 0.4) * 10) * Math.sin(Math.pow(b - 0.5, 0.4) * 10) * 10), 2);
//const wavyFunc1 = (a, b) => Math.sin(14 * (a + b));
//const wavyFunc2 = (a, b) => Math.sin(14 * (a - b));

// a/b sampling:
const abrange = [[0.5, 7], [0.5, 5]];
const abdims = [201, 151];
const abstride = [1, 1]

// Define the contours:
const zrange = [
  [0.3, 0.9],
  [0.6, 0.2],
];

const zcolors = [
  [0.15, 0.8, 0.1, 1],
  [0.8, 0.2, 0.1, 1],
];

const zlevels = [
  1,
  1
];

// Basis for a and b:
const a = linspace(abrange[0][0], abrange[0][1], abdims[0], {dtype: 'float32'});
const b = linspace(abrange[1][0], abrange[1][1], abdims[1], {dtype: 'float32'});

// Evaluate z:
const xy = ndarray([], [abdims[0], abdims[1], 2]);
const x = xy.pick(null, null, 0);
const y = xy.pick(null, null, 1);
const ab = vecFill(ndarray([], [abdims[0], abdims[1], 2]), (i, j) => [a.get(i), b.get(j)]);
const z = fill(ndarray([], [abdims[0], abdims[1]]), (i, j) => ellipsoidSA(a.get(i), b.get(j)));
const data = [
  fill(ndarray([], abdims), (i, j) => wavyFunc(a.get(i), b.get(j))),
  //fill(ndarray([], abdims), (i, j) => wavyFunc2(a.get(i), b.get(j))),
];

ops.assign(y, z);
fill(x, (i, j) => i - j);
ops.mulseq(x, (ops.sup(y) - ops.inf(y)) / (ops.sup(x) - ops.inf(x)));


const bounds = [[ops.inf(x), ops.sup(x)], [ops.inf(y), ops.sup(y)]];
const viewportRange = [0.5 * (bounds[0][1] - bounds[0][0]), 0.5 * (bounds[1][1] - bounds[1][0])];
const viewportCenter = [0.5 * (bounds[0][1] + bounds[0][0]), 0.5 * (bounds[1][1] + bounds[1][0])];

const curves = [{
  vertices: xy.data,
  vertexStride: 4,
  primitive: 'lines',
  elements: gridConnectivity(x, {stride: abstride}),
  color: [0, 0, 0, 0.15]
}];

data.map(function (datum, i) {
  linspace(zrange[i][0], zrange[i][1], zlevels[i]).data.map((level, k) => {
    let curve = extractContour(cellsFromGrid(abdims, datum.data, xy.data), datum.data, level);
    if (!curve.cells.length) return;

    continuify(curve, abdims[0] * abdims[1]).forEach(function (splitCurve, i) {
      curves.push({
        vertices: regl.buffer(splitCurve.vertexWeights.map((w, j) => {
          let i1 = splitCurve.vertexIds[j][0] * 2;
          let i2 = splitCurve.vertexIds[j][1] * 2;
          return [
            w * xy.data[i1] + (1 - w) * xy.data[i2],
            w * xy.data[i1 + 1] + (1 - w) * xy.data[i2 + 1]
          ]
        })),
        vertexStride: 8,
        elements: splitCurve.cells,
        primitive: 'lines',
        color: hsl2rgb([((90 + k * 180 + i * 2) / 360) % 1, 0.9, 0.4]).concat(1),
      });
    });
  })
});

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
  lineWidth: Math.min(Math.max(regl.limits.lineWidthDims[0], 2), regl.limits.lineWidthDims[1]),
  primitive: regl.prop('primitive'),
  elements: regl.prop('elements'),
  depth: {enable: false}
});

window.regl = regl;

const camera = require('./camera-2d')(regl, {
  center: viewportCenter,
  zoom: viewportRange[0] * 1.05,
  aspectRatio: viewportRange[0] / viewportRange[1] * window.innerHeight / window.innerWidth
});

regl.frame(({tick}) => {
  camera(({dirty}) => {
    if (!dirty && tick % 30 !== 1) return;
    drawCurves(curves);
  });
});
