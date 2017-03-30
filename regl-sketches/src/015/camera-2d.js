'use strict';

module.exports = function (regl, config) {
  config = config || {};
  config.x = config.x || [0, 0];
  config.alpha = config.alpha || 0;
  config.zoom = config.zoom || 1;

  var state = {
    view: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    dirty: true
  };

  regl._gl.canvas.addEventListener('mousewheel', e => e.preventDefault());

  var setState = regl({
    uniforms: {
      view: ctx => {
        var aspectRatio = ctx.framebufferHeight / ctx.framebufferWidth;
        var w = aspectRatio * config.zoom;
        var h = config.zoom;
        var angle = -config.alpha * Math.PI / 180;
        state.view[0] = w * Math.cos(angle);
        state.view[1] = h * Math.sin(angle);
        state.view[3] = -w * Math.sin(angle);
        state.view[4] = h * Math.cos(angle);
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
