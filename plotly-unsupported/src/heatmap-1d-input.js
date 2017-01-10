var h = require('h');
var Plotly = window.Plotly = require('plotly.js');

var gd = window.gd = h('div', {class: 'plot plot-left'});
document.body.appendChild(gd);

var data = [
  {
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
      'Morning', 'Afternoon', 'Evening',
      'Morning', 'Afternoon', 'Evening',
      'Morning', 'Afternoon', 'Evening',
      'Morning', 'Afternoon', 'Evening',
      'Morning', 'Afternoon', 'Evening',
    ],
    type: 'heatmap'
  }
];

Plotly.newPlot(gd, data);
