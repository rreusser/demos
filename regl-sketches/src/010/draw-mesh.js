'use strict';

const glsl = require('glslify');

module.exports = function (regl, mesh) {
  return regl({
    vert: `
      precision mediump float;
      attribute vec2 rth;
      //attribute vec2 barycentric;
      varying float psi, cp, r0;
      varying vec2 b;
      uniform mat3 view;
      uniform vec2 x0;
      uniform float radius, theta0, n, circulation, scale;
      #define OPI2 0.15915494309
      void main () {
        //b = barycentric;
        r0 = rth.x;
        float rad = 1.0 + rth.x * scale * 1.0;
        float r2 = rad * rad;
        float theta = rth.y + theta0;
        float r = rad * radius;
        float sth = sin(theta);
        float cth = cos(theta);
        vec2 xy = x0 + r * vec2(cth, sth);

        float det = xy.x * xy.x + xy.y * xy.y;
        vec2 opz = vec2(1.0 + xy.x / det, -xy.y / det);
        vec2 omz = vec2(1.0 - xy.x / det, xy.y / det);

        float opznarg = atan(opz.y, opz.x) * n;
        float opznmod = pow(dot(opz, opz), n * 0.5);
        vec2 opzn = opznmod * vec2(cos(opznarg), sin(opznarg));

        float omznarg = atan(omz.y, omz.x) * n;
        float omznmod = pow(dot(omz, omz), n * 0.5);
        vec2 omzn = omznmod * vec2(cos(omznarg), sin(omznarg));

        vec2 num = opzn + omzn;
        vec2 den = opzn - omzn;

        xy = n / dot(den, den) * vec2(
          den.x * num.x + den.y * num.y,
          den.x * num.y - den.y * num.x
        );

        xy.x -= n;
        xy /= scale;
        xy.x += 0.5;
        xy *= 4.0;

        psi = 10.0 * (rad - 1.0 /  rad) * sth + circulation * OPI2 * log(rad);

        float vr = 10.0 * (1.0 - 1.0 / r2) * cth;
        float vth = -10.0 * (1.0 + 1.0 / r2) * sth - circulation * OPI2 / rad;

        float k1 = circulation * OPI2 * 0.1;
        cp = 1.0 - (vr * vr + vth * vth) * 0.01;

        vec2 pos = (view * vec3(xy, 1)).xy;
        gl_Position = vec4(pos, 0, 1);
      }
    `,
    frag: glsl(`
      #extension GL_OES_standard_derivatives : enable
      precision mediump float;
      #pragma glslify: colormap = require(glsl-colormap/viridis)
      varying float psi, cp, r0;
      uniform float cpAlpha, streamAlpha;
      #pragma glslify: grid = require(glsl-solid-wireframe/cartesian/scaled)
      void main () {
        float boundary = grid(r0, 3.0, 1.0);
        float pressure = 1.0 - (1.0 - grid(cp * 2.0, 1.0)) * cpAlpha;
        float stream = (1.0 - grid(psi, 1.0)) * streamAlpha;
        vec3 color = colormap(fract(1.0 + 0.12 * (cp - 1.0))).xyz;
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
