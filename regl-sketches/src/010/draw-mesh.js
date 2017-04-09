'use strict';

const glsl = require('glslify');

module.exports = function (regl, mesh) {
  return regl({
    vert: `
      precision mediump float;
      attribute vec2 rth;
      //attribute vec2 barycentric;
      varying float psi, cp, rgrid;
      varying vec2 b, uv;
      uniform mat4 modelview;
      uniform vec2 mu, gridSize;
      uniform float r0, theta0, n, circulation, scale, rsize, alpha, colorScale;
      #define OPI2 0.15915494309

      vec2 cdiv (vec2 a, vec2 b) {
        return vec2(a.x * b.x + a.y * b.y, a.y * b.x - a.x * b.y) / dot(b, b);
      }

      vec2 cmul (vec2 a, vec2 b) {
        return vec2(a.x * b.x - a.y * b.y, a.y * b.x + a.x * b.y);
      }

      vec2 csqr (vec2 a) {
        return vec2(a.x * a.x - a.y * a.y, 2.0 * a.x * a.y);
      }

      vec2 cinv (vec2 a) {
        return vec2(a.x, -a.y) / dot(a, a);
      }

      float cmag2 (vec2 a) {
        return dot(a, a);
      }

      vec2 clog (vec2 a) {
        return vec2(
          0.5 * log(cmag2(a)),
          atan(a.y, a.x)
        );
      }

      void main () {
        uv = rth;
        uv.x = pow(uv.x, 0.6666666);
        uv *= gridSize;
        uv.y *= OPI2;

        //b = barycentric;
        rgrid = rth.x;
        float r = 1.0 + rgrid * rsize;
        float theta = rth.y + theta0;
        vec2 rot = vec2(cos(alpha), sin(alpha));
        vec2 zeta = r * vec2(cos(theta), sin(theta));

        // Compute 1 + 1 / zeta and 1 - 1 / zeta:
        vec2 oz = cinv(r0 * zeta + mu);
        vec2 opz = oz;
        vec2 omz = -oz;
        opz.x += 1.0;
        omz.x += 1.0;

        // Exponentiate both of the above:
        float opznarg = atan(opz.y, opz.x) * n;
        float opznmod = pow(dot(opz, opz), n * 0.5);

        // (1 + 1 / (zeta + mu)) ** n:
        vec2 opzn = opznmod * vec2(cos(opznarg), sin(opznarg));

        float omznarg = atan(omz.y, omz.x) * n;
        float omznmod = pow(dot(omz, omz), n * 0.5);

        // (1 - 1 / (zeta + mu)) ** n:
        vec2 omzn = omznmod * vec2(cos(omznarg), sin(omznarg));

        // Compute the potential:
        vec2 circ = vec2(0.0, circulation * OPI2);
        vec2 wt = rot - cdiv(csqr(cinv(zeta)), rot) + cdiv(circ, zeta);

        // Compute the final coordinate, z:
        vec2 z = n * cdiv(opzn + omzn, opzn - omzn);
        //vec2 z = mu + r0 * zeta;

        // Compute the jacobian:
        vec2 dzdzeta = 4.0 * n * n * cdiv(cmul(opzn, omzn), cmul(csqr(r0 * zeta + mu) - vec2(1, 0), csqr(opzn - omzn)));
        //vec2 dzdzeta = vec2(1, 0);

        cp = 1.0 - cmag2(cdiv(wt, dzdzeta)) * colorScale;

        // Compute z^2 - 1
        psi = (r - 1.0 / r) * sin(theta + alpha) + circulation * OPI2 * log(r);

        //z.x -= n;
        //z /= scale;
        //z.x += 0.5;
        //z *= 4.0;

        gl_Position = modelview * vec4(z, 0, 1);
      }
    `,
    frag: glsl(`
      #extension GL_OES_standard_derivatives : enable
      precision mediump float;
      #pragma glslify: colormap = require(glsl-colormap/viridis)
      varying float psi, cp, rgrid;
      varying vec2 uv;
      uniform float cpAlpha, streamAlpha, gridAlpha;
      #pragma glslify: grid = require(glsl-solid-wireframe/cartesian/scaled)
      const float feather = 1.0;
      void main () {
        float boundary = grid(rgrid, 3.0, feather);
        float pressure = 1.0 - (1.0 - grid(cp * 20.0, feather)) * cpAlpha;
        float stream = (1.0 - grid(10.0 * psi, 1.0)) * streamAlpha;
        vec3 color = colormap(max(0.0, min(1.0, cp))).xyz;

        float gridLines = (1.0 - grid(uv, 1.0, feather)) * gridAlpha;
        color *= 1.0 - gridLines;

        gl_FragColor = vec4((color * pressure + stream) * boundary, 1);
      }
    `),
    attributes: {
      rth: mesh.positions,
      //barycentric: mesh.barycentric,
    },
    depth: {
      enable: false
    },
    elements: mesh.cells,
    count: mesh.cells.length * 3
  });

};
