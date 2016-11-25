'use strict'

var createFit = require('canvas-fit')
var queryString = require('query-string')
var extend = require('util-extend')
var fftfreq = require('./fftfreq')
var h = require('h');

document.body.appendChild(h('canvas#canvas'));

var params = extend({
  time: 'midpoint',
  space: 'central',
  cfl: 0.2
}, queryString.parse(location.search))

var methods = {
  euler: require('ode-euler'),
  midpoint: require('ode-midpoint'),
  rk4: require('ode-rk4'),
  upwind: require('./upwind'),
  downwind: require('./downwind'),
  central: require('./central'),
  compact6: require('./compact-sixth-order'),
  compact8: require('./compact-eighth-order'),
  spectral: require('./spectral'),
}

var canvas, ctx, w, h
var n = 50                    // Number of gridpoints
var c = 1.0                   // Speed of the waves
var cfl = Number(params.cfl)  // Courant-Friedrichs-Lewy (CFL) number
var xmin = 0                  // viewport x-bounds
var xmax = 1
var fmax = -1.5               // viewport y-bounds
var fmin = 1.5
var xmm = xmax - xmin
var fmm = fmax - fmin
var f = new Float64Array(n)   // solution vector

var dx = (xmax - xmin) / n    // Step size
var dt = cfl * dx / c         // Timestep

// Initialize the solution:
for (var i = 0; i < n; i++) {
  f[i] = 1.0 * Math.sin(i / n * 4 * Math.PI) +
         0.2 * Math.cos(i / n * 40 * Math.PI)
}

// Create an integrator with extra variables attached:
var integrator = extend(methods[params.time](f, methods[params.space], 0, dt), {
  n: n,
  c: c,
  dx: dx,
  aa: new Float64Array(n),
  bb: new Float64Array(n),
  cc: new Float64Array(n),
  ww: new Float64Array(n),
  fftfreq: fftfreq(n, dx),
})

function xToI (x) {
  return (x - xmin) / xmm * w
}

function fToJ (f) {
  return (f - fmin) / fmm * h
}

function draw () {
  var ii, jj
  ctx.clearRect(0, 0, w, h)
  ctx.save()
  ctx.lineWidth = window.devicePixelRatio
  ctx.beginPath()

  ctx.moveTo(xToI(0), fToJ(f[0]))
  for (i = 1; i < n; i++) {
    ctx.lineTo(xToI(i / n), fToJ(f[i]))
  }
  ctx.lineTo(xToI(1), fToJ(f[0]))

  ctx.stroke()
}

window.onload = function() {
  // Get the element:
  canvas = document.getElementById('canvas')

  // Create an auto-fit function:
  var fit = createFit(canvas)

  // Set the fit scale:
  fit.scale = window.devicePixelRatio
  fit.parent = function () {
    return [ Math.min(window.innerWidth, 800), Math.min(window.innerHeight, 300) ]
  }

  function resize () {
    fit()
    ctx = canvas.getContext('2d')
    w = canvas.width
    h = canvas.height
  }

  window.addEventListener('resize', resize, false)
  resize()

  function onRaf () {
    integrator.step()
    draw()
    requestAnimationFrame(onRaf)
  }
  requestAnimationFrame(onRaf)

}
