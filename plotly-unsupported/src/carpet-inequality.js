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
  [1, 1, 1, 1],
  [2, 2, 2, 2],
  [3, 3, 3, 3]
];

Plotly.plot(gd, {
data: [{
  a: [0, 1, 2, 3],
  b: [4, 5, 6],
  y: [
    [1, 1, 1, 1],
    [2, 2, 2, 2],
    [3, 3, 3, 3]
  ],
  cheaterslope: 0.25,
  type: 'carpet',
  aaxis: {tickprefix: 'a = ', minorgridcount: 9},
  baxis: {tickprefix: 'b = ', minorgridcount: 9}
}, {
  type: 'contourcarpet',
  z: [
    [1, 1, 1, 1],
    [2, 2, 2, 2],
    [3, 3, 3, 3]
  ],
  autocontour: false,
  contours: {
    constraint: {
      operation: '<=',
      value: 2.5
    }
  },
  colorscale: 'Viridis',
}],
  layout: {
    margin: {t: 10, r: 10, b: 20, l: 40},
    height: window.innerHeight,
    width: window.innerWidth,
    dragmode: 'pan',
  },
  config: {
    scrollZoom: true
  }
});
