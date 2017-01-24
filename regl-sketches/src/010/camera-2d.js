'use strict';

module.exports = function (regl, config) {
  config = config || {};
  config.x = config.x || [0, 0];
  config.zoom = config.zoom || 1;

  var state = {
    view: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    dirty: true
  };

  var setState = regl({
    uniforms: {
      view: ctx => {
        var aspectRatio = ctx.framebufferHeight / ctx.framebufferWidth;
        state.view[0] = aspectRatio * config.zoom;
        state.view[4] = config.zoom;
        state.view[6] = -config.x[0] * config.zoom;
        state.view[7] = -config.x[1] * config.zoom;
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
