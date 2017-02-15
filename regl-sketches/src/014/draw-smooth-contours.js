module.exports = function (regl, cells, positions) {
  return regl({
    vert: `
      precision mediump float;
      attribute vec2 position;
      uniform mat3 view;
      void main () {
        gl_Position = vec4(view * vec3(position, 0), 1);
      }
    `,
    frag: `
      precision mediump float;
      void main () {
        gl_FragColor = vec4(1);
      }
    `,
    attributes: {
      position: positions
    },
    elements: cells,
    count: cells.length * 3
  });
}
