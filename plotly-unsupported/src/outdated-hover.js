'use strict'

const Plotly = require('plotly.js');
const h = require('h');
const gd = h('div');
document.body.appendChild(gd);

var frame = 0;
function animate () {
  frame++;
  var y = (frame % 5) / 4;
  Plotly.animate(gd, [{
    data: [{
      y: [y, y, y]
    }],
    traces: [0]
  }], {
    frame: {redraw: false}
  }).then(function () {
    setTimeout(animate, 300)
  });
}

Plotly.plot(gd, {
  data: [{
    x: [1, 2, 3],
    y: new Array(3).fill(Math.random()),
  }, {
    x: [1, 2, 3],
    y: new Array(3).fill(Math.random()),
  }, {
    x: [1, 2, 3],
    y: new Array(3).fill(Math.random()),
    yaxis: 'y2'
  }],
  layout: {
    //width: window.innerWidth,
    //height: window.innerHeight,
    yaxis: {
      range: [0, 1],
      domain: [0, 0.45],
      autorange: false
    },
    hovermode: 'closest',
    yaxis2: {
      range: [0, 1],
      domain: [0.55, 1],
      autorange: false
    }
  },
  config: {
    scrollZoom: true
  }
}).then(animate);

gd.on('plotly_click', function (data) {
  if (data.points && data.points.length) {
    console.log('curve', data.points[0].curveNumber, 'point',  data.points[0].pointNumber);
  } else {
    console.log('no click');
  }
});




