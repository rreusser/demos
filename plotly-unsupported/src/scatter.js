var h = require('h');
var gd = window.gd = h('div');
document.body.appendChild(gd);
var Plotly = window.Plotly = require('plotly.js');

Plotly.plot(gd, [{
  x: [1, 2, 3],
  y: [2, 1, 3]
}]);


