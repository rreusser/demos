module.exports = function (regl, n) {
  return regl({
    vert: `
      precision mediump float;
      attribute vec4 x;
      uniform float t, aspectRatio;

      void main () {
        gl_Position = vec4(
          x.x,
          x.y * aspectRatio,
          0,
          1
        );
        gl_PointSize = 4.0;
      }
    `,
    frag: `
      precision mediump float;

      void main () {
        gl_FragColor = vec4(0, 1, 1, 1);
      }
    `,
    depth: {
      enable: false
    },
    primitive: 'points',
    attributes: {
      x: regl.prop('x'),
    },
    uniforms: {
      t: regl.prop('t'),
      aspectRatio: ctx => ctx.framebufferWidth / ctx.framebufferHeight
    },
    count: (ctx, props) => props.x.length / 4
  });
};

