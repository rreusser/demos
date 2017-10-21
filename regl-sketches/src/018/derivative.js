module.exports = function derivative (dpdt, p, t) {
  var x, y, u, v, r2;
  var n = p.length;
  for (i = 0; i < n; i += 4) {
    x = p[i]
    y = p[i + 1]
    u = p[i + 2]
    v = p[i + 3]
    r2 = x * x + y * y;
    dpdt[i + 0] = u;
    dpdt[i + 1] = v;
    dpdt[i + 2] = -x * Math.pow(r2, 15);
    dpdt[i + 3] = -y * Math.pow(r2, 15);
  }
}
