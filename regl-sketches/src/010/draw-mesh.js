'use strict';

const glsl = require('glslify');

module.exports = function (regl, mesh) {
  return regl({
    vert: `
      precision mediump float;
      attribute vec2 rth;
      //attribute vec2 barycentric;
      varying float psi, cp, r0;
      varying vec2 b, uv;
      uniform mat3 view;
      uniform vec2 x0, gridSize;
      uniform float radius, theta0, n, circulation, scale, size, alpha;
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

      void main () {
        uv = rth;
        uv.x = pow(uv.x, 0.66666666);
        uv *= gridSize;
        uv.y *= OPI2;

        //b = barycentric;
        r0 = rth.x;
        float rad = 1.0 + rth.x * size;
        float r2 = rad * rad;
        float theta = rth.y + theta0;
        float r = rad * radius;
        float sth = sin(theta);
        float cth = cos(theta);
        vec2 z = x0 + r * vec2(cth, sth);

        float det = z.x * z.x + z.y * z.y;
        vec2 opz = vec2(1.0 + z.x / det, -z.y / det);
        vec2 omz = vec2(1.0 - z.x / det, z.y / det);

        float opznarg = atan(opz.y, opz.x) * n;
        float opznmod = pow(dot(opz, opz), n * 0.5);
        vec2 opzn = opznmod * vec2(cos(opznarg), sin(opznarg));

        float omznarg = atan(omz.y, omz.x) * n;
        float omznmod = pow(dot(omz, omz), n * 0.5);
        vec2 omzn = omznmod * vec2(cos(omznarg), sin(omznarg));

        vec2 num = opzn + omzn;
        vec2 den = opzn - omzn;

        z = n / dot(den, den) * vec2(
          den.x * num.x + den.y * num.y,
          den.x * num.y - den.y * num.x
        );

        // Compute z^2 - 1
        psi = (rad - 1.0 / rad) * sin(theta + alpha) + circulation * OPI2 * log(rad);

        vec2 z2m1 = csqr(z);
        z2m1.x -= 1.0;
        vec2 jac = 4.0 * n * n * cdiv(cdiv(cmul(opzn, omzn), csqr(opzn - omzn)), z2m1);

        vec2 v = cdiv(vec2(
          (1.0 - 1.0 / r2) * cos(theta + alpha),
          -(1.0 + 1.0 / r2) * sin(theta + alpha) - circulation * OPI2 / rad
        ), jac);

        cp = 1.0 - dot(v, v);

        z.x -= n;
        z /= scale;
        z.x += 0.5;
        z *= 4.0;

        vec2 pos = (view * vec3(z, 1)).xy;
        gl_Position = vec4(pos, 0, 1);
      }
    `,
    frag: glsl(`
      #extension GL_OES_standard_derivatives : enable
      precision mediump float;
      #pragma glslify: colormap = require(glsl-colormap/viridis)
      varying float psi, cp, r0;
      varying vec2 uv;
      uniform float cpAlpha, streamAlpha, colorScale, gridAlpha;
      #pragma glslify: grid = require(glsl-solid-wireframe/cartesian/scaled)
      void main () {
        float boundary = grid(r0, 3.0, 1.0);
        float pressure = 1.0 - (1.0 - grid(cp * 2.0, 1.0)) * cpAlpha;
        float stream = (1.0 - grid(10.0 * psi, 1.0)) * streamAlpha;
        float gridLines = (1.0 - grid(uv, 1.0)) * gridAlpha;
        vec3 color = colormap(max(0.0, min(1.0, 1.0 - colorScale * (1.0 - cp)))).xyz;
        color *= 1.0 - gridLines;
        color.x += gridLines;
        gl_FragColor = vec4((color * pressure + stream) * boundary, 1);
      }
    `),
    attributes: {
      rth: mesh.positions,
      //barycentric: mesh.barycentric,
    },
    elements: mesh.cells,
    count: mesh.cells.length * 3
  });

};
