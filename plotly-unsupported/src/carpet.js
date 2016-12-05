var h = require('h');
var gd = h('div');
document.body.appendChild(gd);
var Plotly = require('plotly.js');

Plotly.plot(gd, [{
  a: [1, 2, 3],
  b: [2, 1, 3],
  y: [[1, 7, 4], [1, 2, 3], [3, 2, 1]],
  type: 'carpet',
}]);


