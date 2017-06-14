var glsl = require('glslify');

module.exports = function (regl, funcs) {
  const makeInit = function (f) {
    const cmd = regl({
      vert: glsl(`
        precision mediump float;
        attribute vec2 cl;
        varying vec2 xy;
        uniform vec4 cl2xy;

        #pragma glslify: tr = require(./transform)

        void main () {
          xy = tr(cl, cl2xy);
          gl_Position = vec4(cl, 0, 1);
        }
      `),
      frag: glsl(`
        precision mediump float;
        varying vec2 xy;

        #pragma glslify: u0 = require(./u0)

        void main () {
          gl_FragColor = vec4(u0(xy), 1);
        }
      `),
      attributes: {cl: [-4, -4, 0, 4, 4, -4]},
      framebuffer: regl.prop('dst'),
      depth: {enable: false},
      count: 3
    });

    return function (fbo) {
      cmd({dst: fbo});
    }
  };

  var initU = makeInit(funcs.u);

  return function (grid) {
    initU(grid.u0);
  }
};
