'use strict'

var triper = require('solve-periodic-tridiagonal')

module.exports = function compactSixthOrder (dfdt, f, t) {
  var i, ip1, im1, ip2, im2, dfdx
  var c6alpha = 1 / 3
  var c6a = 7 / 9 / this.dx
  var c6b = 1 / 36 / this.dx
  var n = this.n

  for(i = 0; i < n; i++) {
    this.aa[i] = c6alpha
    this.bb[i] = 1
    this.cc[i] = c6alpha

    ip1 = (i + 1) % n
    im1 = (i - 1 + n) % n
    ip2 = (i + 2) % n
    im2 = (i - 2 + n) % n

    dfdt[i] = (f[ip1] - f[im1]) * c6a +
              (f[ip2] - f[im2]) * c6b
    dfdt[i] *= -this.c
  }

  triper(n, this.aa, this.bb, this.cc, dfdt, this.ww)
}
