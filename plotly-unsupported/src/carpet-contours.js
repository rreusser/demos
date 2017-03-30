var h = require('h');
require('insert-css')(`
html, body {
  padding: 0;
  margin: 0;
}
`);
var Plotly = require('plotly.js');
var map2darray = require('plotly.js/src/traces/carpet/map_2d_array');

var gd = window.gd = h('div');
document.body.appendChild(gd);

function f (z) {
  return Math.sqrt(z);
}

var y = [
  [1, 1.4, 1.6, 1.75],
  [2, 2.25, 1.5, 2.75],
  [3, 3.5, 3.9, 3.75]
];

z = map2darray(null, y, y => y * y);
z[1][2] = 1

Plotly.plot(gd, {
  data: [
    {
      carpetid: 'c',
      a: [0, 1, 2, 3],
      b: [4, 5, 6],
      y: [
        [1, 1.4, 1.6, 1.75],
        [2, 2.25, 2.5, 2.75],
        [3, 3.5, 3.7, 3.75]
      ],
      //cheaterslope: 0.25,
      x: [
        [2, 3, 4, 5],
        [2.2, 3.1, 3.75, 5.1],
        [1.5, 2.5, 3.5, 4.5]
      ],
      type: 'carpet',
      aaxis: {
        tickprefix: 'a = ',
        smoothing: 0,
        minorgridcount: 9,
      },
      baxis: {
        tickprefix: 'b = ',
        smoothing: 0,
        minorgridcount: 9,
      },
      xaxis: 'x',
      yaxis: 'y',
    },
    {
      carpetid: 'c',
      type: 'contourcarpet',
      autocontour: false,
      contours: {
        start: 1,
        end: 14,
        size: 1.0,
      },
      line: {
        width: 2,
        smoothing: 0,
      },
      colorscale: 'Viridis',
      z: z,
      a: [0, 1, 2, 3],
      b: [4, 5, 6],
      xaxis: 'x',
      yaxis: 'y',
    },
    {
      carpetid: 'c2',
      a: [0, 1, 2, 3],
      b: [4, 5, 6],
      y: [
        [1, 1.4, 1.6, 1.75],
        [2, 2.25, 2.5, 2.75],
        [3, 3.5, 3.7, 3.75]
      ],
      //cheaterslope: 0.25,
      x: [
        [2, 3, 4, 5],
        [2.2, 3.1, 3.75, 5.1],
        [1.5, 2.5, 3.5, 4.5]
      ],
      type: 'carpet',
      aaxis: {
        tickprefix: 'a = ',
        smoothing: 1,
        minorgridcount: 9,
      },
      baxis: {
        tickprefix: 'b = ',
        smoothing: 1,
        minorgridcount: 9,
      },
      xaxis: 'x',
      yaxis: 'y2',
    },
    {
      carpetid: 'c2',
      type: 'contourcarpet',
      autocontour: false,
      contours: {
        start: 1,
        end: 14,
        size: 1,
      },
      line: {
        width: 2,
        //color: 'red'
      },
      colorscale: 'Viridis',
      z: z,
      a: [0, 1, 2, 3],
      b: [4, 5, 6],
      xaxis: 'x',
      yaxis: 'y2',
    }
  ],
  layout: {
    margin: {t: 10, r: 10, b: 20, l: 20},
    height: window.innerHeight,
    width: window.innerWidth,
    dragmode: 'pan',
    yaxis: {
      domain: [0, 0.48]
    },
    yaxis2: {
      domain: [0.52, 1]
    }
  },
  config: {
    scrollZoom: true
  }
});
