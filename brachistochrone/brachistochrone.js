'use strict';

module.exports = Brachistochrone;

var newtonRaphson = require('newton-raphson');

//
// ^
// |  o (a, A)
// |  |                      |
// |   \_                    |
// |     --____--o (b, B)    v g
// |
// +---------------------------->
//
function Brachistochrone (a, A, b, B, g) {
  this.a = a;
  this.A = A;
  this.b = b;
  this.B = B;
  this.g = g;

  this._f = fBrachistochrone.bind(this);
  this._fp = fpBrachistochrone.bind(this);
  this._fXToTheta = fXToTheta.bind(this);
  this._fpXToTheta = fpXToTheta.bind(this);

  this.evaluate = this._evaluate.bind(this);
  this.evaluateByX = this._evaluateByX.bind(this);
};


// The root of this corresponds to theta0 that solves the brachistochrone:
function fBrachistochrone (x) {
  return this._delta * (1 - Math.cos(2 * x)) - 2 * x + Math.sin(2 * x);
}

function fpBrachistochrone (x) {
  return 2 * (Math.cos(2 * x) + this._delta * Math.sin(2 * x) - 1);
}

Brachistochrone.prototype._evaluate = function (t) {
  var theta = - t * this.theta0;
  return [
    this.a + this.beta * (2 * theta - Math.sin(2 * theta)),
    this.A - this.beta * (1 - Math.cos(2 * theta))
  ];
};

Brachistochrone.prototype.tabulate = function (n) {
  var data = [];
  for (var i = 0; i < n; i++) {
    data[i] = this.evaluate(i / (n - 1));
  }
  return data;
}

Brachistochrone.prototype.solve = function () {
  var fMin = Infinity;
  var guess = 0;
  var n = 50;

  this._delta = (this.b - this.a) / (this.B - this.A);

  for (var i = n / 2; i < n; i++) {
    var x = -i / (n - 1) * Math.PI;
    var f = this._f(x);
    if (Math.abs(f) < fMin){
      fMin = Math.abs(f);
      guess = x;
    }
  }

  this.theta0 = newtonRaphson(this._f, this._fp, guess);
  this.beta = (this.A - this.B) / (1 - Math.cos(2 * this.theta0));

  return this.theta0;
};

Brachistochrone.prototype._evaluateByX = function (x) {
  //console.log('evaluate by x:', x)

  var theta = this.xToTheta(x);
  var pt = this.evaluate(theta);
  //console.log('theta for matching x = ', theta, x, pt);
  return pt;
};

function fXToTheta (t) {
  t = Math.min(1, Math.max(0, t));
  return this.a + this.beta * (Math.sin(2 * t * this.theta0) - 2 * this.theta0 * t) - this._xTarget;
}

function fpXToTheta (t) {
  t = Math.min(1, Math.max(0, t));
  return 2 * this.theta0 * this.beta * (Math.cos(2 * t * this.theta0) - 1);
}

Brachistochrone.prototype.xToTheta = function (x) {
  this._xTarget = x;
  var guess = Math.sqrt((x - this.a) / (this.b - this.a));
  return newtonRaphson(this._fXToTheta, this._fpXToTheta, guess);
};

