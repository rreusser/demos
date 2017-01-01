const randn = require('random-normal');
const ndarray = require('ndarray');
const cwise = require('cwise');

module.exports = function (regl) {
  const initialize = cwise({
    args: [{blockIndices: -1}, {blockIndices: -1}, 'scalar', 'scalar', 'scalar', 'scalar', 'scalar'],
    body: function (y, v, rand) {
      y[0] = rand() * 0.01 * 10;
      y[1] = rand() * 0.01 * 10;
      y[2] = rand() * 0.01 * 10;
      y[3] = 0;

      v[0] = rand() * 0.1;
      v[1] = rand() * 0.1;
      v[2] = rand() * 0.1;
      v[3] = 0;
    }
  });

  return function (state, opts) {
    const shape = [opts.side, opts.side, 4];
    const ndy0 = ndarray(new Float32Array(opts.n), shape);
    const ndv0 = ndarray(new Float32Array(opts.n), shape);

    initialize(ndy0, ndv0, randn);

    state.y0.texture({data: ndy0});
    state.y[0].texture({data: ndy0});
    state.v0.texture({data: ndv0});
    state.v[0].texture({data: ndv0});
  };
}
