var h = require('h');
var uniq = require('uniq');
require('insert-css')(`
html, body {
  padding: 0;
  margin: 0;
}
`);
var Plotly = require('plotly.js');
var gd = window.gd = h('div');
document.body.appendChild(gd);

var mock = window.mock = {
  data: [
    {
      carpetid: 'c1',
      type: 'carpet',
      a: [1, 2, 3],
      b: [1, 2, 3],
      y: [[1, 2.3, 3], [2.3, 3, 3.7], [3, 3.7, 5]],
      xaxis: 'x',
      yaxis: 'y',
      aaxis: {
        smoothing: 1,
        title: 'a',
      },
      baxis: {
        smoothing: 1,
        title: 'b',
      },
    },
    {
      carpetid: 'c2',
      type: 'carpet',
      a: [1, 2, 3],
      b: [1, 2, 3],
      y: [[1, 2.3, 3], [2.3, 3, 3.7], [3, 3.7, 5]],
      xaxis: 'x2',
      yaxis: 'y',
      aaxis: {
        smoothing: 0,
        title: 'a',
      },
      baxis: {
        smoothing: 0,
        title: 'b',
      },
    },
    {
      carpetid: 'c3',
      type: 'carpet',
      a: [1, 2, 3],
      b: [1, 2, 3],
      y: [[1, 1.7, 3], [1.7, 3, 4.3], [3, 4.3, 5]],
      xaxis: 'x',
      yaxis: 'y2',
      aaxis: {
        smoothing: 1,
        title: 'a',
      },
      baxis: {
        smoothing: 1,
        title: 'b',
      },
    },
    {
      carpetid: 'c4',
      type: 'carpet',
      a: [1, 2, 3],
      b: [1, 2, 3],
      y: [[1, 1.7, 3], [1.7, 3, 4.3], [3, 4.3, 5]],
      xaxis: 'x2',
      yaxis: 'y2',
      aaxis: {
        smoothing: 0,
        title: 'a',
      },
      baxis: {
        smoothing: 0,
        title: 'b',
      },
    },
    {
      carpetid: 'c1',
      type: 'contourcarpet',
      z: [[1, 2.3, 3], [2.3, 3, 3.7], [3, 3.7, 5]],
      opacity: 0.5,
      contours: {
        type: 'constraint',
        operation: '[]',
        value: [2.5, 3.5]
      },
      line: {
        smoothing: 1,
      },
      colorscale: [[0, 'red'], [1, 'red']]
    },
    {
      carpetid: 'c1',
      type: 'contourcarpet',
      z: [[1, 2.3, 3], [2.3, 3, 3.7], [3, 3.7, 5]],
      opacity: 0.5,
      contours: {
        type: 'constraint',
        operation: '][',
        value: [2.9, 3.1]
      },
      line: {
        smoothing: 1,
      },
      colorscale: [[0, 'gray'], [1, 'gray']]
    },
    {
      carpetid: 'c1',
      type: 'contourcarpet',
      z: [[0, 0.5, 1], [-0.5, 0, 0.5], [-1, -0.5, 0]],
      opacity: 0.5,
      contours: {
        type: 'constraint',
        operation: '<',
        value: 0.25,
      },
      line: {
        smoothing: 1,
      },
      colorscale: [[0, 'yellow'], [1, 'yellow']]
    },
    {
      carpetid: 'c1',
      type: 'contourcarpet',
      z: [[0, 0.5, 1], [-0.5, 0, 0.5], [-1, -0.5, 0]],
      opacity: 0.5,
      contours: {
        type: 'constraint',
        operation: '>',
        value: -0.25,
      },
      line: {
        smoothing: 1,
      },
      colorscale: [[0, 'blue'], [1, 'blue']]
    },
    {
      carpetid: 'c2',
      xaxis: 'x2',
      yaxis: 'y',
      type: 'contourcarpet',
      z: [[1, 2.3, 3], [2.3, 3, 3.7], [3, 3.7, 5]],
      opacity: 0.5,
      contours: {
        type: 'constraint',
        operation: '[]',
        value: [2.5, 3.5]
      },
      line: {
        smoothing: 1,
      },
      colorscale: [[0, 'red'], [1, 'red']]
    },
    {
      carpetid: 'c2',
      xaxis: 'x2',
      yaxis: 'y',
      type: 'contourcarpet',
      z: [[1, 2.3, 3], [2.3, 3, 3.7], [3, 3.7, 5]],
      opacity: 0.5,
      contours: {
        type: 'constraint',
        operation: '][',
        value: [2.9, 3.1]
      },
      line: {
        smoothing: 1,
      },
      colorscale: [[0, 'gray'], [1, 'gray']]
    },
    {
      carpetid: 'c2',
      xaxis: 'x2',
      yaxis: 'y',
      type: 'contourcarpet',
      z: [[0, 0.5, 1], [-0.5, 0, 0.5], [-1, -0.5, 0]],
      opacity: 0.5,
      contours: {
        type: 'constraint',
        operation: '<',
        value: 0.25,
      },
      line: {
        smoothing: 1,
      },
      colorscale: [[0, 'yellow'], [1, 'yellow']]
    },
    {
      carpetid: 'c2',
      xaxis: 'x2',
      yaxis: 'y',
      type: 'contourcarpet',
      z: [[0, 0.5, 1], [-0.5, 0, 0.5], [-1, -0.5, 0]],
      opacity: 0.5,
      contours: {
        type: 'constraint',
        operation: '>',
        value: -0.25,
      },
      line: {
        smoothing: 1,
      },
      colorscale: [[0, 'blue'], [1, 'blue']]
    },
    {
      carpetid: 'c3',
      xaxis: 'x',
      yaxis: 'y2',
      type: 'contourcarpet',
      z: [[1, 2.3, 3], [2.3, 3, 3.7], [3, 3.7, 5]],
      opacity: 0.5,
      contours: {
        type: 'constraint',
        operation: '[]',
        value: [2.5, 3.5]
      },
      line: {
        smoothing: 1,
      },
      colorscale: [[0, 'red'], [1, 'red']]
    },
    {
      carpetid: 'c3',
      xaxis: 'x',
      yaxis: 'y2',
      type: 'contourcarpet',
      z: [[1, 2.3, 3], [2.3, 3, 3.7], [3, 3.7, 5]],
      opacity: 0.5,
      contours: {
        type: 'constraint',
        operation: '][',
        value: [2.9, 3.1]
      },
      line: {
        smoothing: 1,
      },
      colorscale: [[0, 'gray'], [1, 'gray']]
    },
    {
      carpetid: 'c3',
      xaxis: 'x',
      yaxis: 'y2',
      type: 'contourcarpet',
      z: [[0, 0.5, 1], [-0.5, 0, 0.5], [-1, -0.5, 0]],
      opacity: 0.5,
      contours: {
        type: 'constraint',
        operation: '<',
        value: 0.25,
      },
      line: {
        smoothing: 1,
      },
      colorscale: [[0, 'yellow'], [1, 'yellow']]
    },
    {
      carpetid: 'c3',
      xaxis: 'x',
      yaxis: 'y2',
      type: 'contourcarpet',
      z: [[0, 0.5, 1], [-0.5, 0, 0.5], [-1, -0.5, 0]],
      opacity: 0.5,
      contours: {
        type: 'constraint',
        operation: '>',
        value: -0.25,
      },
      line: {
        smoothing: 1,
      },
      colorscale: [[0, 'blue'], [1, 'blue']]
    },
    {
      carpetid: 'c4',
      xaxis: 'x2',
      yaxis: 'y2',
      type: 'contourcarpet',
      z: [[1, 2.3, 3], [2.3, 3, 3.7], [3, 3.7, 5]],
      opacity: 0.5,
      contours: {
        type: 'constraint',
        operation: '[]',
        value: [2.5, 3.5]
      },
      line: {
        smoothing: 1,
      },
      colorscale: [[0, 'red'], [1, 'red']]
    },
    {
      carpetid: 'c4',
      xaxis: 'x2',
      yaxis: 'y2',
      type: 'contourcarpet',
      z: [[1, 2.3, 3], [2.3, 3, 3.7], [3, 3.7, 5]],
      opacity: 0.5,
      contours: {
        type: 'constraint',
        operation: '][',
        value: [2.9, 3.1]
      },
      line: {
        smoothing: 1,
      },
      colorscale: [[0, 'gray'], [1, 'gray']]
    },
    {
      carpetid: 'c4',
      xaxis: 'x2',
      yaxis: 'y2',
      type: 'contourcarpet',
      z: [[0, 0.5, 1], [-0.5, 0, 0.5], [-1, -0.5, 0]],
      opacity: 0.5,
      contours: {
        type: 'constraint',
        operation: '<',
        value: 0.25,
      },
      line: {
        smoothing: 1,
      },
      colorscale: [[0, 'yellow'], [1, 'yellow']]
    },
    {
      carpetid: 'c4',
      xaxis: 'x2',
      yaxis: 'y2',
      type: 'contourcarpet',
      z: [[0, 0.5, 1], [-0.5, 0, 0.5], [-1, -0.5, 0]],
      opacity: 0.5,
      contours: {
        type: 'constraint',
        operation: '>',
        value: -0.25,
      },
      line: {
        smoothing: 1,
      },
      colorscale: [[0, 'blue'], [1, 'blue']]
    },
  ],
  layout: {
    width: window.innerWidth,
    height: window.innerHeight,
    margin: {t: 0, r: 0, b: 0, l: 30},
    dragmode: 'pan',
    xaxis: {domain: [0, 0.49]},
    yaxis: {domain: [0, 0.49]},
    xaxis2: {domain: [0.51, 1]},
    yaxis2: {domain: [0.51, 1]},
  },
  config: {
    scrollZoom: true
  },
};

Plotly.plot(gd, mock);
