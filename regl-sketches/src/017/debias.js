module.exports = function debias (y) {
  let min = Infinity;
  let max = -Infinity;
  let sum = 0;
  for (let i = 0; i < y.length; i++) {
    sum += y[i];
  }
  sum /= y.length;
  for (let i = 0; i < y.length; i++) {
    y[i] -= sum;
    min = Math.min(min, y[i]);
    max = Math.max(max, y[i]);
  }
  return [min, max, Math.max(Math.abs(min), Math.abs(max))];
}
