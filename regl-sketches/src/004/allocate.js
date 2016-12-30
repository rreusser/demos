const randn = require('random-normal');
const ndarray = require('ndarray');
const cwise = require('cwise');

module.exports = function (gpu) {
  return function (opts) {
    const y0 = gpu.array(null, opts.shape);
    const v0 = gpu.array(null, opts.shape);

    const y = new Array(5).fill().map(() => gpu.array(null, opts.shape));
    const v = new Array(5).fill().map(() => gpu.array(null, opts.shape));

    const texCoords = y[0].samplerCoords();

    return {y0, v0, y, v, texCoords};
  }
};
