const normalize = require('gl-vec3/normalize')
const cross = require('gl-vec3/cross')
const subtract = require('gl-vec3/subtract')

module.exports = function fromFunction (f, nu, nv, computeNormals, uPeriodic, vPeriodic, uAnalytical, vAnalytical, attributes) {
  // It's much easier to think in terms of grid *lines*, so add one
  // and be done with it:
  nu += 1
  nv += 1

  let quads = {
    cells: [],
    positions: [],
  }

  for (let j = 0; j < nv; j++) {
    let v = j / (nv - 1)
    for (let i = 0; i < nu; i++) {
      let u = i / (nu - 1)
      quads.positions.push(f(u, v))
    }
  }

  if (attributes) {
    let fields = Object.keys(attributes)

    for (let k = 0; k < fields.length; k++) {
      let field = quads[fields[k]] = []

      for (let j = 0; j < nv; j++) {
        let v = j / (nv - 1)
        for (let i = 0; i < nu; i++) {
          let u = i / (nu - 1)
          field.push(attributes[fields[k]](u, v))
        }
      }
    }
  }


  for (let j = 0; j < nv - 1; j++) {
    for (let i = 0; i < nu - 1; i++) {
      let index = i + nu * j
      quads.cells.push([
        index,
        index + nu,
        index + nu + 1,
        index + 1
      ])
    }
  }

  let dimension = quads.positions[0].length

  if (dimension === 3 && computeNormals !== false) {
    quads.normals = []

    for (let j = 0; j < nv; j++) {
      let jm, jp, v, vm, vp;
      if (vAnalytical) {
        v = j / (nv - 1)
        vm = (j - 0.01) / (nv - 1)
        vp = (j + 0.01) / (nv - 1)
      } else {
        jm = vPeriodic ? ((j + nv - 1) % nv) : Math.max(j - 1, 0)
        jp = vPeriodic ? ((j + 1) % nv) : Math.min(j + 1, nv - 1)
      }

      for (let i = 0; i < nu; i++) {
        let im, ip, u, um, up;
        if (uAnalytical) {
          u = i / (nu - 1)
          um = (i - 0.01) / (nu - 1)
          up = (i + 0.01) / (nu - 1)
        } else {
          im = uPeriodic ? ((i + nu - 1) % nu) : Math.max(i - 1, 0)
          ip = uPeriodic ? ((i + 1) % nu) : Math.min(i + 1, nu - 1)
        }

        let target = []

        let dpdu, dpdv;

        if (uAnalytical) {
          dpdu = subtract([], f(up, v), f(um, v));
        } else {
          dpdu = subtract([], quads.positions[ip + nu * j], quads.positions[im + nu * j])
        }

        if (vAnalytical) {
          dpdv = subtract([], f(u, vp), f(u, vm));
        } else {
          dpdv = subtract([], quads.positions[i + nu * jp], quads.positions[i + nu * jm])
        }

        normalize(target, cross(target, dpdu, dpdv));

        quads.normals.push(target)
      }
    }
  }

  return quads
}
