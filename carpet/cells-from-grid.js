module.exports = function (dims) {
  var cells = [];
  for(var j = 0; j < dims[0] - 1; j++) {
    for(var i = 0; i < dims[1] - 1; i++) {
      var idx = i + j * dims[1];
      cells.push([idx, idx + 1, idx + dims[1]]);
      cells.push([idx + 1, idx + 1 + dims[1], idx + dims[1]]);
    }
  }
  return cells;
}
