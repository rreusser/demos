module.exports = function (regl) {
  var wid = 2.2;
  return regl({
    uniforms: {
      viewproj: regl.context('view'),
      aspect: ctx => ctx.viewportHeight / ctx.viewportWidth,
      lineWidth: ctx => wid / ctx.viewportHeight * ctx.pixelRatio,
      lineHalfWidthPixels: ctx => wid * 0.5 * ctx.pixelRatio,
      pointSize: ctx => 10.0 * ctx.pixelRatio
    }
  });
};
