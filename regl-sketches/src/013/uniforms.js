const mat4 = require('gl-mat4');

function model (ctx, props) {
  return [
    props.aspectRatio, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0.5 -props.aspectRatio * 0.5, 0, 0, 1,
  ]
}

module.exports = function (regl) {
  return regl({
    uniforms: {
      view: ctx => ctx.view,
      iview: ctx => mat4.invert([], ctx.view),
      tailLength: regl.prop('tailLength'),
      tailWidth: regl.prop('tailWidth'),
      border: regl.prop('border'),
      aspectRatio: regl.prop('aspectRatio'),
      model: model,
      time: regl.context('time')
    }
  });
}
