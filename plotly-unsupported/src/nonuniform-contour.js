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
    z: [
      [1, 1.25, 1.5, 1.75],
      [2, 2.25, 2.5, 2.75],
      [3, 3.25, 3.5, 3.75]
    ],
    x: [0, 1, 2, 3],
    y: [4, 5, 6],
    type: 'contour'
  }]
});
