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

Plotly.plot(gd, {
  data: [{
    carpetid: 'c',
    a: [4, 4, 4, 4.5, 4.5, 4.5, 5, 5, 5, 6, 6, 6].map(a => a * 1e-6),
    b: [1, 2, 3, 1, 2, 3, 1, 2, 3, 1, 2, 3].map(b => b * 1e6),
    y: [2, 3.5, 4, 3, 4.5, 5, 5.5, 6.5, 7.5, 8, 8.5, 10],
    type: 'carpet',
    aaxis: {
      tickprefix: 'a = ',
      ticksuffix: 'm',
      smoothing: 0,
      minorgridcount: 9,
    },
    baxis: {
      tickprefix: 'b = ',
      ticksuffix: 'Pa',
      smoothing: 0,
      minorgridcount: 9,
    }
  }, {
    carpetid: 'c',
    type: 'contourcarpet',
    a: [4, 4, 4, 4.5, 4.5, 4.5, 5, 5, 5, 6, 6, 6].map(a => a * 1e-6),
    b: [1, 2, 3, 1, 2, 3, 1, 2, 3, 1, 2, 3].map(b => b * 1e6),
    z: [4, 5, 4, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  }],
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
