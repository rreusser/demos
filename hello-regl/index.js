const regl = require('regl')();
const bunny = require('bunny');
const camera = require('regl-camera')(regl);
const angleNormals = require('angle-normals');

const drawBunny = regl({
  vert: `
    precision mediump float;
    attribute vec3 position, normal;
    uniform mat4 projection, view;
    varying vec3 color;
    void main () {
      color = normal;
      gl_Position = projection * view * vec4(position, 1);
    }
  `,
  frag: `
    precision mediump float;
    varying vec3 color;
    void main () {
      gl_FragColor = vec4(color, 1);
    }
  `,
  attributes: {
    position: bunny.positions,
    normal: angleNormals(bunny.cells, bunny.positions)
  },
  elements: bunny.cells
});

regl.frame(() => {
  regl.clear({color: [0, 0, 0, 1]});
  camera(() => {
    drawBunny();
  });
});
