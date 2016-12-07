'use strict';

var h = require('h');
var injectBtn = h('button', 'Toggle 3rd step');
document.body.appendChild(injectBtn);
var gd = window.gd = h('div');
document.body.appendChild(gd);
var Plotly = require('plotly.js');

var frames = [
  {name: 1990, data: [{x: [1,2,3], y: [1,1,1]}]},
  {name: 1991, data: [{x: [1,2,3], y: [2,2,2]}]}
]

Plotly.plot(gd, {
  data: [{
    x: frames[0].data[0].x,
    y: frames[0].data[0].y,
    line: {simplify: false},
  }],
  layout: {
    sliders: [{
      steps:[{
        label: 1990,
        value: 1990,
        args: [[1990]],
        method: "animate"
      }, {
        label: "\"1991\"",
        value: "1991",
        args: [["1991"]],
        method: "animate"
      }]
    }],
    updatemenus: [{
      type: "buttons",
      buttons:[{
        label: 1990,
        value: 1990,
        args: [[1990]],
        method: "animate"
      }, {
        label: "\"1991\"",
        value: "1991",
        args: [["1991"]],
        method: "animate"
      }]
    }],
    xaxis: {autorange: false},
    yaxis: {autorange: false},
  },
  frames: frames
});
