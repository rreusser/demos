'use strict';

module.exports = function approxRoe (gamma, rL, uL, pL, rR, uR, pR) {
  var HL, HR, w, rh, uh, Hh, ah, aL, aR, lh1ms, lh3ps;
  var FL1, FL2, FL3, FR1, FR2, FR3;
  var l1R, l1L, l3R, l3L;
  var lh1, lh3, dl12, dl32;
  var dV1, dV3, R21, R23, R31, R33;

  var gm1 = gamma - 1;
  var ggm1 = gamma / gm1;

  w = Math.sqrt(rR / rL);
  rh = w * rL;
  uh = (uL + w * uR) / (1 + w);
  HL = (ggm1 * pL / rL + 0.5 * uL * uL);
  HR = (ggm1 * pR / rR + 0.5 * uR * uR);
  Hh = (HL + HR * w) / (1 + w);
  ah = Math.sqrt(gm1 * (Hh - 0.5 * uh * uh));
  aL = Math.sqrt(gamma * pL / rL);
  aR = Math.sqrt(gamma * pR / rR);

  if (uh >= 0) {
    R21 = uh - ah;
    R31 = Hh - uh * ah;
    l1R = uR - aR;
    l1L = uL - aL;
    lh1 = uh - ah;
    dl12 = Math.min(ah, Math.max(0, 2 * (l1R - l1L)));
    if (lh1 <= -dl12) {
      lh1ms = lh1;
    } else if (lh1 >= dl12) {
      lh1ms = 0;
    } else {
      lh1ms = -0.25 * Math.pow(lh1 - dl12, 2) / dl12;
    }
    /* Left flux vector */
    FL1 = rL * uL;
    FL2 = rL * uL * uL + pL;
    FL3 = rL * uL * (pL / rL / gm1 + pL / rL + 0.5 * uL * uL);
    dV1 = (pR - pL - rh * ah * (uR - uL)) * 0.5 / ah / ah;
    return [
      FL1 + lh1ms * dV1,
      FL2 + lh1ms * dV1 * R21,
      FL3 + lh1ms * dV1 * R31
    ];
  } else {
    R23 = uh + ah;
    R33 = Hh + uh * ah;
    lh3 = uh + ah;
    l3L = uL + aL;
    l3R = uR + aR;
    dl32 = Math.min(ah, Math.max(0, 2 * (l3R - l3L)));
    if (lh3 <= -dl32) {
      lh3ps = 0;
    } else if (lh3 >= dl32) {
      lh3ps = lh3;
    } else {
      lh3ps = -0.25 * Math.pow(lh3 - dl32, 2) / dl32;
    }
    /* Right flux vector */
    FR1 = rR * uR;
    FR2 = rR * uR * uR + pR;
    FR3 = rR * uR * (pR / rR / gm1 + pR / rR + 0.5 * uR * uR);
    dV3 = (pR - pL + rh * ah * (uR - uL)) * 0.5 / ah / ah;
    return [
      FR1 - lh3ps * dV3,
      FR2 - lh3ps * dV3 * R23,
      FR3 - lh3ps * dV3 * R33
    ];
  }
};
