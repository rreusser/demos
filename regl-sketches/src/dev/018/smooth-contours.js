module.exports = function (cells, positions, attributes) {
  let mesh = {
    cells: [],
    positions: [],
    xmap: [], // vec4: a, b, c, d
    ymap: [], // vec4: e, f, g, h
  }

  let attrs
  if (attributes) {
    attrs = Object.keys(attributes)

    for (let i = 0; i < attrs.length; i++) {
      mesh[attrs[i]] = attributes[attrs[i]].slice()
    }
  }

  let idx = positions.length;
  var j = 0;
  for (i = 0; i < cells.length; i++) {
    let cell = cells[i]

    if (cell.length !== 4) continue;

    mesh.cells.push([j, j + 1, j + 2]);
    mesh.cells.push([j + 3, j + 4, j + 5]);

    mesh.positions.push(positions[cell[0]]);
    mesh.positions.push(positions[cell[1]]);
    mesh.positions.push(positions[cell[2]]);

    mesh.positions.push(positions[cell[2]]);
    mesh.positions.push(positions[cell[3]]);
    mesh.positions.push(positions[cell[0]]);

    var xA = positions[cell[0]];
    var xB = positions[cell[1]];
    var xC = positions[cell[3]];
    var xD = positions[cell[2]];

    var cx = [
      xA[0],
      xB[0] - xA[0],
      xC[0] - xA[0],
      xA[0] + xD[0] - xC[0] - xB[0]
    ];

    var cy = [
      xA[1],
      xB[1] - xA[1],
      xC[1] - xA[1],
      xA[1] + xD[1] - xC[1] - xB[1]
    ];

    // Haha lol
    for (var k = 0; k < 6; k++) {
      mesh.xmap.push(cx);
      mesh.ymap.push(cy);
    }

    j += 6;
  }

  console.log('mesh:', mesh);

  return mesh
};
