const extend = require('xtend/mutable');

module.exports = function (gpu, n) {

  let minLife = 0.3;

  function makeState(n) {
    let s = {
      rInitial: gpu.array(() => [Math.random(), Math.random(), 0, 0], [n, n, 4]),
      r0: gpu.array(() => [Math.random(), Math.random(), 0, 0], [n, n, 4]),
      r1: gpu.array(() => [0, 0, 0, 0], [n, n, 4]),
      rvInitial: gpu.array(() => [0, 0, 1, 0], [n, n, 4]),
      rv0: gpu.array(() => [0, 0, minLife + (1.0 - minLife) * Math.random(), 0], [n, n, 4]),
      rv1: gpu.array(() => [0, 0, minLife + (1.0 - minLife) * Math.random(), 0], [n, n, 4]),
    }

    s.coords = s.r0.samplerCoords();

    return s;
  }

  let state = makeState(n);

  state.resize = function (n) {
    state.rInitial.destroy();
    state.r0.destroy();
    state.r1.destroy();
    state.rvInitial.destroy();
    state.rv0.destroy();
    state.rv1.destroy();
    state.coords.destroy();

    let newState = makeState(n);

    extend(state, newState);
  }

  return state;
};
