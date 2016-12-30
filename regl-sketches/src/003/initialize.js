const randn = require('random-normal');
const ndarray = require('ndarray');
const cwise = require('cwise');

module.exports = function (regl) {
  const initialize = cwise({
    args: [{blockIndices: -1}, {blockIndices: -1}, 'scalar', 'scalar', 'scalar', 'scalar', 'scalar'],
    body: function (y, v, rs, rand, spread, v0, r0) {
      var r = r0 * (1.0 + 0.01 * rand() * spread);
      var theta = 0;
      var phi = Math.PI * 0.5;
      var gam = 1.0 - rs / r;

      var u0 = rand() * 0.001 * spread;
      var u1 = Math.sqrt(0.5 / r) / r * v0 * (1.0 + 0.1 * rand() * spread) * Math.pow(rs, 0.5);
      var u2 = rand() * 0.0005 * spread;
      var kappa = -1;

      // Use the metric tensor to work out the time component
      // of the velocity given a timelike velocity:
      var u3 = Math.sqrt(
        Math.pow(u0 / gam, 2) +
        Math.pow(u1 * r, 2) / gam +
        Math.pow(u2 * r * Math.sin(phi), 2) / gam -
        kappa / gam
      );

      y[0] = r;
      y[1] = theta;
      y[2] = phi;
      y[3] = 0;

      v[0] = u0;
      v[1] = u1;
      v[2] = u2;
      v[3] = u3;
    }
  });

  return function (y0, v0, y, v, opts) {
    const n = opts.shape[0] * opts.shape[1] * opts.shape[2];
    const ndy0 = ndarray(new Float32Array(n), opts.shape);
    const ndv0 = ndarray(new Float32Array(n), opts.shape);

    initialize(ndy0, ndv0, opts.rs, randn, opts.spread, opts.v0, opts.r0);

    y0.texture({data: ndy0});
    y[0].texture({data: ndy0});
    v0.texture({data: ndv0});
    v[0].texture({data: ndv0});
  };
}
