module.exports = function (regl, m, n) {
  var r = 5;
  var i, j;
  var xy = new Float32Array(m * n * 2);
  for (i = 0; i < m; i++) {
    for (j = 0; j < n; j++) {
      xy[2 * (i * n + j)] = -r + 2 * r * i / (m - 1);
      xy[2 * (i * n + j) + 1] = -r + 2 * r * j / (n - 1);
    }
  }
  return {
    xy: regl.buffer({data: xy}),
    count: m * n
  };
}
