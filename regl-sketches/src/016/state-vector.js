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

    var els = new Uint16Array(nmax * 2 * 3);
    for (j = 0; j < nmax; j++) {
      var k = j * 6;
      els[k] = j;
      els[k + 1] = j + 2;
      els[k + 2] = j + 1;

      els[k + 3] = j + 2;
      els[k + 4] = j + 3;
      els[k + 5] = j + 1;
    }

    paths[i] = {
      xyzData: new Float32Array(nmax * 3 * 2),
      uvwData: new Float32Array(nmax * 3 * 2),
      xyz: regl.buffer({data: new Float32Array(nmax * 3 * 2)}),
      uvw: regl.buffer({data: new Float32Array(nmax * 3 * 2)}),
      color: color(i, maxpaths, 0.75),
      dir: dir,
      els: regl.elements(els),
      idx: i / maxpaths
    };
  }

  return {
    paths: paths,
    setPathCount: np => n = np,
    updateBuffers: function () {
      for (var i = 0; i < n; i++) {
        var pi = paths[i];
        pi.xyz({data: pi.xyzData});
        pi.uvw({data: pi.uvwData});
      }
    }
  };
}
