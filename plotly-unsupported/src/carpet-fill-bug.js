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

var mock = {
  data: [{
    type: 'carpet',
    a: [
      0.1, 0.1, 0.1, 0.1, 0.1, 0.1,
      0.2, 0.2, 0.2, 0.2, 0.2, 0.2,
      0.3, 0.3, 0.3, 0.3, 0.3, 0.3,
      0.4, 0.4, 0.4, 0.4, 0.4, 0.4,
      0.5, 0.5, 0.5, 0.5, 0.5, 0.5,
    ],
    b: [
      1.01, 1.12, 1.24, 1.38, 1.56, 1.82,
      1.01, 1.12, 1.24, 1.38, 1.56, 1.82,
      1.01, 1.12, 1.24, 1.38, 1.56, 1.82,
      1.01, 1.12, 1.24, 1.38, 1.56, 1.82,
      1.01, 1.12, 1.24, 1.38, 1.56, 1.82,
    ],
    y: [
      4.0, 4.2, 4.4, 4.6, 4.8, 5.0,
      5.1, 5.3, 5.5, 5.7, 5.9, 6.1,
      6.2, 6.4, 6.6, 6.8, 7.0, 7.2,
      7.4, 7.6, 7.8, 8.0, 8.2, 8.4,
      8.8, 9.0, 9.2, 9.4, 9.6, 9.8
    ],
    cheaterslope: 2.0,
    aaxis: {
      title: 'width, cm',
      tickformat: '.1f'
    },
    baxis: {
      title: 'height, cm',
      tickformat: '.2f'
    }
  }, {
    type: 'contourcarpet',
    name: 'Power',
    z: [
      100, 110, 120, 140, 180, 260,
      200, 210, 220, 240, 280, 360,
      300, 310, 320, 340, 380, 460,
      400, 410, 420, 440, 480, 560,
      500, 510, 520, 540, 580, 660,
    ],
    opacity: 0.4,
    contours: {
      type: 'constraint',
      operation: '<',
      value: 5,
    },
    colorscale: [[0, 'red'], [1, 'red']]
  }],
  layout: {
    dragmode: 'pan',
    width: window.innerWidth,
    height: window.innerHeight,
    yaxis: {
      tickprefix: '€',
      tickformat: '.2f'
    },
    margin: {t: 20, r: 20, b: 20, l: 40},
  },
  config: {
    scrollZoom: true
  }
};

Plotly.plot(gd, mock);
