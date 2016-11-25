'use strict'

module.exports = function explicitSecondOrder (dfdt, f, t) {
  var i, ip, im, dfdx
  var n = this.n
  for (i = 0; i < n; i++) {
    ip = (i + 1) % n
    im = (i - 1 + n) % n
    dfdx = 0.5 * (f[ip] - f[im]) / this.dx
    dfdt[i] = -this.c * dfdx
  }
}

