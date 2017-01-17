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
    a: [4, 4, 4, 5, 5, 5, 6, 6, 6],
    b: [1, 2, 3, 1, 2, 3, 1, 2, 3],
    y: [2, 3, 4, 5.5, 6.8, 7.5, 8, 9, 10],
    cheaterslope: 1,
    type: 'carpet',
    aaxis: {
      tickprefix: 'a = ',
      ticksuffix: 'm',
      minorgridcount: 9,
      cheatertype: 'value',
      tickmode: 'array',
    },
    baxis: {
      tickprefix: 'b = ',
      ticksuffix: 'Pa',
      minorgridcount: 9,
      cheatertype: 'value',
      tickmode: 'array',
    },
    xaxis: 'x',
    yaxis: 'y',
  },
  /*{
    x: [-1, 0, 1],
    y: [2, 8, 3],
    xaxis: 'x',
    yaxis: 'y2',
  }*/
  ],
  layout: {
    margin: {t: 10, r: 10, b: 20, l: 20},
    height: window.innerHeight,
    width: window.innerWidth,
    /*yaxis: {
      domain: [0, 0.5]
    },
    yaxis2: {
      domain: [0.5, 1]
    },*/
    dragmode: 'pan'
  },
  config: {
    scrollZoom: true
  }
});
