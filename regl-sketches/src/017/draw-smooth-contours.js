const glsl = require('glslify');

module.exports = function (regl, mesh) {
  return regl({
    vert: `
      precision mediump float;
      attribute vec2 position;
      attribute vec4 xmap, ymap;
      varying vec4 xc, yc;
      uniform mat3 view;
      varying vec2 xy;
      void main () {
        xy = position;
        xc = xmap;
        yc = ymap;
        gl_Position = vec4(view * vec3(position, 0), 1);
      }
    `,
    frag: glsl(`
      precision mediump float;
      #pragma glslify: quadratic = require(./quadratic)
      varying vec2 xy;
      varying vec4 xc, yc;

      void main () {
        vec2 roots = quadratic(
          yc.w * xc.z - yc.z * xc.w,
          yc.y * xc.z + yc.w * (xc.x - xy.x) + xc.w * (xy.y - yc.x) - yc.z * xc.y,
          xc.y * (xy.y - yc.x) + yc.y * (xc.x - xy.x)
        );

        float v = roots.y >= 0.0 && roots.y <= 1.0 ? roots.y : roots.x;
        float u = (xy.x - xc.x - xc.z * v) / (xc.y + xc.w * v);

        gl_FragColor = vec4(u, v, 0, 1);
      }
    `),
    attributes: {
      position: mesh.positions,
      xmap: mesh.xmap,
      ymap: mesh.ymap
    },
    elements: mesh.cells,
    count: mesh.cells.length * 3
  });
}
