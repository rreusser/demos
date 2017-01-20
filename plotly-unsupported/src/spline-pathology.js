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

var ascale = 1e-6;
var bscale = 1e6;
Plotly.plot(gd, {
  data: [
    {
      carpetid: 'c',
      a: [0, 1].map(a => a * ascale),
      b: [0, 1].map(b => b * bscale),
      y: [[0, 1], [0, 1]],
      x: [[0, 0], [1, 1]],
      type: 'carpet',
      aaxis: {
        tickprefix: 'a = ',
        minorgridcount: 9,
      },
      baxis: {
        tickprefix: 'b = ',
        minorgridcount: 9,
      },
      xaxis: 'x',
      yaxis: 'y',
    },
    /*{
      carpetid: 'c',
      type: 'scattercarpet',
      a: [0, 0.1, 0.25, 0.2, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1].map(a => a * ascale),
      b: [0, 0, 0.2, 0.4, 0.4, 0.4, 0.6, 0.6, 0.8, 0.8, 1].map(b => b * bscale),
      line: {shape: 'spline', smoothing: 1},
      xaxis: 'x',
      yaxis: 'y',
    },*/
    /*{
      type: 'scatter',
      x: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
      y: [0, 0, 0.2, 0.2, 0.4, 0.4, 0.6, 0.6, 0.8, 0.8, 1],
      line: {shape: 'spline', smoothing: 1},
      xaxis: 'x',
      yaxis: 'y',
    }*/
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
