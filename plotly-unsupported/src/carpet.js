var h = require('h');
var gd = window.gd = h('div.plot');
require('insert-css')(require('fs').readFileSync(__dirname + '/index.css', 'utf8'));
document.body.appendChild(gd);
var Plotly = require('plotly.js');

Plotly.plot(gd, [{
  a: [1, 2, 3],
  b: [2, 1, 3],
  y: [[1, 2, 3], [2, 3.2, 4.4], [3.2, 4.5, 6.2]],
  cheaterslope: 0.5,
  type: 'carpet',
}], {
  xaxis: {
    showgrid: false,
    showline: false,
    zeroline: false,
    showticklabels: false,
    range: [-2, 3]
  },
  yaxis: {
    range: [0, 7]
  },
  margin: {t: 20, r: 20, b: 20, l: 40},
  dragmode: 'pan'
}, {scrollZoom: true});


