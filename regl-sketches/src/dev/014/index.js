const glsl = require('glslify');
const regl = require('regl')({
  onDone: require('fail-nicely')(run)
});

function run (regl) {

  var ico = require('icosphere')(0);

  console.log('ico:', ico);

  const draw = regl({
    vert: `
      precision mediump float;
      attribute vec3 xyz;
      attribute float color;
      uniform float aspect;
      varying float c;
      void main () {
        c = color / 12.0;
        gl_Position = vec4(
          xyz.y * aspect,
          xyz.x,
          0,
          1
        );
      }
    `,
    frag: `
      precision mediump float;
      varying float c;
      void main () {
        gl_FragColor = vec4(vec3(c), 1);
      }
    `,
    attributes: {
      xyz: ico.positions,
      color: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    },
    uniforms: {
      aspect: ctx => ctx.framebufferHeight  / ctx.framebufferWidth
    },
    elements: ico.cells,
    count: ico.cells.length * 3
  });

  //regl.frame(({tick}) => {
    regl.clear({color: [0, 0, 0, 1], depth: 1});

    draw();
  //});

}
