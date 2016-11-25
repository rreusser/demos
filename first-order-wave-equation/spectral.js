'use strict'

var ndarray = require('ndarray')
var fft = require('ndarray-fft')
var ops = require('ndarray-ops')

module.exports = function spectral (dfdt, f, t) {
  var fac, tmp
  var n = dfdt.length
  var fc = ndarray(new Float64Array(n))
  var fr = ndarray(new Float64Array(f))

  // To wavenumber domain:
  fft(1, fr, fc)

  // Multiplication by the wavenumber:
  ops.muleq(fr, this.fftfreq)
  ops.muleq(fc, this.fftfreq)

  // Multiplication by -c * i:
  tmp = fr; fr = fc; fc = tmp
  ops.mulseq(fr, -this.c * 2 * Math.PI)
  ops.mulseq(fc, this.c * 2 * Math.PI)

  // To spatial domain:
  fft(-1, fr, fc)

  // Use fc in order to implicitly multiply by i:
  ops.assign(ndarray(dfdt), fr)
}

