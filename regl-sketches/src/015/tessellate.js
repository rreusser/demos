function mean () {
  let len = arguments[0].length
  let n = arguments.length;
  let avg = []
  for (let i = 0; i < len; i++) {
    avg[i] = 0
  }
  for (let i = 0; i < n; i++) {
    let arg = arguments[i]
    for (let j = 0; j < len; j++) {
      avg[j] += arg[j] / n
    }
  }
  return avg;
}

module.exports = function tessellate (cells, positions, subdivide, attributes) {
  let mesh = {
    cells: [],
    positions: positions.slice()
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
        mesh.cells.push(positions[cell[0]])
        mesh.cells.push(positions[cell[1]])
        mesh.cells.push(positions[cell[2]])
        break
      case 4:
        if (subdivide) {
          let pcen = mean(
            positions[cell[0]],
            positions[cell[1]],
            positions[cell[2]],
            positions[cell[3]]
          )

          mesh.positions.push(pcen);

          mesh.cells.push([cell[0], cell[1], idx])
          mesh.cells.push([cell[1], cell[2], idx])
          mesh.cells.push([cell[2], cell[3], idx])
          mesh.cells.push([cell[3], cell[0], idx])

          if (attributes) {
            for (let j = 0; j < attrs.length; j++) {
              let attr = attributes[attrs[j]];
              mesh[attrs[j]].push(mean(
                attr[cell[0]],
                attr[cell[1]],
                attr[cell[2]],
                attr[cell[3]]
              ))
            }
          }

          idx++;
        } else {
          mesh.cells.push([cell[0], cell[1], cell[2]])
          mesh.cells.push([cell[2], cell[3], cell[0]])
        }

        break
    }
  }

  return mesh
}
