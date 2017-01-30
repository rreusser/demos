var h = require('h');
require('insert-css')(`
html, body {
  padding: 0;
  margin: 0;
}
`);
var Plotly = require('plotly.js');

var gd = window.gd = h('div');
document.body.appendChild(gd);

function f (z) {
  return Math.sqrt(z);
}

var y = [
  [1, 0.9, 1.1, 1.75],
  [2, 2.25, 2.5, 2.75],
  [3, 3.5, 3.9, 3.75]
];

Plotly.plot(gd, {
  data: [
    {
      carpetid: 'c',
      a: [0, 1, 2, 3],
      b: [4, 5, 6],
      y: y,
      //cheaterslope: 0.25,
      x: [
        [2, 3, 4, 5],
        [1.4, 2.75, 3.75, 5.1],
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
        start: 1.9,
        end: 4,
        size: 4,
      },
      line: {
        width: 2,
        //color: 'red'
      },
      colorscale: 'Viridis',
      z: y,
      a: [0, 1, 2, 3],
      b: [4, 5, 6],
    }
  ],
  layout: {
    margin: {t: 10, r: 10, b: 20, l: 20},
    height: window.innerHeight,
    width: window.innerWidth,
    dragmode: 'pan'
  },
  config: {
    scrollZoom: true
  }
});
