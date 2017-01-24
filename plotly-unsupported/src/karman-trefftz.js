'use strict';

module.exports = function karmanTrefftz (n, a, b) {
  var det = a * a + b * b;
  var opzr = 1 + a / det;
  var opzi = -b / det;
  var omzr = 1 - a / det;
  var omzi = b / det;

  var opznarg = Math.atan2(opzi, opzr) * n;
  var opznmod = Math.pow(opzr * opzr + opzi * opzi, n * 0.5);
  var opznr = opznmod * Math.cos(opznarg);
  var opzni = opznmod * Math.sin(opznarg);

  var omznarg = Math.atan2(omzi, omzr) * n;
  var omznmod = Math.pow(omzr * omzr + omzi * omzi, n * 0.5);
  var omznr = omznmod * Math.cos(omznarg);
  var omzni = omznmod * Math.sin(omznarg);

  var numr = opznr + omznr;
  var numi = opzni + omzni;
  var denr = opznr - omznr;
  var deni = opzni - omzni;
  det = denr * denr + deni * deni;

  return [
    n * (denr * numr + deni * numi) / det,
    n * (denr * numi - deni * numr) / det
  ];
};
