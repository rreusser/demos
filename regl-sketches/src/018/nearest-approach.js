module.exports = function (x, i1, i2) {
  var xba = x[i2    ] - x[i1    ];
  var yba = x[i2 + 1] - x[i1 + 1];
  var uba = x[i2 + 2] - x[i1 + 2];
  var vba = x[i2 + 3] - x[i1 + 3];

  return -(xba * uba + yba * vba) / (uba * uba + vba * vba);
};
