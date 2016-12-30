'use strict';

module.exports = swap;

function swap (obufs, ibufs, i1, i2) {
  if (arguments.length === 3) {
    let tmp = obufs[ibufs];
    obufs[ibufs] = obufs[i1];
    obufs[i1] = tmp;
  } else {
    obufs[i1] = ibufs[i2];
    obufs[i2] = ibufs[i1];
  }
  return obufs;
}
