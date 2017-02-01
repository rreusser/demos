'use strict';

var cwise = require('cwise');

// Set up Sod's problem:
var gamma = 7 / 5;
var rhoL = 1e5;
var rhoR = 1.25e4;
var pL = 1;
var pR = 0.1;
var uL = 0;
var uR = 0;
var U0L = [rhoL, rhoL * uL, pL / (gamma - 1)];
var U0R = [rhoR, rhoR * uR, pR / (gamma - 1)];

module.exports.gamma = gamma;

var initialize = cwise({
  args: [{blockIndices: -1}, 'array', 'scalar', 'scalar'],
  body: function (U, x, U0L, U0R) {
    U[0] = x < 0 ? U0L[0] : U0R[0];
    U[1] = x < 0 ? U0L[1] : U0R[1];
    U[2] = x < 0 ? U0L[2] : U0R[2];
  }
});

module.exports.initialize = function (U, x) {
  initialize(U, x, U0L, U0R);
  return U;
};
