'use strict';

var cwise = require('cwise');
var roe = require('./roe');

var flux = cwise({
  args: [{blockIndices: -1}, {offset: 1, array: 0}, {blockIndices: -1}, 'scalar', 'scalar'],
  body: function (UL, UR, R, gamma, roe) {
    R[0] = (UL[0] + UR[0]) * 0.5
    R[1] = (UL[1] + UR[1]) * 0.5
    R[2] = (UL[2] + UR[2]) * 0.5
    var rL = UL[0];
    var pL = (gamma - 1) * UL[2];
    var uL = UL[1] / UL[0];
    var rR = UR[0];
    var pR = (gamma - 1) * UR[2];
    var uR = UR[1] / UR[0];

    var F = roe(gamma, rL, uL, pL, rR, uR, pR);
    R
  }
});

module.exports = function computeFlux (U, R, gamma) {
  flux(U, R.hi(R.shape[0] - 1), gamma, roe);
}
