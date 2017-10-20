const color = require('./color');

module.exports = function (regl, maxpaths, nmax) {
  var i, n, j;
  const paths = [];
  nmax = nmax || 15000;

  for (i = 0; i < maxpaths; i++) {
    var dir = new Int8Array(nmax * 2);
    for (j = 0; j < nmax; j++) {
      dir[2 * j] = 1;
      dir[2 * j + 1] = -1;
    }

    //
    // 0 1   j = 0
    // 2 3   j = 1
    // 4 5   j = 2
    // 6 7   j = 3
    // 8 9

    var els = new Uint16Array(nmax * 2 * 3);
    for (j = 0; j < nmax; j++) {
      var j2 = j * 2;
      var j6 = j * 2 * 3;
      els[j6] = j2;
      els[j6 + 1] = j2 + 2;
      els[j6 + 2] = j2 + 1;

      els[j6 + 3] = j2 + 2;
      els[j6 + 4] = j2 + 3;
      els[j6 + 5] = j2 + 1;
    }

    paths[i] = {
      xyzData: new Float32Array(nmax * 3 * 2),
      uvwData: new Float32Array(nmax * 3 * 2),
      xyz: regl.buffer({data: new Float32Array(nmax * 3 * 2)}),
      uvw: regl.buffer({data: new Float32Array(nmax * 3 * 2)}),
      color: color(i, maxpaths, 0.75),
      dir: dir,
      els: regl.elements(els),
      idx: i / maxpaths,
      n: 0
    };
  }

  return {
    paths: paths,
    setPathCount: np => n = np,
    updateBuffers: function (cnt) {
      for (var i = 0; i < n; i++) {
        var pi = paths[i];
        pi.xyz({data: pi.xyzData});
        pi.uvw({data: pi.uvwData});
        pi.count = (Math.min(nmax, cnt) - 1) * 6;
      }
    }
  };
}
