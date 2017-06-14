module.exports = function (regl) {
  const draw = regl({
    vert: `
      precision mediump float;
      attribute vec3 position;
      uniform mat4 projection, view;
      void main () {
        gl_Position = projection * view * vec4(position, 1);
      }
    `,
    frag: `
      precision mediump float;
      void main () {
        gl_FragColor = vec4(1);
      }
    `,
    attributes: {
      position: mesh.positions
    },
    elements: mesh.cells,
    count: mesh.cells.length * 3
  });
}
