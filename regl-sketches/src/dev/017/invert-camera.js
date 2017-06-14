const invert = require('gl-mat4/invert');

module.exports = function (regl) {
  const ip = [];
  const iv = [];

  return regl({
    uniforms: {
      iprojection: ctx => invert(ip, ctx.projection),
      iview: ctx => invert(iv, ctx.view)
    }
  });
};
