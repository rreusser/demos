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
function weightedMean (a, b, c, d) {
  var m = mean(a, b, c, d);
  var dx = [a - m, b - m, c - m, d - m];
  var w = dx.map(x => 1 / (1e-8 + m * m + x * x));
  return m + (dx[0] * w[0] + dx[1] * w[1] + dx[2] * w[2] + dx[3] * w[3]) * 0.25 / (w[0] + w[1] + w[2] + w[3]);
}

function dot (a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function length(a) {
  return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
}

function angle (a, b) {
  return Math.acos(dot(a, b) / (length(a) * length(b) + 1e-15));
}

function cross (a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ];
}

function sub (b, a) {
  return [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
}

module.exports = function (dims, data, xy) {
  var cells = [];
  var idx = data.length;
  console.log('data.length:', data.length);
  for(var j = 0; j < dims[0] - 1; j++) {
    for(var i = 0; i < dims[1] - 1; i++) {
      var a = i + j * dims[1];
      var b = a + 1;
      var c = a + dims[1];
      var d = b + dims[1];
      if (false) {
        // c d
        // a b

        var va = [xy[a * 2], xy[a * 2 + 1], data[a]];
        var vb = [xy[b * 2], xy[b * 2 + 1], data[b]];
        var vc = [xy[c * 2], xy[c * 2 + 1], data[c]];
        var vd = [xy[d * 2], xy[d * 2 + 1], data[d]];

        // Get the angle between normals of triangls abc and bdc, i.e. if the quad is
        // split along the b-c line:
        var nabc = cross(sub(vb, va), sub(vc, va));
        var nbdc = cross(sub(vc, vd), sub(vb, vd));
        var angBC = angle(nabc, nbdc);

        // Get the angle between normals of triangls abd and dca, i.e. if the quad is
        // split along the a-d line:
        var nabd = cross(sub(vd, vb), sub(va, vb));
        var ndca = cross(sub(va, vc), sub(vd, vc));
        var angAD = angle(nabd, ndca);
        //console.log('angAD, angBC:', angAD, angBC);

        if (angAD < angBC) {
          cells.push([a, b, c]);
          cells.push([d, c, b]);
        } else {
          cells.push([a, d, c]);
          cells.push([a, b, d]);
        }
      } else {
        cells.push([a, b, idx]);
        cells.push([b, d, idx]);
        cells.push([d, c, idx]);
        cells.push([c, a, idx]);
        data.push(weightedMean(data[a], data[b], data[c], data[d]));
        xy.push(mean(xy[a * 2], xy[b * 2], xy[c * 2], xy[d * 2]));
        xy.push(mean(xy[a * 2 + 1], xy[b * 2 + 1], xy[c * 2 + 1], xy[d * 2 + 1]));
      }
      idx++;
    }
  }

  return cells;
}
