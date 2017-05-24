'use strict'

const Plotly = require('plotly.js');
const h = require('h');
const gd = h('div');
document.body.appendChild(gd);


var p = Plotly.plot(gd, [{
  x: [1, 2, 3],
  y: [0.0, 1.0, 0.7],
  fill: 'tozeroy',
  fillcolor: 'rgba(0, 0, 255, 0.5)'
}]).then(queue);

function randomColor () {
  return 'rgba(' + Math.floor(Math.random() * 256) + ',' + Math.floor(Math.random() * 256) + ',' + Math.floor(Math.random() * 256) + ', 0.5)';
}

function queue () {
  return Plotly.animate(gd, [{
    data: [{
      fillcolor: randomColor(),
      y: [Math.random(), Math.random(), Math.random()]
    }]
  }], {
    frame: {
      duration: 1000,
      redraw: false
    },
    transition: {
      duration: 1000
    }
  }).then(queue);
}
