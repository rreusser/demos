var Plotly = require('plotly.js');
var odeRk4 = require('ode-rk4');
var transpose = require('transpose');
var iota = require('iota-array');

var lorenz = odeRk4([0, 20, 20], function (dydt, y) {
  dydt[0] = 10 * (y[1] - y[0]);
  dydt[1] = y[0] * (28 - y[2]) - y[1];
  dydt[2] = y[0] * y[1] - 8 / 3 * y[2];
}, 0, 0.01);
var idx = iota(2000);
var frameWindow = 500;
var frameStep = iota(idx.length / 10).map(i => i * 10);
var data = transpose(idx.map(() => lorenz.step().y.slice()));
var gd = require('h')('div.plot');
document.body.appendChild(gd);

Plotly.plot(gd, {
  data: [{
    y: data[0],
    x: data[1],
    z: data[2],
    mode: 'lines',
    type: 'scatter3d',
    transforms: [{
      type: 'filter',
      target: idx,
      operation: '[]',
      value: [0, 1]
    }]
  }],
  layout: {
    width: window.innerWidth,
    height: window.innerHeight,
    scene: {
      xaxis: {range: [-30, 30]},
      yaxis: {range: [-20, 20]},
      zaxis: {range: [0, 50]}
    },
    sliders: [{
      currentvalue: {prefix: 't = '},
      transition: {duration: 0},
      pad: {l: 130, t: 25},
      steps: frameStep.map(i => ({
        method: 'animate',
        args: [[(i * lorenz.dt).toFixed(2)], {
          mode: 'immediate', frame: {duration: 0, redraw: false}
        }],
        label: (i * lorenz.dt).toFixed(2)
      }))
    }],
    updatemenus: [{
      type: 'buttons',
      showactive: false,
      direction: 'right',
      x: 0,
      y: 0,
      pad: {t: 55},
      xanchor: 'left',
      buttons: [{
        label: 'Play',
        method: 'animate',
        args: [null, {frame: {duration: 0, redraw: false}, mode: 'immediate', fromcurrent: true}]
      }, {
        label: 'Pause',
        method: 'animate',
        args: [[null], {frame: {duration: 0, redraw: false}, mode: 'immediate'}]
      }]
    }]
  },
  frames: frameStep.map(i => ({
    name: (i * lorenz.dt).toFixed(2),
    data: [{'transforms[0].value': [i + 1 - frameWindow, i + 1]}]
  }))
});
