const invert = require('gl-mat4/invert');

module.exports = function (regl) {
  let m1 = [];
  let m2 = [];

  return regl({
    uniforms: {
      iview: ctx => invert(m1, ctx.view),
      iproj: ctx => invert(m2, ctx.projection),
    }
  });
}
