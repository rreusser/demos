'use strict';

var corners = [
  [0, 0, 0],
  [0, 0, 1],
  [0, 1, 0],
  [0, 1, 1],
  [1, 0, 0],
  [1, 0, 1],
  [1, 1, 0],
  [1, 1, 1],
];

module.exports = function computeExtents (bbox, eye) {
  var near = Infinity;
  var far = 0;

  for (var i = 0; i < 8; i++) {
    var dx = bbox[corners[i][0]][0] - eye[0];
    var dy = bbox[corners[i][1]][1] - eye[1];
    var dz = bbox[corners[i][2]][2] - eye[2];
    var r2 = dx * dx + dy * dy + dz * dz;
    near = Math.min(near, r2);
    far = Math.max(far, r2);
  }

  return [Math.sqrt(near), Math.sqrt(far)];
};
