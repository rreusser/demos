module.exports = function (regl, opts) {
  var m = opts.n[0];
  var n = opts.n[1];

  function compose (ta, tb) {
    return [
      ta[0] * tb[0],
      ta[1] * tb[1],
      tb[0] * ta[2] + tb[2],
      tb[1] * ta[3] + tb[3],
    ];
  }

  function invert (t) {
    return [
      1 / t[0],
      1 / t[1],
      -t[2] / t[0],
      -t[3] / t[1]
    ];
  }

  // Clip coords ([1, 1]) to uv texture coords ([0, 1]):
  var cl2uv = [0.5, 0.5, 0.5, 0.5];

  // Cell-cnetered texture coords to vertex-centered texture coords:
  var uv2st = [
    m / (m - 1),
    n / (n - 1),
    -0.5 / (m - 1),
    -0.5 / (n - 1)
  ];

  // Vertex-centered texture coords to physical coordinates
  var xrange = opts.xrange[1] - opts.xrange[0];
  var yrange = opts.yrange[1] - opts.yrange[0];
  var di = 1 / (m - 1);
  var dj = 1 / (n - 1);
  var dx = xrange * di;
  var dy = yrange * dj;
  var dx2 = dx * dx;
  var dy2 = dy * dy;
  var lapden = 0.5 / (dx * dx + dy * dy);

  var st2xy = [
    xrange,
    yrange,
    opts.xrange[0],
    opts.yrange[0]
  ];

  // Invert:
  var uv2cl = invert(cl2uv);
  var st2uv = invert(uv2st);
  var xy2st = invert(st2xy);

  return regl({
    uniforms: {
      cl2uv: cl2uv,
      uv2cl: uv2cl,
      uv2st: uv2st,
      st2uv: st2uv,
      st2xy: st2xy,
      xy2st: st2xy,
      uv2xy: compose(uv2st, st2xy),
      xy2uv: compose(xy2st, st2uv),
      cl2st: compose(cl2uv, uv2st),
      st2cl: compose(st2uv, uv2cl),
      cl2xy: compose(compose(cl2uv, uv2st), st2xy),
      xy2cl: compose(compose(xy2st, st2uv), uv2cl),

      // Texture grid spacing:
      di: [di, dj],
      duv: [1 / m, 1 / n],

      // Physical grid spacing:
      h: [dx, dy],

      // Multiplier for first derivative:
      // 1 / (2 * xrange)
      der1: [0.5 / dx, 0.5 / dy],

      // Laplacian coeffients
      lap: [
        //0.25,
        //0.25,
        //-dx * dx * 0.25
        dy * dy * lapden,
        dx * dx * lapden,
        -dx * dx * dy * dy * lapden,
      ],

      dt: opts.dt,
    }
  });
};
