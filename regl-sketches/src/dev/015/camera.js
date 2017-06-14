var mouseChange = require('mouse-change')
var mouseWheel = require('mouse-wheel')
var identity = require('gl-mat4/identity')
var perspective = require('gl-mat4/perspective')
var lookAt = require('gl-mat4/lookAt')
var invert = require('gl-mat4/invert')

module.exports = createCamera

var isBrowser = typeof window !== 'undefined'

function createCamera (regl, props_) {
  var element = regl._gl.canvas;
  element.addEventListener('mousewheel', function (e) {
    e.preventDefault();
  });

  var props = props_ || {}
  var cameraState = {
    view: identity(new Float32Array(16)),
    iview: identity(new Float32Array(16)),
    projection: identity(new Float32Array(16)),
    center: new Float32Array(props.center || 3),
    theta: props.theta || 0,
    phi: props.phi || 0,
    distance: Math.log(props.distance || 10.0),
    eye: new Float32Array(3),
    up: new Float32Array(props.up || [0, 1, 0]),
    right: new Float32Array(props.right || [1, 0, 0]),
    front: new Float32Array(props.front || [0, 0, 1]),
    fovy: props.fovy || Math.PI / 4.0,
    near: typeof props.near !== 'undefined' ? props.near : 0.01,
    far: typeof props.far !== 'undefined' ? props.far : 1000.0,
    aspect: 1.0,
    flipY: !!props.flipY,
    dtheta: 0,
    dphi: 0
  }

  var iview = [];

  var damping = typeof props.damping !== 'undefined' ? props.damping : 0.0

  var minDistance = Math.log('minDistance' in props ? props.minDistance : 0.1)
  var maxDistance = Math.log('maxDistance' in props ? props.maxDistance : 1000)

  var ddistance = 0

  var prevX = 0
  var prevY = 0

  if (isBrowser && props.mouse !== false) {
    mouseChange(function (buttons, x, y) {
      if (buttons & 1) {
        var dx = (x - prevX) / window.innerWidth
        var dy = (y - prevY) / window.innerHeight
        var w = Math.max(cameraState.distance, 0.5)

        cameraState.dtheta += w * dx
        cameraState.dphi += w * dy
      }
      prevX = x
      prevY = y
    })
    mouseWheel(function (dx, dy) {
      ddistance += dy / window.innerHeight
    })
  }

  function damp (x) {
    var xd = x * damping
    if (Math.abs(xd) < 0.1) {
      return 0
    }
    return xd
  }

  function clamp (x, lo, hi) {
    return Math.min(Math.max(x, lo), hi)
  }

  function updateCamera (props) {
    if (props && props.dtheta) {
      props.dtheta += cameraState.dtheta;
    }
    Object.keys(props).forEach(function (prop) {
      cameraState[prop] = props[prop]
    })

    var center = cameraState.center
    var eye = cameraState.eye
    var up = cameraState.up
    var dtheta = cameraState.dtheta
    var dphi = cameraState.dphi

    cameraState.theta += dtheta
    cameraState.phi = clamp(
      cameraState.phi + dphi,
      -Math.PI / 2.0,
      Math.PI / 2.0)
    cameraState.distance = clamp(
      cameraState.distance + ddistance,
      minDistance,
      maxDistance)

    cameraState.dtheta = damp(dtheta)
    cameraState.dphi = damp(dphi)
    ddistance = damp(ddistance)

    var theta = cameraState.theta
    var phi = cameraState.phi
    var r = Math.exp(cameraState.distance)

    var vf = r * Math.sin(theta) * Math.cos(phi)
    var vr = r * Math.cos(theta) * Math.cos(phi)
    var vu = r * Math.sin(phi)

    for (var i = 0; i < 3; ++i) {
      eye[i] = center[i] + vf * cameraState.front[i] + vr * cameraState.right[i] + vu * up[i]
    }

    lookAt(cameraState.view, eye, center, up)
    invert(cameraState.iview, cameraState.view);
  }

  var injectContext = regl({
    context: Object.assign({}, cameraState, {
      projection: function (context) {
        perspective(cameraState.projection,
          cameraState.fovy,
          context.viewportWidth / context.viewportHeight,
          cameraState.near,
          cameraState.far)
        if (cameraState.flipY) { cameraState.projection[5] *= -1 }
        return cameraState.projection
      },
      aspect: function (context) {
        return context.viewportWidth / context.viewportHeight
      }
    }),
    uniforms: Object.keys(cameraState).reduce(function (uniforms, name) {
      uniforms[name] = regl.context(name)
      return uniforms
    }, {})
  })

  function setupCamera (props, block) {
    if (!block) {
      block = props
      props = {}
    }
    updateCamera(props)
    injectContext(block)
  }

  setupCamera.state = cameraState;

  Object.keys(cameraState).forEach(function (name) {
    setupCamera[name] = cameraState[name]
  })

  return setupCamera
}
