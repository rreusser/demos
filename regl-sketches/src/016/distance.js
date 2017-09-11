module.exports = function (x, i1, i2) {
  var xba = x[i2    ] - x[i1    ];
  var yba = x[i2 + 1] - x[i1 + 1];

  return xba * xba + yba * yba;
};
