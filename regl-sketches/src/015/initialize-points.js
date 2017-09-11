const randn = require('random-normal');

module.exports = function (regl, n, output, type) {
  output = output || {};
  var i, j;
  var n0 = Math.round(Math.sqrt(n));
  var points = [];

  for (i = 0; i < n0 * n0; i++) {
    switch (type) {
      default:
      case 'interface':
        var rad = 0.014;
        var r = randn();
        var th = Math.random() * Math.PI * 2;
        points[4 * i] = Math.random() * 2 - 1;//r * Math.cos(th) * rad;
        points[4 * i + 1] = rad * r * Math.sin(th);
        break;
      case 'grid':
        if (Math.random() > 0.5) {
          points[4 * i] = (Math.floor(Math.random() * 11) + 0.5) / 11 * 2 - 1
          points[4 * i + 1] = Math.random() * 2 - 1
        } else {
          points[4 * i + 1] = (Math.floor(Math.random() * 11) + 0.5) / 11 * 2 - 1
          points[4 * i] = Math.random() * 2 - 1
        }
        break;
      case 'random':
        points[4 * i] = Math.random() * 2 - 1
        points[4 * i + 1] = Math.random() * 2 - 1;
    }
    points[4 * i + 2] = 0;
    points[4 * i + 3] = 0;
  }

  var fbo1 = (output.src || regl.framebuffer)({
    color: regl.texture({
      radius: n0,
      data: points,
      format: 'rgba',
      type: 'float',
      mag: 'nearest',
      min: 'nearest',
    })
  });

  var fbo2 = (output.dst || regl.framebuffer)({
    color: regl.texture({
      radius: n0,
      data: points,
      format: 'rgba',
      type: 'float',
      mag: 'nearest',
      min: 'nearest',
    })
  });

  var positions = [];
  for (i = 0; i < n0; i++) {
    for (j = 0; j < n0; j++) {
      positions.push(i / (n0 - 1));
      positions.push(j / (n0 - 1));
    }
  }

  output.src = fbo1;
  output.dst = fbo2;
  output.positions = output.positions || regl.buffer(positions);
  output.n = n0 * n0;

  return output;
}
