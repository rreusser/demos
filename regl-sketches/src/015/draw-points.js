module.exports = function (regl) {
  return regl({
    vert: `
      precision mediump float;
      uniform sampler2D src;
      attribute vec2 uv;
      void main () {
        vec2 xy = texture2D(src, uv).xy;
        gl_Position = vec4(xy, 0, 1);
        gl_PointSize = 1.0;
      }
    `,
    frag: `
      precision mediump float;
      void main () {
        gl_FragColor = vec4(vec3(1.0), 0.2);
      }
    `,
    attributes: {
      uv: regl.prop('positions')
    },
    uniforms: {
      src: regl.prop('src'),
    },
    blend: {
      enable: true,
      func: {
        srcRGB: 'src alpha',
        srcAlpha: 1,
        dstRGB: 1,
        dstAlpha: 1
      },
      equation: {
        rgb: 'add',
        alpha: 'add'
      },
    },
    depth: {enable: false},
    count: regl.prop('n'),
    primitive: 'points',
  });
};
