module.exports = function (n) {
  var i;
  var x = new Float32Array(n * 4);
  var vmag = 0.2;

  for (i = 0; i < n * 4; i+=4) {
    // Position:
    var th = i / n / 4 * Math.PI * 2;
    //var th = Math.random() * Math.PI * 2;
    var r = 0.2;
    //var r = Math.random();
    x[i + 0] = Math.cos(th) * r;
    x[i + 1] = Math.sin(th) * r;

    // Velocity:
    x[i + 2] = 0;
    x[i + 3] = 0;
    //x[i + 2] = (Math.random() * 2 - 1) * vmag;
    //x[i + 3] = (Math.random() * 2 - 1) * vmag;
    //x[i + 2] = 0;//x[i];
    //x[i + 3] = 0;//x[i + 1];
  }

  //return x;
  /*return [
    -0.5, -0.5, 0.25, 0.3,
    0.5,  -0.5, -0.25, 0.3,
  ];*/

  return [
    -0.6, -0.5, 0, 1,
    -0.3, -0.5, 0, 1,
    0.0, -0.5, 0, 1,
    0.3, -0.5, 0, 1,
    0.6, -0.5, 0, 1,
  ]
}
