'use strict'

module.exports = function upwind (dfdt, f, t) {
  var i, im, dfdx
  for (i = 0; i < this.n; i++) {
    im = (i - 1 + this.n) % this.n
    dfdx = (f[i] - f[im]) / this.dx
    dfdt[i] = -this.c * dfdx
  }
}
