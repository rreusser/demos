'use strict';

var ndarray = require('ndarray');
var show = require('ndarray-show');
var linspace = require('ndarray-linspace'); var fill = require('ndarray-fill');
var vfill = require('ndarray-vector-fill');
var roe = require('./roe');
var sod = require('./sod');
var flux = require('./muscl');

var n = 10;
var xmin = -1;
var xmax = 1;
var dx = (xmax - xmin) / n;
var dt = 0.01;

// U is cell-centered:
var xc = linspace(ndarray([], [n]), xmin + dx * 0.5, xmax - dx * 0.5);
var U = ndarray([], [n, 3]);

// R is face-centered:
var xf = linspace(ndarray([], [n + 1]), xmin, xmax);
var R = ndarray([], [n + 1, 3]);

sod.initialize(U, xc);

flux(U, R, sod.gamma);

console.log('xc:\n' + show(xc));
