const extend = require('xtend/mutable');

module.exports = function (gpu, n) {
  const opts = {
    xboundary: 'clamp',
    yboundary: 'clamp',
    magfilter: 'linear',
    minfilter: 'linear',
  };

  function makeState (n) {
    const y1 = gpu.array((i, j) => [
      i / (n - 1) * 2 - 1,
      j / (n - 1) * 2 - 1,
      0,
      0
    ], [n, n, 4], opts);

    const y0 = gpu.array(null, [n, n, 4], opts);
    const dz = gpu.array(null, [n, n, 4], opts);

    return {
      y1: y1,
      y0: y0,
      dz: dz
    };
  }

  const state = makeState(n);

  state.resize = function (n) {
    state.y0.destroy();
    state.y1.destroy();
    state.dz.destroy();

    let newState = makeState(n);
    state.y0 = newState.y0;
    state.y1 = newState.y1;
    state.dz = newState.dz;

    return state;
  }

  return state;
};
