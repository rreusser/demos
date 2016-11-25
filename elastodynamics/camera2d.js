'use strict';

var mouseChange = require('mouse-change')
var mouseWheel = require('mouse-wheel')
var identity = require('gl-mat4/identity')
var ortho = require('gl-mat4/ortho')
var lookAt = require('gl-mat4/lookAt')
var invert = require('gl-mat4/invert')

module.exports = createCamera2d

function createCamera2d (regl, props) {
  var cameraState = {
    view: identity(new Float32Array(16)),
    projection: identity(new Float32Array(16)),
    eye: new Float32Array(props.eye || [0, 0, 5]),
    up: new Float32Array(props.up || [0, 1, 0]),
    center: new Float32Array(props.center ? [props.center[0], props.center[1], 0] : [0, 0, 0]),
    viewInverse: identity(new Float32Array(16)),
    projectionInverse: identity(new Float32Array(16)),
  }

  var xmin = props.xmin === undefined ? -1 : props.xmin;
  var xmax = props.xmax === undefined ? 1 : props.xmax;
  var ymin = props.ymin === undefined ? -1 : props.ymin;
  var ymax = props.ymax === undefined ? 1 : props.ymax;
  var aspectRatio = props.aspectRatio === undefined ? null : props.aspectRatio;
  var constrain = props.constrain === undefined ? 'y' : props.constrain;

  function applyAspectRatio (viewportWidth, viewportHeight) {
    if (!aspectRatio) return;

    var xcen = (xmax + xmin) * 0.5;
    var xdif = (xmax - xmin) * 0.5;
    var ycen = (ymax + ymin) * 0.5;
    var ydif = (ymax - ymin) * 0.5;

    if (constrain === 'x') {
      xdif = ydif * viewportWidth / viewportHeight * aspectRatio;
      xmin = xcen - xdif;
      xmax = xcen + xdif;
    } else {
      ydif = xdif * viewportHeight / viewportWidth / aspectRatio;
      ymin = ycen - ydif;
      ymax = ycen + ydif;
    }
  }

  var w = window.innerWidth;
  var h = window.innerHeight;

  updateCamera();
  var xmin0 = xmin;
  var xmax0 = xmax;
  var ymin0 = ymin;
  var ymax0 = ymax;
  var x0 = 0.5 * (xmin + xmax);
  var y0 = 0.5 * (ymin + ymax);

  var prevI, prevJ;
  var dirty = true;

  mouseChange(function (buttons, i, j, mods) {
    // Store a copy of the bounds whenever the mouse moves so that the mouse
    // wheel can always reference the bounds *when the mouse was last moved*:
    xmin0 = xmin;
    xmax0 = xmax;
    ymin0 = ymin;
    ymax0 = ymax;

    // Also compute and remember the mouse position as last moved:
    x0 = xmin + (xmax - xmin) * i / window.innerWidth;
    y0 = ymin + (ymax - ymin) * (window.innerHeight - j) / window.innerHeight;

    if (buttons & 1 && i !== undefined) {
      var dx = i - prevI;
      var dy = j - prevJ;
      var xscale = window.innerWidth / (xmax - xmin);
      var yscale = window.innerHeight / (ymax - ymin);

      xmin -= dx / xscale;
      xmax -= dx / xscale;

      ymin += dy / yscale;
      ymax += dy / yscale;

      dirty = true;
    }
    prevI = i;
    prevJ = j;
  })

  window.addEventListener('wheel', function (e) {
    e.stopPropagation();
    e.preventDefault();
    dirty = true;
    return false;
  });

  mouseWheel(function (dx, dy) {
    var factor = Math.exp(-dy * 0.01);

    var xpdif = (xmax - x0);
    var xmdif = (xmin - x0);
    var ypdif = (ymax - y0);
    var ymdif = (ymin - y0);

    xmin = x0 + xmdif / factor;
    xmax = x0 + xpdif / factor;
    ymin = y0 + ymdif / factor;
    ymax = y0 + ypdif / factor;

    dirty = true;
  })

  function updateCamera () {
    applyAspectRatio(w, h);

    cameraState.center[0] = cameraState.eye[0] = 0.5 * (xmin + xmax);
    cameraState.center[1] = cameraState.eye[1] = 0.5 * (ymin + ymax);

    lookAt(cameraState.view, cameraState.eye, cameraState.center, cameraState.up);

    var xdif = (xmax - xmin) * 0.5;
    var ydif = (ymax - ymin) * 0.5;
    ortho(cameraState.projection, -xdif, xdif, -ydif, ydif, 0.01, 1000.0);

    invert(cameraState.viewInverse, cameraState.view);
    invert(cameraState.projectionInverse, cameraState.projection);
  }

  var injectContext = regl({
    context: Object.assign({}, cameraState),
    uniforms: Object.keys(cameraState).reduce(function (uniforms, name) {
      uniforms[name] = regl.context(name)
      return uniforms
    }, {})
  })

  function setupCamera (block) {
    if (dirty) {
      updateCamera();
    }

    injectContext(function () {
      return block({dirty: dirty});
    });

    dirty = false;
  }

  Object.keys(cameraState).forEach(function (name) {
    setupCamera[name] = cameraState[name]
  })

  return setupCamera
}

