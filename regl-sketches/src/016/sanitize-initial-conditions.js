module.exports = function sanitizeInitialConditions (y) {
  // Subtract off the average position + momentum:
  var x = [0, 0, 0, 0, 0, 0]
  for (i = 0; i < n * 6; i += 6) {
    for (j = 0; j < 6; j++) {
      x[j] += y[i + j];
    }
  }
  for (i = 0; i < n * 6; i+=6) {
    for (j = 0; j < 6; j++) {
      y[i + j] -= x[j] / n;
    }
  }

  return y;
};
