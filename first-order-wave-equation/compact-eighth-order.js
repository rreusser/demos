'use strict'

var triper = require('solve-periodic-tridiagonal')

module.exports = function compactEighthOrder (dfdt, f, t) {
  var i, ip1, im1, ip2, im2, ip3, im3, dfdx
  var c8alpha = 3 / 8
  var c8a = 25 / 16 / 2 / this.dx
  var c8b = 1 / 5 / 4 / this.dx
  var c8c = -1 / 80 / 6 / this.dx
  var n = this.n

  for(i = 0; i < n; i++) {
    this.aa[i] = c8alpha
    this.bb[i] = 1
    this.cc[i] = c8alpha

    ip1 = (i + 1) % n
    im1 = (i - 1 + n) % n
    ip2 = (i + 2) % n
    im2 = (i - 2 + n) % n
    ip3 = (i + 3) % n
    im3 = (i - 3 + n) % n

    dfdt[i] = (f[ip1] - f[im1]) * c8a +
              (f[ip2] - f[im2]) * c8b +
              (f[ip3] - f[im3]) * c8c
    dfdt[i] *= -this.c
  }

  triper(n, this.aa, this.bb, this.cc, dfdt, this.ww)
}

