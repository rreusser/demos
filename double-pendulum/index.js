'use strict';

var Bounds = require('./lib/bounds');
var Plot = require('./lib/plot');
var rk4 = require('ode-rk4');
var controlPanel = require('control-panel');
var extend = require('util-extend');
var d3 = require('d3');
var Animation = require('./lib/animation');
var qs = require('qs');
var presets = require('./lib/presets');
var ResetTimer = require('./lib/reset-timer');
var css = require('insert-css');
var fs = require('fs');

css(fs.readFileSync(__dirname + '/index.css', 'utf8'));

var cproot = document.createElement('div');
cproot.id = 'control-panel-root';
cproot.classList.add('control-panel-root');
cproot.classList.add('is-hover');
document.body.appendChild(cproot);

var plot = document.createElement('canvas');
plot.id = 'plot';
document.body.appendChild(plot);

var bounds = new Bounds({
  xmin: -1.01,
  xmax: 1.01,
  ymin: -1.01,
  ymax: 1.01
});

var params = {
  gravity: 1,
  length: 0.5,
  mass: 1,
  opacity: 0.5,
  pendulum: true,
  ptheta1: 0,
  ptheta2: 0,
  steps: 7,
  theta1: 2.21796441343439,
  theta2: 1.31946891450771
};

function loadParams () {
  try {
    params = extend(params, qs.parse(window.location.hash.replace(/^#/,'')));
    for (var key in params) {
      if (key !== 'pendulum') {
        params[key] = Number(params[key]);
      } else {
        params[key] = String(params[key]) === 'true' ? true : false;
      }
    }
  } catch (e) {}
}

loadParams();

var reinitializeParams = ['length', 'gravity', 'mass', 'theta1', 'theta2', 'ptheta1', 'ptheta2'];
var paused = null;
var animation = new Animation();

var controlPanelRoot = document.getElementById('control-panel-root');

var panel = controlPanel([
  {type: 'select', label: 'preset', options: ['Select preset:'].concat(Object.keys(presets))},
  {type: 'button', label: 'restart', action: restart},
  {type: 'range', label: 'length', min: 0.1, max: 0.5, initial: params.length, steps: 400},
  {type: 'range', label: 'gravity', min: 0, max: 2, initial: params.gravity, steps: 200},
  {type: 'range', label: 'mass', min: 0, max: 20, initial: params.mass, steps: 200},
  {type: 'range', label: 'theta1', min: -Math.PI, max: Math.PI, initial: params.theta1, steps: 1000},
  {type: 'range', label: 'theta2', min: -Math.PI, max: Math.PI, initial: params.theta2, steps: 1000},
  {type: 'range', label: 'ptheta1', min: -1.0, max: 1.0, initial: params.ptheta1, steps: 200},
  {type: 'range', label: 'ptheta2', min: -1.0, max: 1.0, initial: params.ptheta2, steps: 200},
  {type: 'range', label: 'opacity', min: 0, max: 1, initial: params.opacity, steps: 100},
  {type: 'range', label: 'steps', min: 1, max: 2000, initial: params.steps, steps: 1999},
  {type: 'checkbox', label: 'pendulum', initial: params.pendulum},
], {theme: 'dark', position: 'top-left', root: controlPanelRoot});

panel.on('input', function (data, label) {
  setOpacity(data.opacity);
  extend(params, data);

  if (label === 'preset') {
    extend(params, presets[data.preset]);
    panel.set(params);
    reinitialize();
    clear();
  } else {
    panel.set({preset: 'Select preset:'});
  }

  svg.style('display', (data.pendulum || paused) ? 'block' : 'none');

  window.location.hash = qs.stringify(params);

  if (reinitializeParams.indexOf(label) !== -1) {
    reinitialize();
    clear();
  }

  if (paused) {
    draw();
  }
}).on('start', function () {
  svg.style('display', 'block');
  paused = animation.isRunning;
  if (paused) {
    animation.stop();
  }
}).on('end', function () {
  if (paused) {
    animation.start();
    svg.style('display', params.pendulum ? 'block' : 'none');
  }
  paused = null;
});

function restart () {
  reinitialize();
  clear();
}

var svg = d3.select('body').append('svg');
var pendulumPath;
var p =  new Plot('plot', function (w, h) {
  bounds.resize(w, h);
  svg.attr('width', w / window.devicePixelRatio)
    .attr('height', h / window.devicePixelRatio)
    .style('display', params.pendulum ? 'block' : 'none');
  svg.append('path')
    .attr('id', 'pendulum')
    .style('stroke', 'rgba(200,200,200,0.7)')
    .style('stroke-width', 4)
    .style('fill', 'none');
});
var y = [params.theta1, params.theta2, params.ptheta1, params.ptheta2];

var pendulum = function (dydt, y, t) {
  var l2 = params.length * params.length;
  var k1 = 6 / params.mass / l2;
  var k2 = -0.5 * params.mass * l2;
  var th1 = y[0];
  var th2 = y[1];
  var p1 = y[2];
  var p2 = y[3];
  var c12 = Math.cos(th1 - th2);
  var s12 = Math.sin(th1 - th2);
  var denom = (16 - 9 * c12 * c12) / k1;
  dydt[0] = (2 * p1 - 3 * c12 * p2) / denom;
  dydt[1] = (8 * p2 - 3 * c12 * p1) / denom;
  var term = dydt[0] * dydt[1] * s12;
  dydt[2] = k2 * (term + 3 * params.gravity / params.length * Math.sin(th1));
  dydt[3] = k2 * (-term + params.gravity / params.length * Math.sin(th2));
};

var ode = rk4(y, pendulum, 0, 0.005);

var strokeStyle;
function setOpacity (value) {
  strokeStyle = 'rgba(100,180,255,' + value + ')';
}

function coords (y) {
  var x1 = params.length * Math.sin(y[0]);
  var y1 = params.length * Math.cos(y[0]);
  var x2 = x1 + params.length * Math.sin(y[1]);
  var y2 = y1 + params.length * Math.cos(y[1]);
  return [
    [bounds.x(0), bounds.y(0)],
    [bounds.x(x1), bounds.y(y1)],
    [bounds.x(x2), bounds.y(y2)]
  ];
}

function clear () {
  p.ctx.clearRect(0, 0, p.canvas.width, p.canvas.height);
}

function reinitialize () {
  pendulumPath = d3.line()
    .x(function(d) {return d[0] / 2})
    .y(function(d) {return d[1] / 2});

  y[0] = params.theta1;
  y[1] = params.theta2;
  y[2] = params.ptheta1;
  y[3] = params.ptheta2;
  setOpacity(params.opacity);
}

animation.on('frame', draw);

function draw () {
  var ctx = p.ctx;
  ctx.globalCompositeOperation = 'screen';
  ctx.strokeStyle = strokeStyle;
  ctx.beginPath();
  var p1 = coords(y);
  ctx.moveTo(p1[2][0], p1[2][1]);
  for (var i = 0; i < params.steps; i++) {
    if (animation.isRunning) ode.step();
    p1 = coords(y);
    ctx.lineTo(p1[2][0], p1[2][1]);
  }
  ctx.stroke();

  if (params.pendulum || paused) {
    d3.select('#pendulum').attr('d', pendulumPath(p1));
  }
}

reinitialize();
animation.start();

var hideTimer = new ResetTimer(2000);
controlPanelRoot.addEventListener('mouseenter', function () {
  controlPanelRoot.classList.add('is-hover');
  hideTimer.stop();
}, false);

controlPanelRoot.addEventListener('mouseleave', function () {
  hideTimer.reset();
}, false);

hideTimer.on('timeout', function () {
  controlPanelRoot.classList.remove('is-hover');
});

