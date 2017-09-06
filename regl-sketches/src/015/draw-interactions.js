module.exports = function (regl) {
  return regl({
    vert: `
      precision mediump float;
      attribute vec4 pSrc, pDst;
      attribute float tInt;
      uniform float time, aspectRatio, dtInt;

      void main () {
        float dt = (time - tInt) / dtInt;
        vec2 src = pSrc.xy;
        vec2 dst = pDst.xy + pDst.zw * dtInt;
        gl_Position = vec4(
          src.x * (1.0 - dt) + dst.x * dt,
          (src.y * (1.0 - dt) + dst.y * dt) * aspectRatio,
          //(pSrc.x + (1.0 - dt) + pDst.x * dt),
          //(pSrc.y + (1.0 - dt) + pDst.y * dt) * aspectRatio,
          0,
          1
        );
        gl_PointSize = 2.0;
      }
    `,
    frag: `
      precision mediump float;

      void main () {
        gl_FragColor = vec4(1, 1, 0, 1);
      }
    `,
    attributes: {
      pSrc: regl.prop('pSrc'),
      pDst: regl.prop('pDst'),
      tInt: regl.prop('tInt')
    },
    uniforms: {
      dtInt: regl.prop('dtInt'),
      aspectRatio: ctx => ctx.framebufferWidth / ctx.framebufferHeight,
      time: regl.prop('time')
    },
    count: regl.prop('n'),
    depth: {enable: false},
    primitive: 'points',
  });
};

