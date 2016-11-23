/* This function converts a quad grid into numbered tris. It splits
 * them by the midpoint, i.e.:
 *
 *   c ------- d       c ------- d
 *   |         |       | \     / |
 *   |         |       |  \   /  |
 *   |         |  -->  |    O    |
 *   |         |       |  /   \  |
 *   |         |       | /     \ |
 *   a ------- b       a ------- b
 *
 * This is done to avoid ugly artifacts for which the contours get
 * all jagged close to sharp corners.
 */

function mean (a, b, c, d) {
  return 0.25 * (a + b + c + d);
}

function harmonicMean (a, b, c, d) {
  return 4 / (1 / a + 1 / b + 1 / c + 1 / d);
}

function contraharmonicMean (a, b, c, d) {
  return (a * a + b * b + c * c + d * d) / (a + b + c + d);
}

// This just weights the mean toward the arithmetic mean a bit more... totally
// ad hoc. Didn't have the effect I was looking for but seems fine...
function customMean (a, b, c, d) {
  var m = mean(a, b, c, d);
  var dx = [a - m, b - m, c - m, d - m];
  var w = dx.map(x => 1 / (1e-8 + m * m + x * x));
  return m + (dx[0] * w[0] + dx[1] * w[1] + dx[2] * w[2] + dx[3] * w[3]) * 0.25 / (w[0] + w[1] + w[2] + w[3]);
}

module.exports = function (dims, data, xy) {
  var cells = [];
  var idx = data.length;
  for(var j = 0; j < dims[0] - 1; j++) {
    for(var i = 0; i < dims[1] - 1; i++) {
      var a = i + j * dims[1];
      var b = a + 1;
      var c = a + dims[1];
      var d = b + dims[1];
      cells.push([a, b, c]);
      cells.push([d, c, b]);
      //cells.push([a, b, idx]);
      //cells.push([b, d, idx]);
      //cells.push([d, c, idx]);
      //cells.push([c, a, idx]);
      //data.push(customMean(data[a], data[b], data[c], data[d]));
      //xy.push(mean(xy[a * 2], xy[b * 2], xy[c * 2], xy[d * 2]));
      //xy.push(mean(xy[a * 2 + 1], xy[b * 2 + 1], xy[c * 2 + 1], xy[d * 2 + 1]));
      idx++;
    }
  }

  return cells;
}
