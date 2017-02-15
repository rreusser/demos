module.exports = function (cells, positions, attributes) {
  let mesh = {
    cells: [],
    positions: positions.slice(),
    barycentric: []
  }

  let attrs
  if (attributes) {
    attrs = Object.keys(attributes)

    for (let i = 0; i < attrs.length; i++) {
      mesh[attrs[i]] = attributes[attrs[i]].slice()
    }
  }

  let idx = positions.length;
  for (i = 0; i < cells.length; i++) {
    let cell = cells[i]

    switch(cell.length) {
      case 3:
        mesh.cells.push([cell[0], cell[1], cell[2]])
        break
      case 4:
        mesh.cells.push([cell[0], cell[1], cell[2]])
        mesh.cells.push([cell[2], cell[3], cell[0]])

        break
    }
  }

  return mesh
};
