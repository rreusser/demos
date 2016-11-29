'use strict';

const normalize = require('gl-vec3/normalize');
const transformMat4 = require('gl-vec4/transformMat4');
const invert = require('gl-mat4/invert');
const mouse = require('mouse-change');

module.exports = raycast;

function raycast (regl, options) {
  options = options || {};
  var normalized = options.normalized === undefined ? true : !!options.normalized;

  var mouseX = 0;
  var mouseY = 0;
  var mouseBtns;
  var dirty = true;

  mouse(function (bb, xx, yy) {
    dirty = true;
    mouseBtns = bb;
    mouseX = xx;
    mouseY = yy;
  });

  var injectContext = regl({
    context: {
      rayOrigin: function (context) {
        return context.eye;
      },
      rayDirection: function () {
        return ray;
      },
      rayChanged: function () {
        var _dirty = dirty;
        dirty = false;
        return _dirty;
      }
    }
  });

  var view = [];
  var proj = [];
  var ray = [];

  return function (context, cb) {
    if (dirty) {
      invert(view, context.view);
      invert(proj, context.projection);

      // Pick ray in homogeneous clip coordinates:
      ray[0] = 2 * mouseX / context.viewportWidth * context.pixelRatio - 1;
      ray[1] = 1 - (2 * mouseY) / context.viewportHeight * context.pixelRatio;
      ray[2] = -1;
      ray[3] = 1;

      // Transform into eye coords:
      transformMat4(ray, ray, proj);

      // Set z, w to mean forwards and not a point:
      ray[2] = -1;
      ray[3] = 0;

      // Into world coordinates:
      transformMat4(ray, ray, view);

      if (normalized) {
        normalize(ray, ray);
      }
    }

    injectContext(cb);
  }
}

