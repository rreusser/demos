module.exports = function (regl) {
  return function () {
    return regl.framebuffer({
      width: regl._gl.canvas.width,
      height: regl._gl.canvas.height,
      colorCount: 4,
      colorType: 'float',
    });
  }
};
