var h = require('h');
var gd = h('div');
document.body.appendChild(gd);
var Plotly = require('plotly.js');

Plotly.plot(gd, [{
  x: [1, 2, 3],
  y: [2, 1, 3]
}]);


