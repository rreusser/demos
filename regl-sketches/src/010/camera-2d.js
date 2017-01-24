'use strict';

module.exports = function (regl, opts) {
  opts = opts || {};
  var x = opts.x || [0, 0];
  var zoom = opts.zoom || 1;

  var state = {
    view: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    dirty: true
  };

  var setState = regl({
    uniforms: {
      view: ctx => {
        var aspectRatio = ctx.framebufferHeight / ctx.framebufferWidth;
        state.view[0] = aspectRatio * zoom;
        state.view[4] = zoom;
        state.view[6] = -x[0] * zoom;
        state.view[7] = -x[1] * zoom;
        return state.view
      }
    }
  });

  let ret =  function (cb) {
    setState(state, () => {
      cb({
        dirty: state.dirty
      });

      state.dirty = false;
    });
  };

  ret.taint = function () {
    state.dirty = true;
  };

  return ret;
};
