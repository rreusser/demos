const extend = require('xtend/mutable');

module.exports = function (material) {
  const dragon = require('stanford-dragon/3');
  dragon.positions = require('geom-center-and-normalize')(dragon.positions);
  dragon.normals = require('angle-normals')(dragon.cells, dragon.positions);

  extend(dragon, material);

  return dragon;
};
