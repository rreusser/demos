const rk2 = require('ode-midpoint');
const fft = require('ndarray-fft');
const fftfreq = require('./fftfreq');
const ndarray = require('ndarray');
const debias = require('./debias');
const fill = require('ndarray-fill');

module.exports = function (opts) {
  const Type = Float32Array;
  const m = opts.m;
  const n = opts.n;
  const res = opts.res;
  const scale = opts.scale;
  const randomness = opts.randomness;

  const xrange = Math.PI * 2 * scale * m / 64 / res;
  const yrange = Math.PI * 2 * scale * n / 64 / res;
  const dx = xrange / m;
  const dy = yrange / n;

  const dt = 5.0e-5 * Math.pow(scale / res / res, 2);

  // Wavenumber basis:
  const xbase = fill(ndarray(new Type(m)), i => (i / m - 0.5) * xrange);
  const ybase = fill(ndarray(new Type(n)), j => (j / n - 0.5) * yrange);
  const kxbase = fill(ndarray(new Type(m)), i => fftfreq(i, m, dx));
  const kybase = fill(ndarray(new Type(n)), j => fftfreq(j, n, dy));

  // Solution data:
  const u0 = ndarray(new Type(m * n), [m, n]);

  // Work vectors:
  const w1r = ndarray(new Type(m * n), [m, n]);
  const w1i = ndarray(new Type(m * n), [m, n]);
  const w2r = ndarray(new Type(m * n), [m, n]);
  const w2i = ndarray(new Type(m * n), [m, n]);
  const w3r = ndarray(new Type(m * n), [m, n]);
  const w3i = ndarray(new Type(m * n), [m, n]);
  const w4r = ndarray(new Type(m * n), [m, n]);
  const w4i = ndarray(new Type(m * n), [m, n]);

  // Derivative for Kuramoto–Sivashinsky equation,
  // u_t = - ∇⁴u - ∇²u - ½ |∇u|² = 0
  function deriv (yp, y) {
    // w1 <- y
    w1r.data.set(y);
    w1i.data.fill(0);

    // w1 < - fft(w1)
    fft(1, w1r, w1i);

    // w1 < - -((kx² + ky²)² + (kx² + ky²)) * w1
    for(let j = 0; j < n; j++) {
      let ky = kybase.data[j];
      let ky2 = ky * ky;

      for(let i = 0; i < m; i++) {
        let idx = i + j * m;
        let kx = kxbase.data[i];

        // Copy w2 < - -w1 * ((kx² + ky²)² + (kx² + ky²))
        let kx2 = kx * kx;
        let kx2ky2 = kx2 + ky2;
        let fac = -kx2ky2 * (-1 + kx2ky2);
        w2r.data[idx] = w1r.data[idx] * fac;
        w2i.data[idx] = w1i.data[idx] * fac;

        // Copy w3 < - -i * kx * w1
        w3r.data[idx] = w1i.data[idx] * kx
        w3i.data[idx] = -w1r.data[idx] * kx

        // Copy w4 < - -i * ky * w1
        w4r.data[idx] = w1i.data[idx] * ky
        w4i.data[idx] = -w1r.data[idx] * ky
      }
    }

    // Now lots of inverses:
    fft(-1, w2r, w2i);
    fft(-1, w3r, w3i);
    fft(-1, w4r, w4i);

    for (let i = 0; i < m * n; i++) {
      yp[i] = w2r.data[i] - 0.5 * (w3r.data[i] * w3r.data[i] + w4r.data[i] * w4r.data[i]);
    }
  }

  let raf;
  let frame = 10000;

  let zmin = -2.5;
  let zmax = 2.5;

  const pde = rk2(u0.data, deriv, 0, dt);

  function step () {
    pde.steps(Math.round(20 * Math.pow(res, 4)));

    const zrange = debias(u0.data);
    const decay = 0.98;
    const balance = 1.0;

    zmin = decay * zmin + (1.0 - decay) * (Math.min(-zrange[0], -balance * zrange[2] + (1.0 - balance) * zrange[0]));
    zmax = decay * zmax + (1.0 - decay) * (Math.max(zrange[1], balance * zrange[2] + (1.0 - balance) * zrange[1]));

    return {
      zmin: zmin,
      zmax: zmax
    };
  }

  function write (texture) {
    texture({
      wrapS: 'repeat',
      wrapT: 'repeat',
      mag: 'linear',
      min: 'linear',
      data: u0.data,
      format: 'alpha',
      width: m,
      height: n,
      type: 'float'
    });
  }

  return {
    step: step,
    pde: pde,
    write: write,
    initialize: function (type) {
      switch(type) {
        case 'spot':
          fill(u0, (i, j) => {
            let x = xbase.get(i);
            let y = ybase.get(j);
            return 2.0 * Math.exp(-(x * x + y * y) / Math.pow(2.0 / res, 2))
              + randomness * (Math.random() * 2.0 - 1.0)
          })
          break;
        case 'wave':
          fill(u0, (i, j) => {
            return 2.0 * Math.sin((i * 1 + j * 1) / m * Math.PI * 2.0)
              + randomness * (Math.random() * 2.0 - 1.0);
          })
          break;
      }
    }
  }
}
