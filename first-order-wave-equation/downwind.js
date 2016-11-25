'use strict'

module.exports = function downwind (dfdt, f, t) {
  var i, ip, im, dfdx
  for (i = 0; i < this.n; i++) {
    ip = (i + 1 + this.n) % this.n
    dfdx = (f[ip] - f[i]) / this.dx
    dfdt[i] = -this.c * dfdx
  }
}

