const glslify = require('glslify');
const icosphere = require('icosphere');

module.exports = function (regl) {
  let ico = icosphere(3);

  return regl({
    frag: `
      void main () {
        gl_FragColor = vec4(0, 0, 0, 1);
      }
    `,
    vert: glslify(`
      #pragma glslify: flamm = require(./flamms-paraboloid)

      precision mediump float;
      uniform mat4 projection, view;
      uniform float rs, paraboloid;
      attribute vec3 xyz;
      void main () {
        vec3 pos = xyz * 0.98 * rs;
        pos.z -= paraboloid * flamm(rs, 20.0);
        gl_Position = projection * view * vec4(pos, 1);
      }
    `),
    uniforms: {
      rs: regl.prop('rs'),
      paraboloid: regl.prop('paraboloid')
    },
    attributes: {xyz: ico.positions},
    elements: ico.cells,
    count: ico.cells.length * 3
  });
}
