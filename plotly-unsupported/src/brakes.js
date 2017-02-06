var h = require('h');
var uniq = require('uniq');
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

Plotly.d3.csv('./brake-transpose.csv', (err, rows) => {
  var data = {};
  rows.forEach(row => Object.keys(row).forEach(key => (data[key] = data[key] || []).push(row[key])));
  plot(data);
});

function plot (data) {
  window.data = data;
  Plotly.plot(gd, {
    data: [{
      type: 'carpet',
      a: data['brake.pad.width'],
      b: data['brake.pad.thickness'],
      y: data['brake.Cost.padCost'],
      cheaterslope: 1,
      aaxis: {tickprefix: 'width = ', ticksuffix: 'cm', tickformat: '.1f'},
      baxis: {tickprefix: 'thickness = ', ticksuffix: ' cm', tickformat: '.2f'}
    }, {
      type: 'contourcarpet',
      name: 'Life',
      z: data['brake.pad.life'],
      opacity: 0.4,
      contours: {
        constraint: {
          operation: '<',
          value: 36000
        },
      },
      colorscale: [[0, 'red'], [0, 'red']]
    }, {
      type: 'contourcarpet',
      name: 'Stop Distance',
      z: data['brake.vehicle.stopDistance'],
      opacity: 0.4,
      contours: {
        constraint: {
          operation: '<',
          value: 180
        }
      },
      colorscale: [[0, 'green'], [0, 'green']]
    }, {
      type: 'contourcarpet',
      name: 'Heating',
      z: data['brake.brakeGeom.Thermo.heat'],
      opacity: 0.4,
      contours: {
        constraint: {
          operation: '<',
          value: 53,
        },
      },
      colorscale: [[0, 'blue'], [0, 'blue']]
    }],
    layout: {
      dragmode: 'pan',
      width: window.innerWidth,
      height: window.innerHeight,
      yaxis: {
        tickprefix: '$',
        tickformat: '.2f'
      },
      margin: {t: 20, r: 20, b: 20, l: 40},
    },
    config: {
      scrollZoom: true
    }
  });
}
