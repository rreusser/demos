module.exports = function dydt (yp, y) {
  var i, j, rx, ry, rz, r3;
  var n = y.length;
  for (i = 0; i < n; i += 6) {
    yp[i] = y[i + 3];
    yp[i + 1] = y[i + 4];
    yp[i + 2] = y[i + 5];
    yp[i + 3] = yp[i + 4] = yp[i + 5] = 0;
    for (j = 0; j < n; j += 6) {
      if (i === j) continue;
      rx = y[j] - y[i];
      ry = y[j + 1] - y[i + 1];
      rz = y[j + 2] - y[i + 2];
      r3 = Math.pow(rx * rx + ry * ry + rz * rz, 1.5);
      yp[i + 3] += rx / r3;
      yp[i + 4] += ry / r3;
      yp[i + 5] += rz / r3;
    }
  }
};
