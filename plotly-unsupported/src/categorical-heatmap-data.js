require('insert-css')(require('fs').readFileSync(__dirname + '/index.css', 'utf8'));
var h = require('h');
var Plotly = require('plotly.js');
var gd = h('div', {class: 'plot'});
document.body.appendChild(gd);

Plotly.plot(gd, {
  data: [{
    z: [
      1, 20, 30, 50, 1,
      20, 1, 60, 80, 30,
      30, 60, 1, -10, 20
    ],
    x: [
      12, 'Tuesday', 'Wednesday', 'Thursday', 'Friday',
      'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday',
      'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday',
    ],
    y: [
      3, 1, 2,
      3, 1, 2,
      3, 1, 2,
      3, 1, 2,
      3, 1, 2,
    ],
    type: 'heatmap'
  }]
});
