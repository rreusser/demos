const hsl2rgb = require('float-hsl2rgb');

module.exports = function (i, imax, l) {
  return hsl2rgb([(i + 0.65) / imax, 0.65, l === undefined ? 0.65 : l]);
};
