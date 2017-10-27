var nearestApproach = require('./nearest-approach');
var distance = require('./distance');

module.exports = function (arr) {
  var rand;
  var tmp;
  var len = arr.length;
  while (len) {
    rand = Math.floor(Math.random() * len--);
    tmp = arr[len];
    arr[len] = arr[rand];
    arr[rand] = tmp;
  }
};

module.exports = function (x, dtInt, p0, dt) {
  var iSrc = [];
  var iDst = [];
  var tInt = [];
  var pSrc = [];
  var pDst = [];

  var obj = {
    tInt: tInt,
    pSrc: pSrc,
    pDst: pDst
  };

  var membership = [];
  var p = [];
  var pairs = [];

  function copy4 (dst, i, src, j) {
    dst[i] = src[j];
    dst[i + 1] = src[j + 1];
    dst[i + 2] = src[j + 2];
    dst[i + 3] = src[j + 3];
  }

  obj.interact = function (t) {
    var i, j, r2;
    var m = tInt.length;
    var n = x.length;

    var ptr1 = 0;
    var ptr2 = 0;
    var cnt = 0;
    for (i = 0, j = 0; i < m; i++) {
      if (t < tInt[i] + dtInt) {
        copy4(pSrc, ptr2, pSrc, ptr1);
        copy4(pDst, ptr2, pDst, ptr1);
        tInt[j] = tInt[i];
        iSrc[j] = iSrc[i];
        iDst[j] = iDst[i];
        ptr2 += 4;
        j++;
      } else {
        console.log('interaction ' + i + ' complete');
        x[iDst[i] + 2] += p[2 * j];
        x[iDst[i] + 3] += p[2 * j + 1];

        membership[iSrc[i]] = undefined;
        membership[iDst[i]] = undefined;
      }
      ptr1 += 4;
    }
    if (m !== j) {
      console.log(m + ' down to ' + j);
    }

    m = j;
    tInt.length = m;
    pSrc.length = m * 4;
    pDst.length = m * 4;

    for (i = 0; i < n; i += 4) {
      for (j = i + 4; j < n; j += 4) {
        if (membership[i] !== undefined) continue;
        if (membership[j] !== undefined) continue;

        var r2 = distance(x, i, j);

        if (r2 < 0.5 * 0.5) {// && Math.random() < 0.1 * dt) {
          tInt[m] = t;

          var r = Math.random() > 0.5;

          var ii = r ? i : j;
          var jj = r ? j : i;

          iSrc[m] = ii;
          iDst[m] = jj;

          console.log(ii + ' interacting with ' + jj + ' -> ' + m);

          var dxF = (x[jj    ] + x[jj + 2] * dtInt) - x[ii];
          var dyF = (x[jj + 1] + x[jj + 3] * dtInt) - x[ii + 1];
          var l = (dxF * dxF + dyF * dyF);
          dxF /= l;
          dyF /= l;
          p[2 * m] = dxF * p0;
          p[2 * m + 1] = dyF * p0;

          pSrc[4 * m + 0] = x[ii + 0];
          pSrc[4 * m + 1] = x[ii + 1];
          pSrc[4 * m + 2] = x[ii + 2];
          pSrc[4 * m + 3] = x[ii + 3];

          pDst[4 * m + 0] = x[jj + 0];
          pDst[4 * m + 1] = x[jj + 1];
          pDst[4 * m + 2] = x[jj + 2];
          pDst[4 * m + 3] = x[jj + 3];

          x[ii + 2] -= p[2 * m];
          x[ii + 3] -= p[2 * m + 1];

          membership[ii] = m;
          membership[jj] = m;

          m++;
        }
      }
    }
  }

  return obj;
};
