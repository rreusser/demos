'use strict';

var h = require('h');
var injectBtn = h('button', 'Toggle 3rd step');
document.body.appendChild(injectBtn);
var gd = window.gd = h('div');
document.body.appendChild(gd);
var Plotly = require('plotly.js');
var Plots = require('plotly.js/src/plots/plots');

var frames = [
  {name: 'a', data: [{x: [1,2,3], y: [1,1,1]}]},
  {name: 'b', data: [{x: [1,2,3], y: [2,2,2]}]}
]

var sliders = [{
  "steps":[{
    "label":"a",
    "value":"a",
    "args":[["a"],{}],
    "method":"animate"
  },{
    "label":"b",
    "value":"b",
    "args":[["b"],{}],
    "method":"animate"
  }],
  "active":0
}];

Plotly.plot(gd, {
  data: [{
    x: frames[0].data[0].x,
    y: frames[0].data[0].y,
    line: {simplify: false},
  }],
  layout: {
    sliders: sliders.slice(),
    xaxis: {autorange: false},
    yaxis: {autorange: false},
  },
  frames: frames.slice()
});

injectBtn.addEventListener("click", function(evt) {
  var _frames = gd._transitionData._frames;
  var _slider = gd.layout.sliders[0];

  if (_frames.length === 2) {
    _frames.push({
      name: 'c',
      data: [{x: [1,2,3], y: [3,3,3]}]
    });

    _slider.steps.push({
      label: 'c',
      value: 'c',
      args: [['c']],
      method:'animate'
    });

  } else if (_frames.length === 3) {
    _frames.pop();
    _slider.steps.pop();

  }

  // Need to do this since we're manually pushing around frames
  Plots.recomputeFrameHash(gd);

  Plotly.redraw(gd);
})

function recomputeHash(transitionData, frames) {
 var hash = transitionData._frameHash = {};
  for(var i = 0; i < frames.length; i++) {
    var frame = frames[i];
    if(frame && frame.name) {
      hash[frame.name] = frame;
    }
  }
}
