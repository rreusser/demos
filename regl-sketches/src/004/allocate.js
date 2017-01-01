const randn = require('random-normal');
const ndarray = require('ndarray');
const cwise = require('cwise');

module.exports = function (gpu) {
  return function (state, params) {
    params.side = Math.round(Math.sqrt(params.n));
    const shape = [params.side, params.side, 4];

    if (state.y0) state.y0.destroy();
    if (state.y) state.y.forEach(y => y.destroy());
    if (state.v0) state.v0.destroy();
    if (state.v) state.v.forEach(v => v.destroy());
    if (state.texCoords) state.texCoords.destroy();


    state.y0 = gpu.array(null, shape);
    state.v0 = gpu.array(null, shape);

    state.y = new Array(5).fill().map(() => gpu.array(null, shape));
    state.v = new Array(5).fill().map(() => gpu.array(null, shape));

    state.texCoords = state.y[0].samplerCoords();
  }
};
