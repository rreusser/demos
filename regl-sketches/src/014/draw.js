module.exports = function (regl) {
  return regl({
    vert: `
      precision mediump float;
      attribute vec2 cl;
      varying vec2 uv;
      void main () {
        uv = cl * 0.5 + 0.5;
        gl_Position = vec4(cl, 0, 1);
      }
    `,
    frag: `
      precision mediump float;
      varying vec2 uv;
      uniform sampler2D u;
      void main () {
        vec4 color = texture2D(u, uv) * 0.05 + 0.5;
        gl_FragColor = vec4(
          color.x * color.z,
          color.z - 0.5,
          color.y * color.z,
          1.0
        );
      }
    `,
    attributes: {cl: [-4, -4, 0, 4, 4, -4]},
    uniforms: {
      u: (ctx, props) => props.src.u0
    },
    framebuffer: regl.prop('dst'),
    depth: {enable: false},
    count: 3
  });
};
