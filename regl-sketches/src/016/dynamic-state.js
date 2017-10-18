var color = require('./color');

module.exports = function (regl) {
  var n0 = 0;
  var colData = new Float32Array(0);
  var colBuf = regl.buffer;

  function colors(n) {
    if (n === n0) return colBuf;
    n0 = n;

    var n0 = 3;
    var colData = new Float32Array(n0 * 3);

    for (var i = 0; i < n; i++) {
      var col = color(i, n, 0.5);
      colData[i * 3] = col[0];
      colData[i * 3 + 1] = col[1];
      colData[i * 3 + 2] = col[2];
    }
    return colBuf({data: colData});
  }

  var ret = {
    updateBuffers: function (data) {
      ret.count = data.length / 3;
      ret.xyz = (ret.xyz || regl.buffer)({
        data: data,
      });
      ret.color = colors(3);
    },
  }

  return ret;
};
